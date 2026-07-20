"use client";

import { useMemo, useState, useTransition, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assembleCarousel } from "@/lib/ds/assemble";
import { PreviewFrame } from "@/components/preview-frame";
import { namedBlobs, downloadNamedBlobs } from "@/lib/export/download";
import { captureCarousel } from "@/lib/export/capture";
import type { ModelId } from "@/lib/ai/registry";
import type { SlidePlan } from "@/lib/ds/schema";
import { briefAction, planAction, reviseAction, uploadSingleImageAction, publishAction, getPublishingConfigAction } from "./actions";
import { saveExportedCarouselAction, markCarouselStatusAction, deleteCarouselAction } from "@/app/history/actions";
import { Sparkles, Brain, Zap, RotateCcw, Check, Send, Eye, FileText, LayoutGrid, User, Upload, Clock, CheckCircle2, XCircle, AlertCircle, Calendar, Globe, ArrowLeft, Search, ChevronDown, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

interface Message {
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

const modelDetails: Record<string, { label: string; vendor: string; description: string; icon: React.ReactNode }> = {
  gemini: {
    label: "Gemini Flash",
    vendor: "Google AI",
    description: "Model cepat & cerdas dari Google (Gratis)",
    icon: <Sparkles className="size-4 text-indigo-500 shrink-0" />,
  },
  deepseek: {
    label: "DeepSeek Chat",
    vendor: "DeepSeek AI",
    description: "Reasoning & content model dari DeepSeek",
    icon: <Brain className="size-4 text-cyan-500 shrink-0" />,
  },
  mimo: {
    label: "MIMO",
    vendor: "Xiaomi AI",
    description: "OpenAI-compatible inference engine",
    icon: <Zap className="size-4 text-amber-500 shrink-0" />,
  },
  openrouter: {
    label: "OpenRouter",
    vendor: "OpenRouter",
    description: "Multi-vendor AI model gateway",
    icon: <Globe className="size-4 text-rose-500 shrink-0" />,
  },
  omniroute: {
    label: "OmniRoute",
    vendor: "OmniRoute AI",
    description: "Unified AI model gateway & router",
    icon: <Zap className="size-4 text-purple-500 shrink-0" />,
  },
};

function summarizeError(msg: string): string {
  const lower = msg.toLowerCase();
  
  if (lower.includes("quota exceeded") || lower.includes("exceeded your current quota") || lower.includes("rate limit") || lower.includes("rate-limits")) {
    return "Batas kuota API Gemini terlampaui (Rate Limit / Quota Exceeded). Silakan coba beberapa saat lagi.";
  }
  if (lower.includes("high demand") || lower.includes("experiencing high demand")) {
    return "Server model sedang sibuk karena permintaan tinggi (High Demand). Silakan coba lagi nanti.";
  }
  if (lower.includes("invalid api key") || lower.includes("api key not valid") || lower.includes("api_key")) {
    return "Konfigurasi API Key tidak valid. Silakan periksa kembali berkas .env Anda.";
  }
  if (lower.includes("no longer available") || lower.includes("not available")) {
    return "Model yang dipilih sudah tidak tersedia atau tidak aktif.";
  }
  
  if (msg.length > 120) {
    const lastErrorIdx = msg.lastIndexOf("Last error: ");
    if (lastErrorIdx !== -1) {
      const sub = msg.substring(lastErrorIdx + "Last error: ".length);
      const firstSentence = sub.split(".")[0] || sub;
      return firstSentence.replace(/^AI_APICallError:\s*/i, "").trim();
    }
    return "Terjadi kesalahan pada sistem AI.";
  }
  
  return msg;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onloadend = () => res(reader.result as string);
    reader.onerror = rej;
    reader.readAsDataURL(blob);
  });
}

function compressImageBlob(blob: Blob, maxWidth = 360): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas context not available"));
        return;
      }
      
      const scale = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * scale;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      resolve(dataUrl);
    };
    img.onerror = (e) => reject(e);
  });
}

/** Read the vourdev-meta block (title/caption/hashtags) from an uploaded HTML carousel. */
function parseMeta(html: string): { title: string; caption: string; hashtags: string[] } {
  const m = html.match(/<script[^>]*id="vourdev-meta"[^>]*>([\s\S]*?)<\/script>/);
  if (m) {
    try {
      const j = JSON.parse(m[1]);
      return {
        title: typeof j.title === "string" ? j.title : "Untitled",
        caption: typeof j.caption === "string" ? j.caption : "",
        hashtags: Array.isArray(j.hashtags) ? j.hashtags : [],
      };
    } catch {
      // fall through
    }
  }
  return { title: "Untitled", caption: "", hashtags: [] };
}

function countSections(html: string): number {
  return (html.match(/<section[\s>]/g) ?? []).length;
}

// Simple React Markdown Renderer
function renderMarkdown(md: string) {
  if (!md) return <p className="text-muted-foreground italic text-xs">Brief outline kosong...</p>;
  
  const lines = md.split("\n");
  const elements: React.ReactNode[] = [];
  
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ")) {
      elements.push(
        <h1 key={idx} className="text-xl font-bold tracking-tight text-foreground border-b pb-1 mt-4 mb-2 first:mt-0 font-heading">
          {trimmed.substring(2)}
        </h1>
      );
    } else if (trimmed.startsWith("## ")) {
      const text = trimmed.substring(3);
      const isSlide = text.toLowerCase().includes("slide");
      elements.push(
        <h2 key={idx} className={`text-sm font-semibold tracking-tight mt-4 mb-1.5 font-heading ${
          isSlide 
            ? "text-primary border-l-2 border-primary pl-2 bg-primary/5 py-0.5 rounded-r" 
            : "text-foreground border-b pb-0.5"
        }`}>
          {text}
        </h2>
      );
    } else if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={idx} className="text-xs font-semibold text-muted-foreground mt-3 mb-1">
          {trimmed.substring(4)}
        </h3>
      );
    } else if (trimmed.startsWith("- ")) {
      elements.push(
        <li key={idx} className="text-xs list-disc ml-4 my-0.5 text-muted-foreground">
          {trimmed.substring(2)}
        </li>
      );
    } else if (trimmed.startsWith("* ")) {
      elements.push(
        <li key={idx} className="text-xs list-disc ml-4 my-0.5 text-muted-foreground">
          {trimmed.substring(2)}
        </li>
      );
    } else if (trimmed === "") {
      elements.push(<div key={idx} className="h-1" />);
    } else {
      let content: React.ReactNode = trimmed;
      if (trimmed.includes("**")) {
        const parts = trimmed.split("**");
        content = parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-bold text-foreground">{part}</strong> : part);
      }
      elements.push(
        <p key={idx} className="text-xs text-muted-foreground leading-relaxed my-0.5">
          {content}
        </p>
      );
    }
  });

  return <div className="space-y-0.5">{elements}</div>;
}

export function Wizard({ models }: { models: ModelId[] }) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<number>(1);
  const [model, setModel] = useState<ModelId | "">(models[0] ?? "");
  const [idea, setIdea] = useState("");
  const [brief, setBrief] = useState<string>("");
  const [finalBrief, setFinalBrief] = useState<string>("");
  const [plan, setPlan] = useState<SlidePlan | null>(null);
  const [approved, setApproved] = useState(false);
  const [revision, setRevision] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<"brief" | "preview">("brief");
  const [mdMode, setMdMode] = useState<"split" | "editor" | "preview">("split");
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "Halo! Saya asisten pembuat carousel @vourdev. Silakan pilih AI provider di atas, lalu ketik ide konten Anda di kolom chat bawah untuk memulai.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  
  const [pending, start] = useTransition();
  const typewriterIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [blobs, setBlobs] = useState<Blob[]>([]);
  const [exportedImages, setExportedImages] = useState<string[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [exportPending, setExportPending] = useState(false);
  const [dueAt, setDueAt] = useState("");
  const [pubConfig, setPubConfig] = useState<{ hasIg: boolean; hasTt: boolean } | null>(null);
  const [publishState, setPublishState] = useState<{
    status: "idle" | "uploading" | "publishing" | "success" | "error";
    progressMsg: string;
    errorMsg?: string;
    igPostId?: string;
    ttPostId?: string;
  }>({ status: "idle", progressMsg: "" });
  const [carouselId, setCarouselId] = useState<string | null>(null);
  const [uploadedHtml, setUploadedHtml] = useState<string | null>(null);
  const htmlInputRef = useRef<HTMLInputElement>(null);
  // Mobile shows one panel at a time (desktop keeps the 2-col layout).
  const [mobilePanel, setMobilePanel] = useState<"chat" | "canvas">("chat");

  const [editableTitle, setEditableTitle] = useState("");
  const [editableCaption, setEditableCaption] = useState("");

  const html = useMemo(
    () => uploadedHtml ?? (plan ? assembleCarousel(plan) : ""),
    [uploadedHtml, plan]
  );
  const slideCount = useMemo(
    () => (uploadedHtml ? countSections(uploadedHtml) : plan?.slides.length ?? 0),
    [uploadedHtml, plan]
  );

  // Sync editable Title & Caption when plan changes
  useEffect(() => {
    if (plan) {
      setEditableTitle(plan.title || "");
      const hashtagsStr = plan.hashtags
        ? plan.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")
        : "";
      setEditableCaption(plan.caption ? `${plan.caption}\n\n${hashtagsStr}` : hashtagsStr);
    } else {
      setEditableTitle("");
      setEditableCaption("");
    }
  }, [plan]);

  // Load state from local storage
  useEffect(() => {
    const saved = localStorage.getItem("vour_carousel_draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.step) setStep(parsed.step);
        if (parsed.idea) setIdea(parsed.idea);
        if (parsed.model) setModel(parsed.model);
        if (parsed.brief) {
          setBrief(parsed.brief);
          setFinalBrief(parsed.brief);
        }
        if (parsed.plan) setPlan(parsed.plan);
        if (parsed.approved) setApproved(parsed.approved);
        if (parsed.activeTab) setActiveTab(parsed.activeTab);
        if (parsed.messages) setMessages(parsed.messages);
        if (parsed.mdMode) setMdMode(parsed.mdMode);
        if (parsed.uploadedHtml) setUploadedHtml(parsed.uploadedHtml);
        if (parsed.carouselId) setCarouselId(parsed.carouselId);
        if (parsed.dueAt) setDueAt(parsed.dueAt);
        if (parsed.editableTitle) setEditableTitle(parsed.editableTitle);
        if (parsed.editableCaption) setEditableCaption(parsed.editableCaption);
        if (parsed.uploadedImageUrls) setUploadedImageUrls(parsed.uploadedImageUrls);
      } catch (e) {
        console.error("Failed to parse saved draft", e);
      }
    }
    setMounted(true);
  }, []);

  // Save state to local storage
  useEffect(() => {
    if (!mounted) return;
    const draft = {
      step,
      idea,
      model,
      brief,
      plan,
      approved,
      activeTab,
      messages,
      mdMode,
      uploadedHtml,
      carouselId,
      dueAt,
      editableTitle,
      editableCaption,
      uploadedImageUrls,
    };
    localStorage.setItem("vour_carousel_draft", JSON.stringify(draft));
  }, [
    step,
    idea,
    model,
    brief,
    plan,
    approved,
    activeTab,
    messages,
    mdMode,
    mounted,
    uploadedHtml,
    carouselId,
    dueAt,
    editableTitle,
    editableCaption,
    uploadedImageUrls,
  ]);

  // Auto-scroll chat feed to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending, isTyping]);

  // Cleanup typewriter interval on unmount
  useEffect(() => {
    return () => {
      if (typewriterIntervalRef.current) {
        clearInterval(typewriterIntervalRef.current);
      }
    };
  }, []);

  // Initialize datetime picker with tomorrow at 9:00 AM
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    const formatted = `${tomorrow.getFullYear()}-${pad(
      tomorrow.getMonth() + 1
    )}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(
      tomorrow.getMinutes()
    )}`;
    setDueAt(formatted);
  }, []);

  // Mobile: follow the flow — Chat while ideating (steps 1-2), Canvas once
  // there's output to review (steps 3+). Desktop ignores this (shows both).
  useEffect(() => {
    setMobilePanel(step >= 3 ? "canvas" : "chat");
  }, [step]);

  // Fetch publishing channels config
  useEffect(() => {
    if (step === 5) {
      getPublishingConfigAction().then(setPubConfig).catch(console.error);
    }
  }, [step]);

  // Clean up object URLs on unmount/re-export
  useEffect(() => {
    return () => {
      exportedImages.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [exportedImages]);

  const handleSaveEdits = async () => {
    if (!carouselId) return;
    try {
      await markCarouselStatusAction(carouselId, {
        title: editableTitle,
        caption: editableCaption,
      });
    } catch (err) {
      console.error("failed to save edits to db", err);
    }
  };

  const handleExport = async () => {
    if (!html) return;
    setExportPending(true);
    addMessage("ai", "Mengekspor slide rancangan menjadi gambar PNG...");
    try {
      const generatedBlobs = await captureCarousel(html);
      setBlobs(generatedBlobs);
      
      // Revoke any existing object URLs to avoid memory leaks
      exportedImages.forEach((url) => URL.revokeObjectURL(url));
      
      const urls = generatedBlobs.map((b) => URL.createObjectURL(b));
      setExportedImages(urls);

      // Reset uploaded URLs state (we upload only when publishing to Buffer)
      setUploadedImageUrls([]);

      // Persist to history — thumbnail = tiny local compressed base64 JPEG
      if (plan) {
        try {
          const thumb = generatedBlobs[0] ? await compressImageBlob(generatedBlobs[0], 120) : null;
          const id = await saveExportedCarouselAction({
            source: uploadedHtml ? "upload" : "ai",
            title: editableTitle || plan.title,
            caption: editableCaption || plan.caption,
            hashtags: plan.hashtags,
            slideCount,
            model: uploadedHtml ? null : model || null,
            thumbnail: thumb,
            imageUrls: [], // Defer upload to Cloudinary until publishing
          });
          setCarouselId(id);
        } catch (err) {
          console.error("history save failed", err);
        }
      }

      setStep(4);
      setActiveTab("preview");
      addMessage("ai", "Ekspor gambar berhasil diselesaikan! Tinjau hasil preview di sebelah kanan. Anda dapat mengunduh gambar ke lokal, atau melanjutkan ke langkah Publish.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "failed";
      toast.error(`Gagal ekspor: ${msg}`);
      addMessage("ai", `Gagal memproses ekspor gambar: ${msg}`);
    } finally {
      setExportPending(false);
    }
  };

  const handleDownloadAll = () => {
    if (blobs.length > 0) {
      downloadNamedBlobs(namedBlobs(blobs));
      toast.success("Downloaded JPEGs locally!");
    } else {
      toast.error("Belum ada slide gambar yang di-export.");
    }
  };

  // Fallback to regenerate exports if they refreshed while in Step 4 or 5
  useEffect(() => {
    if (mounted && step >= 4 && exportedImages.length === 0 && html) {
      handleExport();
    }
  }, [mounted, step, html]);

  const handlePublish = async () => {
    if (!dueAt) {
      toast.error("Pilih tanggal dan waktu scheduling!");
      return;
    }
    const scheduleDate = new Date(dueAt);
    if (scheduleDate <= new Date()) {
      toast.error("Waktu harus di masa depan!");
      return;
    }

    setPublishState({ status: "publishing", progressMsg: "Mengirim ke Buffer API..." });
    addMessage("user", `Jadwalkan publikasi pada ${scheduleDate.toLocaleString("id-ID")}`);

    try {
      let urls = uploadedImageUrls;
      if (urls.length === 0 && blobs.length > 0) {
        setPublishState({ status: "uploading", progressMsg: "Mengunggah gambar ke Cloudinary..." });
        const uploadedUrls: string[] = [];
        for (let idx = 0; idx < blobs.length; idx++) {
          setPublishState({
            status: "uploading",
            progressMsg: `Mengunggah slide ${idx + 1} dari ${blobs.length} ke Cloudinary...`,
          });
          const blob = blobs[idx];
          const base64 = await new Promise<string>((res, rej) => {
            const reader = new FileReader();
            reader.onloadend = () => res(reader.result as string);
            reader.onerror = rej;
            reader.readAsDataURL(blob);
          });
          const url = await uploadSingleImageAction(base64);
          uploadedUrls.push(url);
        }
        urls = uploadedUrls;
        setUploadedImageUrls(urls);
        // Also save to database and promote thumbnail to Cloudinary URL
        if (carouselId) {
          await markCarouselStatusAction(carouselId, { 
            imageUrls: urls,
            thumbnail: urls[0] || null,
          });
        }
      }

      setPublishState({ status: "publishing", progressMsg: "Mengirim ke Buffer API..." });
      
      const editedPlan: SlidePlan = {
        ...plan!,
        title: editableTitle,
        caption: editableCaption,
        hashtags: [],
      };
      
      const results = await publishAction(urls, editedPlan, scheduleDate.toISOString());

      setPublishState({
        status: "success",
        progressMsg: "Berhasil dijadwalkan!",
        igPostId: results.igPostId,
        ttPostId: results.ttPostId,
      });

      if (carouselId) {
        markCarouselStatusAction(carouselId, {
          status: "scheduled",
          bufferIgId: results.igPostId,
          bufferTtId: results.ttPostId,
          dueAt: scheduleDate.toISOString(),
          title: editableTitle,
          caption: editableCaption,
        }).catch(console.error);
      }

      addMessage(
        "ai",
        `Sukses! Carousel berhasil dijadwalkan di Buffer pada ${scheduleDate.toLocaleString("id-ID")}.${
          results.igPostId ? `\n- Instagram Post ID: ${results.igPostId}` : ""
        }${results.ttPostId ? `\n- TikTok Post ID: ${results.ttPostId}` : ""}`
      );
      toast.success("Berhasil dijadwalkan di Buffer!");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal";
      setPublishState({
        status: "error",
        progressMsg: "Gagal menjadwalkan",
        errorMsg: msg,
      });
      addMessage("ai", `Gagal mempublikasikan: ${msg}`);
      toast.error(`Publish error: ${msg}`);
      if (carouselId) markCarouselStatusAction(carouselId, { status: "failed" }).catch(() => {});
    }
  };

  const handleSaveToStock = async () => {
    if (!dueAt) {
      toast.error("Pilih tanggal dan waktu scheduling!");
      return;
    }
    const scheduleDate = new Date(dueAt);
    if (scheduleDate <= new Date()) {
      toast.error("Waktu harus di masa depan!");
      return;
    }

    setPublishState({ status: "publishing", progressMsg: "Menyimpan ke Stock Konten..." });
    addMessage("user", `Simpan ke Stock Konten pada ${scheduleDate.toLocaleString("id-ID")}`);

    try {
      let urls = uploadedImageUrls;
      if (urls.length === 0 && blobs.length > 0) {
        setPublishState({ status: "uploading", progressMsg: "Mengunggah gambar ke Cloudinary..." });
        const uploadedUrls: string[] = [];
        for (let idx = 0; idx < blobs.length; idx++) {
          setPublishState({
            status: "uploading",
            progressMsg: `Mengunggah slide ${idx + 1} dari ${blobs.length} ke Cloudinary...`,
          });
          const blob = blobs[idx];
          const base64 = await new Promise<string>((res, rej) => {
            const reader = new FileReader();
            reader.onloadend = () => res(reader.result as string);
            reader.onerror = rej;
            reader.readAsDataURL(blob);
          });
          const url = await uploadSingleImageAction(base64);
          uploadedUrls.push(url);
        }
        urls = uploadedUrls;
        setUploadedImageUrls(urls);
      }

      setPublishState({ status: "publishing", progressMsg: "Menyimpan ke database..." });
      
      if (carouselId) {
        await markCarouselStatusAction(carouselId, {
          status: "exported",
          dueAt: scheduleDate.toISOString(),
          title: editableTitle,
          caption: editableCaption,
          imageUrls: urls,
          thumbnail: urls[0] || null,
        });
      }

      setPublishState({
        status: "success",
        progressMsg: "Berhasil disimpan ke Stock Konten!",
      });

      addMessage(
        "ai",
        `Sukses! Carousel berhasil disimpan ke Stock Konten pada ${scheduleDate.toLocaleString("id-ID")}. Konten ini dapat dipublish manual nanti dari halaman History.`
      );
      toast.success("Berhasil disimpan ke Stock Konten!");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal";
      setPublishState({
        status: "error",
        progressMsg: "Gagal menyimpan",
        errorMsg: msg,
      });
      addMessage("ai", `Gagal menyimpan ke Stock Konten: ${msg}`);
      toast.error(`Gagal menyimpan: ${msg}`);
    }
  };

  async function handleReset() {
    if (typewriterIntervalRef.current) {
      clearInterval(typewriterIntervalRef.current);
    }
    // Delete the unscheduled/unpublished draft from the database on reset
    if (carouselId && publishState.status !== "success") {
      try {
        await deleteCarouselAction(carouselId);
      } catch (err) {
        console.error("Failed to delete draft from db on reset:", err);
      }
    }
    setStep(1);
    setIdea("");
    setBrief("");
    setFinalBrief("");
    setPlan(null);
    setApproved(false);
    setRevision("");
    setEditableTitle("");
    setEditableCaption("");
    setIsTyping(false);
    setActiveTab("brief");
    setMdMode("split");
    setBlobs([]);
    exportedImages.forEach((url) => URL.revokeObjectURL(url));
    setExportedImages([]);
    setDueAt("");
    setCarouselId(null);
    setUploadedHtml(null);
    setPublishState({ status: "idle", progressMsg: "" });
    setMessages([
      {
        sender: "ai",
        text: "Draft dibersihkan. Silakan masukkan ide konten baru atau upload file md untuk memulai.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    localStorage.removeItem("vour_carousel_draft");
    toast.success("Draft reset successfully");
  }

  function addMessage(sender: "user" | "ai", text: string) {
    setMessages((prev) => [
      ...prev,
      {
        sender,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setBrief(text);
        setFinalBrief(text);
        setStep(2);
        setActiveTab("brief");
        setMdMode("split");
        addMessage("user", `Upload file markdown: ${file.name}`);
        addMessage("ai", `Markdown berhasil dimuat. Anda berada pada langkah 2. Silakan tinjau dan edit outline brief Anda, lalu klik "Approve & Render Slide" jika sudah siap.`);
        toast.success(`File ${file.name} loaded successfully`);
      }
    };
    reader.readAsText(file);
  }

  function handleHtmlUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const meta = parseMeta(text);
      setUploadedHtml(text);
      // Synthetic plan carries the caption/title/hashtags for export + publish.
      setPlan({ title: meta.title, caption: meta.caption, hashtags: meta.hashtags, slides: [] } as SlidePlan);
      setApproved(false);
      setStep(3);
      setActiveTab("preview");
      addMessage("user", `Upload HTML: ${file.name}`);
      addMessage(
        "ai",
        `HTML carousel dimuat (${countSections(text)} slide). Lewati AI — langsung klik "Approve & Export JPEGs", lalu Publish.`
      );
      toast.success(`HTML ${file.name} loaded`);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleBriefGeneration() {
    if (!idea.trim() || !model) return;
    const currentIdea = idea;
    addMessage("user", currentIdea);
    setIdea("");
    
    start(async () => {
      try {
        const res = await briefAction(currentIdea, model as ModelId);
        setFinalBrief(res);
        setIsTyping(true);
        setStep(2);
        setActiveTab("brief");
        addMessage("ai", "Brief outline berhasil dibuat! Silakan tinjau draf markdown di panel kanan. Anda bisa langsung mengedit teksnya atau ketik revisi di kolom chat.");

        if (typewriterIntervalRef.current) {
          clearInterval(typewriterIntervalRef.current);
        }

        let currentText = "";
        let i = 0;
        typewriterIntervalRef.current = setInterval(() => {
          if (i < res.length) {
            currentText += res.substring(i, i + 4);
            setBrief(currentText);
            i += 4;
          } else {
            setBrief(res);
            setIsTyping(false);
            if (typewriterIntervalRef.current) {
              clearInterval(typewriterIntervalRef.current);
            }
          }
        }, 15);

      } catch (e) {
        const msg = e instanceof Error ? e.message : "failed";
        toast.error(msg);
        addMessage("ai", `Gagal memproses: ${summarizeError(msg)}`);
      }
    });
  }

  function handlePlanGeneration() {
    if (!brief) return;
    addMessage("user", "Approve brief outline & generate Slide design.");
    start(async () => {
      try {
        const generatedPlan = await planAction(brief, model as ModelId);
        setPlan(generatedPlan);
        setApproved(false);
        setStep(3);
        setActiveTab("preview");
        addMessage("ai", "Slide deck HTML berhasil dirender! Anda sekarang dapat meninjau visualnya pada tab 'Live Design Preview'. Jika butuh penyesuaian, ketik revisi Anda di kolom chat.");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "failed";
        toast.error(msg);
        addMessage("ai", `Gagal merender slide: ${summarizeError(msg)}`);
      }
    });
  }

  function handleRevisionSend() {
    if (!revision.trim()) return;
    if (uploadedHtml) {
      toast.error("Revisi AI tidak tersedia untuk HTML upload — langsung export.");
      return;
    }
    const currentRevision = revision;
    addMessage("user", currentRevision);
    setRevision("");
    
    start(async () => {
      try {
        if (step === 2) {
          addMessage("ai", "Merevisi brief outline berdasarkan instruksi Anda...");
          const res = await briefAction(`Current brief:\n${brief}\n\nRevision request:\n${currentRevision}`, model as ModelId);
          setFinalBrief(res);
          setBrief(res);
          addMessage("ai", "Brief outline berhasil diperbarui.");
        } else if ((step === 3 || step === 4) && plan) {
          addMessage("ai", "Merevisi rancangan slide berdasarkan instruksi Anda...");
          if (step === 4) {
            setStep(3);
            setActiveTab("preview");
          }
          const updatedPlan = await reviseAction(plan, currentRevision, model as ModelId);
          setPlan(updatedPlan);
          setApproved(false);
          addMessage("ai", "Rancangan slide berhasil disesuaikan. Silakan cek preview terbaru.");
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "failed";
        toast.error(msg);
        addMessage("ai", `Revisi gagal: ${summarizeError(msg)}`);
      }
    });
  }
  const [modelPopoverOpen, setModelPopoverOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState("");

  if (models.length === 0) {
    return (
      <p className="text-muted-foreground">
        No AI model configured. Add an API key (e.g. GOOGLE_GENERATIVE_AI_API_KEY) to .env.
      </p>
    );
  }

  if (!mounted) {
    return <div className="min-h-[400px] flex items-center justify-center text-sm text-muted-foreground animate-pulse">Loading draft workspace...</div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. TOP STEPPER HEADER BAR */}
      <div className="bg-card border border-hairline rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
          {[
            { id: 1, label: "Concept", icon: Sparkles },
            { id: 2, label: "Brief", icon: FileText },
            { id: 3, label: "Design", icon: LayoutGrid },
            { id: 4, label: "Export", icon: Upload },
            { id: 5, label: "Publish", icon: Calendar },
          ].map((s, idx, arr) => {
            const isCompleted = step > s.id || (s.id === 2 && brief.trim().length > 0) || (s.id === 3 && plan !== null) || (s.id === 4 && exportedImages.length > 0);
            const isActive = step === s.id;
            const isClickable = isCompleted || s.id === 1 || (s.id === 2 && brief) || (s.id === 3 && plan) || (s.id === 4 && plan) || (s.id === 5 && plan);

            return (
              <div key={s.id} className="flex items-center gap-1.5 md:gap-2">
                <button
                  disabled={!isClickable}
                  onClick={() => {
                    if (isClickable) {
                      setStep(s.id);
                      if (s.id === 2) setActiveTab("brief");
                      if (s.id === 3) setActiveTab("preview");
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                      : isCompleted
                      ? "bg-muted/40 text-foreground hover:bg-muted/70 cursor-pointer border border-hairline"
                      : "text-muted-foreground/50 cursor-not-allowed opacity-60"
                  }`}
                >
                  <span className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive ? "bg-primary-foreground text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {s.id}
                  </span>
                  <span>{s.label}</span>
                </button>
                {idx < arr.length - 1 && <span className="text-muted-foreground/30 text-xs">→</span>}
              </div>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-8 text-xs gap-1.5 px-3 text-muted-foreground hover:text-foreground shrink-0 border border-hairline hover:bg-muted/40"
        >
          <RotateCcw className="size-3.5" />
          Clear / Reset
        </Button>
      </div>

      {/* 2. FOCUSED STEP COMPONENT VIEWS */}

      {/* STEP 1: CONCEPT & AI PROMPTER COMPONENT */}
      {step === 1 && (
        <div className="flex flex-col justify-between gap-4 w-full max-w-4xl mx-auto py-1 animate-in fade-in duration-200 min-h-[calc(100vh-220px)] md:min-h-0">
          {/* Chat Console Feed Container */}
          <div className={`p-4 bg-canvas-soft border border-hairline rounded-2xl flex flex-col gap-3 shadow-inner ${
            messages.length <= 1 
              ? "py-6 md:py-10 justify-center my-auto" 
              : "min-h-[280px] max-h-[400px] overflow-y-auto"
          }`}>
            {messages.length <= 1 && (
              <div className="text-center flex flex-col items-center gap-2.5">
                <div className="size-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Sparkles className="size-5.5 animate-pulse" />
                </div>
                <h3 className="font-bold text-sm md:text-base">Apa ide atau topik carousel Anda hari ini?</h3>
                <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                  Ketik ide topik di bawah ini atau impor berkas Markdown / HTML untuk langsung menghasilkan slide carousel profesional.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1">
                  {[
                    "5 Tips Idempotency di REST API",
                    "Koleksi Layout CSS Grid 2026",
                    "Strategi Content Marketing Instagram",
                    "Desain UI Glassmorphism"
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => setIdea(chip)}
                      className="text-[11px] font-mono bg-card border border-hairline hover:border-primary/40 px-2.5 py-1 rounded-xl transition-colors text-muted-foreground hover:text-foreground shadow-2xs"
                    >
                      💡 {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2.5 max-w-[85%] ${msg.sender === "user" ? "self-end flex-row-reverse" : "self-start"}`}
              >
                <div className={`size-7 rounded-full shrink-0 flex items-center justify-center text-xs ${msg.sender === "user" ? "bg-muted text-muted-foreground border border-hairline" : "bg-primary/10 text-primary border border-primary/20"}`}>
                  {msg.sender === "user" ? <User className="size-3.5" /> : <Sparkles className="size-3.5 text-indigo-500 animate-pulse" />}
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                    msg.sender === "user" 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-card text-card-foreground rounded-tl-none border border-hairline"
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-muted-foreground px-1 self-end">{msg.timestamp}</span>
                </div>
              </div>
            ))}
            {pending && (
              <div className="flex gap-2.5 self-start max-w-[85%] animate-pulse">
                <div className="size-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Sparkles className="size-3.5 text-indigo-500 animate-spin" />
                </div>
                <div className="p-3.5 bg-card border border-hairline rounded-2xl rounded-tl-none text-xs text-muted-foreground flex items-center gap-1.5">
                  <div className="size-1.5 rounded-full bg-primary animate-bounce delay-75" />
                  <div className="size-1.5 rounded-full bg-primary animate-bounce delay-150" />
                  <div className="size-1.5 rounded-full bg-primary animate-bounce delay-300" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* FLOATING COMPOSER PILL WITH INTEGRATED MODEL SELECTOR POPOVER */}
          <div className="relative p-3 bg-card border border-hairline rounded-2xl shadow-lg flex flex-col gap-2.5">
            {/* Top Toolbar Inside Composer */}
            <div className="flex items-center justify-between gap-2 border-b pb-2">
              {/* Model Selector Popover Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setModelPopoverOpen(!modelPopoverOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-hairline bg-muted/30 hover:bg-muted/60 text-xs transition-colors"
                >
                  {model && modelDetails[model]?.icon}
                  <div className="flex items-center gap-1.5 font-medium">
                    <span>{model && modelDetails[model]?.label}</span>
                    <span className="text-[9px] font-mono uppercase bg-muted/80 text-muted-foreground px-1.5 py-0.5 rounded border border-hairline">
                      {model && modelDetails[model]?.vendor}
                    </span>
                  </div>
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </button>

                {/* Model Selector Popover Floating Above */}
                {modelPopoverOpen && (
                  <div className="absolute left-0 bottom-full mb-2 z-50 w-72 md:w-80 bg-card border border-hairline rounded-2xl shadow-2xl p-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <div className="flex items-center justify-between border-b pb-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">PILIH MODEL AI</span>
                      <button type="button" onClick={() => setModelPopoverOpen(false)} className="text-muted-foreground text-xs hover:text-foreground">
                        &times;
                      </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative mb-2">
                      <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                      <Input
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        placeholder="Cari model atau vendor..."
                        className="pl-8 h-8 text-xs bg-muted/20 border-hairline"
                      />
                    </div>

                    {/* Filtered Models List */}
                    <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
                      {models
                        .filter((m) => {
                          const details = modelDetails[m];
                          if (!details) return true;
                          const query = modelSearch.toLowerCase();
                          return details.label.toLowerCase().includes(query) || details.vendor.toLowerCase().includes(query);
                        })
                        .map((m) => {
                          const details = modelDetails[m];
                          const isSelected = model === m;
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                setModel(m);
                                setModelPopoverOpen(false);
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs text-left transition-colors ${
                                isSelected ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/40"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {details?.icon}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold truncate">{details?.label || m}</span>
                                    <span className="text-[9px] font-mono uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-hairline">
                                      {details?.vendor || "AI"}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground truncate">{details?.description}</p>
                                </div>
                              </div>
                              {isSelected && <Check className="size-4 text-primary shrink-0 ml-1" />}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* Import Alternative Files */}
              <div className="flex items-center gap-1.5">
                <Input
                  type="file"
                  accept=".md"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  id="md-upload-input"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="h-7 text-xs gap-1.5 px-2.5 border-hairline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="size-3" />
                  .md
                </Button>
                <input
                  type="file"
                  accept=".html,text/html"
                  ref={htmlInputRef}
                  onChange={handleHtmlUpload}
                  className="hidden"
                  id="html-upload-input"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5 px-2.5 border-hairline"
                  onClick={() => htmlInputRef.current?.click()}
                >
                  <FileText className="size-3" />
                  .html
                </Button>
              </div>
            </div>

            {/* Input & Send Action Row */}
            <div className="relative flex items-center">
              <Input
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Ketik ide atau topik konten di sini... (misal: idempotency di API)"
                className="pr-12 h-11 text-xs rounded-xl border-hairline"
                disabled={pending}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleBriefGeneration();
                }}
              />
              <Button 
                size="icon" 
                className="absolute right-1 size-9 rounded-lg" 
                disabled={pending || !idea.trim() || !model}
                onClick={handleBriefGeneration}
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: BRIEF OUTLINE EDITOR COMPONENT */}
      {step === 2 && (
        <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto py-2 animate-in fade-in duration-200">
          <Card className="shadow-sm border-hairline">
            <CardContent className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  Outline Brief Editor
                </span>
                <span className="text-xs font-mono text-muted-foreground bg-muted/40 px-2 py-0.5 rounded border border-hairline">
                  Markdown Enabled
                </span>
              </div>

              <Textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                disabled={pending || isTyping}
                placeholder="# Judul Carousel..."
                className="font-mono text-xs h-96 p-4 bg-canvas-soft border-hairline resize-y leading-relaxed rounded-xl shadow-inner"
              />

              {/* Bottom AI Revision Row */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Input
                  value={revision}
                  onChange={(e) => setRevision(e.target.value)}
                  placeholder="Ketik instruksi revisi outline ke AI..."
                  className="h-10 text-xs flex-1 rounded-xl"
                  disabled={pending || isTyping}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRevisionSend();
                  }}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pending || !revision.trim() || isTyping}
                  onClick={handleRevisionSend}
                  className="h-10 text-xs px-4 rounded-xl gap-1.5"
                >
                  <Send className="size-3.5" />
                  Revisi Brief
                </Button>
              </div>

              {/* Action Navigation Bar */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button variant="outline" size="sm" onClick={() => setStep(1)} className="gap-1.5">
                  <ArrowLeft className="size-3.5" /> Back ke Concept
                </Button>

                <Button
                  size="sm"
                  disabled={pending || isTyping || !brief.trim()}
                  onClick={handlePlanGeneration}
                  className="gap-1.5 font-semibold px-5"
                >
                  <Check className="size-4" />
                  Approve &amp; Render Slide
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 3: LIVE DESIGN CANVAS COMPONENT */}
      {step === 3 && plan && (
        <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto py-2 animate-in fade-in duration-200">
          <Card className="shadow-sm border-hairline overflow-hidden">
            <CardContent className="p-6 flex flex-col gap-6">
              {/* Workspace Header Tabs & Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <LayoutGrid className="size-4 text-primary" />
                    Live Design Canvas
                  </span>
                  <span className="text-xs font-mono text-muted-foreground bg-muted/40 px-2 py-0.5 rounded border border-hairline">
                    {plan.slides.length} Slides
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="inline-flex p-0.5 bg-muted/50 rounded-lg border border-hairline">
                    <button
                      onClick={() => setActiveTab("brief")}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${activeTab === "brief" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"}`}
                    >
                      Outline Brief
                    </button>
                    <button
                      onClick={() => setActiveTab("preview")}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${activeTab === "preview" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"}`}
                    >
                      Live Preview
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Preview Frame */}
              <div className="w-full flex justify-center py-4 bg-canvas-soft border border-hairline rounded-2xl min-h-[460px] shadow-inner">
                {activeTab === "preview" ? (
                  <PreviewFrame html={html} slideCount={slideCount} />
                ) : (
                  <Textarea
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    className="font-mono text-xs h-96 w-full p-4 bg-transparent border-none resize-none"
                  />
                )}
              </div>

              {/* AI Revision Prompt Input */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Input
                  value={revision}
                  onChange={(e) => setRevision(e.target.value)}
                  placeholder="Ketik instruksi revisi slide/desain ke AI..."
                  className="h-10 text-xs flex-1 rounded-xl"
                  disabled={pending || isTyping}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRevisionSend();
                  }}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pending || !revision.trim() || isTyping}
                  onClick={handleRevisionSend}
                  className="h-10 text-xs px-4 rounded-xl gap-1.5"
                >
                  <Send className="size-3.5" />
                  Revisi Desain
                </Button>
              </div>

              {/* Action Navigation Bar */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button variant="outline" size="sm" onClick={() => setStep(2)} className="gap-1.5">
                  <ArrowLeft className="size-3.5" /> Back ke Brief
                </Button>

                <Button
                  size="sm"
                  disabled={pending || exportPending}
                  onClick={handleExport}
                  className="gap-1.5 font-semibold px-5"
                >
                  <Upload className="size-4" />
                  {exportPending ? "Exporting..." : "Approve & Export JPEGs"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 4: JPEG EXPORT COMPONENT */}
      {step === 4 && (
        <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto py-2 animate-in fade-in duration-200">
          <Card className="shadow-sm border-hairline">
            <CardContent className="p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <CheckCircle2 className="size-5 text-emerald-500" />
                    JPEG Assets Ready
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {exportedImages.length} slide berhasil di-export ke format gambar JPEG resolusi tinggi.
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={handleDownloadAll} className="gap-1.5 font-mono text-xs">
                  <Upload className="size-3.5" /> Download All ZIP
                </Button>
              </div>

              {/* Exported JPEGs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 py-2">
                {exportedImages.map((src, i) => (
                  <div key={i} className="flex flex-col gap-2 group">
                    <div className="aspect-[4/5] rounded-xl border border-hairline overflow-hidden bg-muted relative shadow-sm group-hover:shadow-md transition-shadow">
                      <img src={src} alt={`Slide ${i + 1}`} className="size-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a
                          href={src}
                          download={`slide-${i + 1}.jpg`}
                          className="text-[10px] font-mono bg-card text-foreground px-2.5 py-1 rounded-md border border-hairline shadow-xs font-semibold hover:bg-muted"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-center text-muted-foreground font-medium">Slide {i + 1}</span>
                  </div>
                ))}
              </div>

              {/* Action Navigation Bar */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button variant="outline" size="sm" onClick={() => setStep(3)} className="gap-1.5">
                  <ArrowLeft className="size-3.5" /> Back ke Design
                </Button>

                <Button size="sm" onClick={() => setStep(5)} className="gap-1.5 font-semibold px-5">
                  Lanjut ke Penjadwalan <span className="text-xs">→</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 5: SCHEDULE & PUBLISH COMPONENT */}
      {step === 5 && (
        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto py-2 animate-in fade-in duration-200">
          <Card className="shadow-sm border-hairline">
            <CardContent className="p-6 flex flex-col gap-6">
              <div className="border-b pb-4">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Calendar className="size-5 text-primary" />
                  Schedule &amp; Publish Content
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Atur waktu publish ke Buffer atau simpan sebagai Stock Content lokal.
                </p>
              </div>

              {/* Destination Platforms Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card border border-hairline rounded-xl p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Instagram</span>
                    {pubConfig?.hasIg ? (
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                        Not Set
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    {pubConfig?.hasIg
                      ? "Carousel JPEG dan caption akan dikirim ke Instagram."
                      : "Set BUFFER_IG_CHANNEL_ID di .env untuk mengaktifkan."}
                  </p>
                </div>
                
                <div className="bg-card border border-hairline rounded-xl p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">TikTok</span>
                    {pubConfig?.hasTt ? (
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                        Not Set
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    {pubConfig?.hasTt
                      ? "Carousel JPEG, judul, dan caption akan dikirim ke TikTok."
                      : "Set BUFFER_TIKTOK_CHANNEL_ID di .env untuk mengaktifkan."}
                  </p>
                </div>
              </div>

              {/* Date & Time Picker */}
              <div className="bg-card border border-hairline rounded-xl p-4 shadow-xs space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Clock className="size-3.5 text-primary" />
                  Waktu Posting (dueAt)
                </label>
                <Input
                  type="datetime-local"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  disabled={publishState.status === "uploading" || publishState.status === "publishing"}
                  className="text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  Pilih waktu kapan Buffer akan menjadwalkan notifikasi posting ini.
                </p>
              </div>

              {/* Caption & Metadata Preview */}
              <div className="bg-card border border-hairline rounded-xl p-4 shadow-xs space-y-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase block">
                  Instagram Caption &amp; TikTok Title
                </span>
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase block">TikTok Title</span>
                    <Input
                      type="text"
                      value={editableTitle}
                      onChange={(e) => setEditableTitle(e.target.value)}
                      onBlur={handleSaveEdits}
                      disabled={publishState.status === "uploading" || publishState.status === "publishing"}
                      placeholder="Judul postingan TikTok..."
                      className="text-xs font-mono mt-1 w-full bg-muted/20 focus-visible:ring-1 focus-visible:ring-primary border-hairline"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase block">Caption (Instagram / TikTok)</span>
                    <Textarea
                      value={editableCaption}
                      onChange={(e) => setEditableCaption(e.target.value)}
                      onBlur={handleSaveEdits}
                      disabled={publishState.status === "uploading" || publishState.status === "publishing"}
                      placeholder="Tulis caption Anda di sini..."
                      className="text-xs font-mono mt-1 w-full h-32 bg-muted/20 focus-visible:ring-1 focus-visible:ring-primary border-hairline resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action or Progress Panel */}
              <div className="bg-card border border-hairline rounded-xl p-6 shadow-xs text-center space-y-4">
                {publishState.status === "idle" ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handlePublish}
                      className="flex-1 font-semibold"
                      disabled={!pubConfig?.hasIg && !pubConfig?.hasTt}
                    >
                      Schedule to Buffer
                    </Button>
                    <Button
                      onClick={handleSaveToStock}
                      variant="outline"
                      className="flex-1 font-semibold border-primary/40 text-primary hover:bg-primary/5"
                    >
                      Save to Stock Content
                    </Button>
                  </div>
                ) : null}

                {publishState.status === "uploading" || publishState.status === "publishing" ? (
                  <div className="space-y-3">
                    <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
                    <p className="text-xs font-medium text-foreground">{publishState.progressMsg}</p>
                  </div>
                ) : null}

                {publishState.status === "success" ? (
                  <div className="space-y-3">
                    <CheckCircle2 className="size-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-medium text-emerald-600">{publishState.progressMsg || "Berhasil!"}</p>
                    {publishState.igPostId || publishState.ttPostId ? (
                      <div className="text-left text-[11px] font-mono border border-emerald-100 bg-emerald-50/50 rounded p-3 space-y-1">
                        {publishState.igPostId ? (
                          <div>Instagram Post ID: <span className="text-foreground font-semibold">{publishState.igPostId}</span></div>
                        ) : null}
                        {publishState.ttPostId ? (
                          <div>TikTok Post ID: <span className="text-foreground font-semibold">{publishState.ttPostId}</span></div>
                        ) : null}
                      </div>
                    ) : null}
                    <Button
                      onClick={handleReset}
                      className="w-full mt-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Buat Konten Baru
                    </Button>
                  </div>
                ) : null}

                {publishState.status === "error" ? (
                  <div className="space-y-3">
                    <XCircle className="size-8 text-destructive mx-auto" />
                    <p className="text-xs font-medium text-destructive">Gagal Mempublikasikan</p>
                    <p className="text-[11px] text-muted-foreground border border-destructive/20 bg-destructive/5 rounded p-3 font-mono text-left max-h-32 overflow-y-auto">
                      {publishState.errorMsg}
                    </p>
                    <Button onClick={handlePublish} variant="outline" className="w-full">
                      Coba Lagi
                    </Button>
                  </div>
                ) : null}
              </div>

              {/* Bottom Navigation */}
              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" size="sm" onClick={() => setStep(4)} className="gap-1.5">
                  <ArrowLeft className="size-3.5" /> Back ke Export
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
