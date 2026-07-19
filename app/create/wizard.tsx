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
import { Sparkles, Brain, Zap, RotateCcw, Check, Send, Eye, FileText, LayoutGrid, User, Upload, Clock, CheckCircle2, XCircle, AlertCircle, Calendar, Globe } from "lucide-react";
import { toast } from "sonner";

interface Message {
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

const modelDetails: Record<string, { label: string; icon: React.ReactNode }> = {
  gemini: {
    label: "Gemini Flash",
    icon: <Sparkles className="size-4 text-indigo-500 shrink-0" />,
  },
  deepseek: {
    label: "DeepSeek Chat",
    icon: <Brain className="size-4 text-cyan-500 shrink-0" />,
  },
  mimo: {
    label: "MIMO",
    icon: <Zap className="size-4 text-amber-500 shrink-0" />,
  },
  openrouter: {
    label: "OpenRouter",
    icon: <Globe className="size-4 text-rose-500 shrink-0" />,
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
    <div className="flex flex-col gap-3 lg:h-full min-h-0 flex-1">

      {/* Mobile-only panel toggle (desktop shows both columns side by side). */}
      <div className="flex lg:hidden items-center gap-1 p-0.5 bg-muted/50 rounded-lg border border-hairline shrink-0">
        <button
          onClick={() => setMobilePanel("chat")}
          className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${mobilePanel === "chat" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"}`}
        >
          Chat & Controls
        </button>
        <button
          onClick={() => setMobilePanel("canvas")}
          className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${mobilePanel === "canvas" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"}`}
        >
          Canvas
        </button>
      </div>

    <div className="grid lg:grid-cols-[400px_1fr] gap-4 lg:gap-6 items-stretch lg:h-full lg:overflow-hidden relative pb-16 lg:pb-0 flex-1 min-h-0">

      {/* LEFT COLUMN: Workspace sidebar & Chat console */}
      <div className={`${mobilePanel === "chat" ? "flex" : "hidden"} lg:flex flex-col h-full gap-4 overflow-hidden min-h-0 px-0.5`}>
        
        {/* Workspace controls & Stepper */}
        <Card className="shadow-sm shrink-0">
          <CardContent className="p-4 flex flex-col gap-3">
            
            {/* Model Selector */}
            <div className="flex items-center justify-between gap-3 border-b pb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Provider</span>
              <Select value={model} onValueChange={(v) => setModel(v as ModelId)}>
                <SelectTrigger className="w-40 h-8 text-xs">
                  <div className="flex items-center gap-1.5">
                    {model && modelDetails[model]?.icon}
                    <SelectValue placeholder="Model" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m} value={m} className="text-xs">
                      <div className="flex items-center gap-1.5">
                        {modelDetails[m]?.icon}
                        <span>{modelDetails[m]?.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Visual Stepper */}
            <div className="flex flex-col gap-2 border-b pb-2">
              <div className="flex flex-wrap items-center gap-y-1.5 gap-x-1">
                <span className={`flex items-center justify-center size-5 rounded-full text-[10px] font-semibold ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>1</span>
                <span className={`text-[11px] ${step === 1 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>Concept</span>
                <span className="text-muted-foreground/40 text-[10px] mx-0.5">→</span>
                <span className={`flex items-center justify-center size-5 rounded-full text-[10px] font-semibold ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>2</span>
                <span className={`text-[11px] ${step === 2 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>Brief</span>
                <span className="text-muted-foreground/40 text-[10px] mx-0.5">→</span>
                <span className={`flex items-center justify-center size-5 rounded-full text-[10px] font-semibold ${step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>3</span>
                <span className={`text-[11px] ${step === 3 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>Design</span>
                <span className="text-muted-foreground/40 text-[10px] mx-0.5">→</span>
                <span className={`flex items-center justify-center size-5 rounded-full text-[10px] font-semibold ${step >= 4 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>4</span>
                <span className={`text-[11px] ${step === 4 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>Export</span>
                <span className="text-muted-foreground/40 text-[10px] mx-0.5">→</span>
                <span className={`flex items-center justify-center size-5 rounded-full text-[10px] font-semibold ${step >= 5 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>5</span>
                <span className={`text-[11px] ${step === 5 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>Publish</span>
              </div>

              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 text-[10px] gap-1 px-2 text-muted-foreground hover:text-foreground shrink-0">
                  <RotateCcw className="size-3" />
                  Clear
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Dynamic step instructions & workspace controls / alternative imports */}
        {step === 1 && (
          <Card className="shadow-sm shrink-0">
            <CardContent className="p-4 flex flex-col gap-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Alternative Import</span>
              <div className="flex flex-col gap-2">
                <Input
                  type="file"
                  accept=".md"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  id="md-file-upload"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-8 text-xs gap-1.5"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="size-3.5" />
                  Upload Markdown (.md)
                </Button>
                <input
                  type="file"
                  accept=".html,text/html"
                  ref={htmlInputRef}
                  onChange={handleHtmlUpload}
                  className="hidden"
                  id="html-file-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-8 text-xs gap-1.5"
                  onClick={() => htmlInputRef.current?.click()}
                >
                  <FileText className="size-3.5" />
                  Upload HTML (.html) — skip AI
                </Button>
                <p className="text-[10px] text-muted-foreground text-center">
                  Markdown → brief editor. HTML jadi → langsung export &amp; publish.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat Console Feed */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 min-h-0 p-3 bg-canvas-soft border border-hairline rounded-xl">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-2 max-w-[85%] ${msg.sender === "user" ? "self-end flex-row-reverse" : "self-start"}`}
            >
              {/* Profile Icon */}
              <div className={`size-6 rounded-full shrink-0 flex items-center justify-center text-xs ${msg.sender === "user" ? "bg-muted text-muted-foreground border border-hairline" : "bg-primary/10 text-primary border border-primary/20"}`}>
                {msg.sender === "user" ? <User className="size-3.5" /> : <Sparkles className="size-3.5 text-indigo-500 animate-pulse" />}
              </div>

              {/* Message Bubble */}
              <div className="flex flex-col gap-0.5">
                <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
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
            <div className="flex gap-2 self-start max-w-[85%] animate-pulse">
              <div className="size-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="size-3.5 text-indigo-500 animate-spin" />
              </div>
              <div className="p-3 bg-card border border-hairline rounded-2xl rounded-tl-none text-xs text-muted-foreground flex items-center gap-1.5">
                <div className="size-1.5 rounded-full bg-primary animate-bounce delay-75" />
                <div className="size-1.5 rounded-full bg-primary animate-bounce delay-150" />
                <div className="size-1.5 rounded-full bg-primary animate-bounce delay-300" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* BOTTOM CHAT COMPOSER */}
        <div className="p-3 bg-card border border-hairline rounded-xl shadow-sm flex items-center gap-2 shrink-0">
          {step === 1 ? (
            <div className="flex-1 relative flex items-center">
              <Input
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Ketik ide konten di sini... (e.g. idempotency di API)"
                className="pr-10 h-10 text-xs"
                disabled={pending}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleBriefGeneration();
                }}
              />
              <Button 
                size="icon" 
                className="absolute right-1 size-8" 
                disabled={pending || !idea.trim() || !model}
                onClick={handleBriefGeneration}
              >
                <Send className="size-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex-1 relative flex items-center">
              <Input
                value={revision}
                onChange={(e) => setRevision(e.target.value)}
                placeholder={
                  step === 2
                    ? "Ketik instruksi revisi outline..."
                    : step === 3 || step === 4
                    ? "Ketik instruksi revisi slide..."
                    : "Penjadwalan aktif — gunakan panel kanan"
                }
                className="pr-10 h-10 text-xs"
                disabled={pending || isTyping || step >= 5}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRevisionSend();
                }}
              />
              <Button 
                size="icon" 
                className="absolute right-1 size-8" 
                disabled={pending || !revision.trim() || isTyping || step >= 5}
                onClick={handleRevisionSend}
              >
                <Send className="size-3.5" />
              </Button>
            </div>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN: Output display workspace canvas */}
      <div className={`${mobilePanel === "canvas" ? "flex" : "hidden"} lg:flex flex-col h-full overflow-hidden min-h-0 border border-hairline rounded-xl bg-card shadow-sm`}>
        
        {/* Workspace Canvas Header Tabs */}
        <div className="border-b bg-muted/20 px-4 py-2 flex flex-col md:flex-row md:items-center gap-2 md:justify-between shrink-0">
          <div className="flex items-center gap-1.5 p-0.5 bg-muted/50 rounded-lg border border-hairline">
            <button
              onClick={() => setActiveTab("brief")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === "brief"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="size-3.5" />
              Outline Brief
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              disabled={step < 3}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === "preview"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
              }`}
            >
              <LayoutGrid className="size-3.5" />
              {step === 3 ? "Live Design Preview" : step === 4 ? "Exported JPEGs Preview" : "Schedule & Publish"}
            </button>
          </div>

          {/* Contextual Action Button based on current step */}
          <div className="flex items-center gap-2">
            {(step === 1 && brief.trim().length > 0) && (
              <Button
                size="sm"
                onClick={() => {
                  setStep(2);
                  addMessage("user", "Proceed with pasted/imported brief outline.");
                  addMessage("ai", "Brief outline berhasil diimpor ke langkah 2! Silakan tinjau, edit lebih lanjut, lalu klik 'Approve & Render Slide' jika sudah siap.");
                }}
                className="h-7 text-xs font-medium gap-1 px-3"
              >
                <Check className="size-3.5" />
                Import Brief
              </Button>
            )}
            {step === 2 && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="h-7 text-xs font-medium px-3"
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  disabled={pending || isTyping}
                  onClick={handlePlanGeneration}
                  className="h-7 text-xs font-medium gap-1 px-3"
                >
                  <Check className="size-3.5" />
                  Approve & Render Slide
                </Button>
              </div>
            )}
            {step === 3 && plan && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setStep(2);
                    setActiveTab("brief");
                  }}
                  className="h-7 text-xs font-medium px-3"
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  disabled={pending || exportPending}
                  onClick={handleExport}
                  className="h-7 text-xs font-medium gap-1 px-3"
                >
                  <Upload className="size-3.5" />
                  {exportPending ? "Exporting..." : "Approve & Export JPEGs"}
                </Button>
              </div>
            )}
            {step === 4 && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setStep(3);
                    addMessage("ai", "Kembali ke mode desain. Anda dapat merevisi slide kembali melalui chat console.");
                  }}
                  className="h-7 text-xs font-medium px-3 animate-fade-in"
                >
                  Revise Design (Back)
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={blobs.length === 0}
                  onClick={() => {
                    downloadNamedBlobs(namedBlobs(blobs));
                    toast.success("Downloaded JPEGs locally!");
                  }}
                  className="h-7 text-xs font-medium px-3"
                >
                  Download JPEGs
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setStep(5);
                    setActiveTab("preview");
                    addMessage("ai", "Langkah 5: Publish. Silakan tentukan tanggal & waktu penjadwalan, lalu klik 'Schedule to Buffer'.");
                  }}
                  className="h-7 text-xs font-medium px-3"
                >
                  Next: Schedule
                </Button>
              </div>
            )}
            {step === 5 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setStep(4);
                  setActiveTab("preview");
                }}
                className="h-7 text-xs font-medium px-3"
              >
                Back to Export
              </Button>
            )}
          </div>
        </div>

        {/* Workspace Canvas Main Content area */}
        <div className="flex-1 min-h-0 relative bg-canvas-soft">
          {activeTab === "brief" ? (
            <div className="h-full relative flex flex-col">
              
              {/* Sub-header for Markdown format view toggles */}
              <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:justify-between border-b px-4 py-1.5 bg-muted/10 shrink-0">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Outline Format View</span>
                <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-md border border-hairline">
                  <button
                    onClick={() => setMdMode("editor")}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      mdMode === "editor" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Raw Markdown
                  </button>
                  <button
                    onClick={() => setMdMode("preview")}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      mdMode === "preview" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Formatted Preview
                  </button>
                  <button
                    onClick={() => setMdMode("split")}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      mdMode === "split" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Split Screen
                  </button>
                </div>
              </div>

              {/* Main edit and preview display wrapper */}
              <div className="flex-1 min-h-0">
                {mdMode === "editor" && (
                  <Textarea
                    value={brief}
                    onChange={(e) => {
                      if (!isTyping) {
                        setBrief(e.target.value);
                        setFinalBrief(e.target.value);
                      }
                    }}
                    disabled={isTyping}
                    placeholder="Tulis ide di panel kiri untuk menjabarkan outline brief di sini... Atau langsung upload/paste teks markdown Anda di sini."
                    className="w-full h-full border-0 resize-none focus-visible:ring-0 font-mono text-sm leading-relaxed p-4 bg-transparent outline-none overflow-y-auto"
                  />
                )}

                {mdMode === "preview" && (
                  <div className="w-full h-full p-6 overflow-y-auto bg-card max-w-none">
                    {renderMarkdown(brief)}
                  </div>
                )}

                {mdMode === "split" && (
                  <div className="grid grid-cols-2 divide-x divide-border h-full">
                    <div className="h-full overflow-hidden">
                      <Textarea
                        value={brief}
                        onChange={(e) => {
                          if (!isTyping) {
                            setBrief(e.target.value);
                            setFinalBrief(e.target.value);
                          }
                        }}
                        disabled={isTyping}
                        placeholder="Tulis ide di panel kiri untuk menjabarkan outline brief di sini... Atau langsung upload/paste teks markdown Anda di sini."
                        className="w-full h-full border-0 resize-none focus-visible:ring-0 font-mono text-sm leading-relaxed p-4 bg-transparent outline-none overflow-y-auto"
                      />
                    </div>
                    <div className="h-full overflow-y-auto p-6 bg-card max-w-none">
                      {renderMarkdown(brief)}
                    </div>
                  </div>
                )}
              </div>
              
              {isTyping && (
                <div className="absolute bottom-6 right-6 flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground select-none pointer-events-none bg-card/85 p-2 rounded-lg border border-hairline shadow-sm backdrop-blur-xs z-10">
                  <div className="size-1.5 rounded-full bg-primary animate-ping" />
                  Streaming brief outline...
                </div>
              )}
            </div>
          ) : (
            <div className="h-full min-h-0 w-full relative">
              {step === 3 && (
                <div className="h-full overflow-y-auto flex flex-col items-center justify-start p-4 md:py-8 min-h-0">
                  {plan ? (
                    <PreviewFrame html={html} slideCount={slideCount} />
                  ) : (
                    <div className="text-center p-8 text-muted-foreground">
                      <LayoutGrid className="size-8 mx-auto mb-2 text-muted-foreground/50 animate-pulse" />
                      <p className="text-xs">Slide preview belum siap. Setujui brief outline terlebih dahulu.</p>
                    </div>
                  )}
                </div>
              )}

              {step === 4 && (
                <div className="h-full overflow-y-auto p-6 bg-canvas-soft">
                  <div className="max-w-4xl mx-auto space-y-4">
                    <h3 className="text-sm font-semibold text-foreground font-heading">Exported Slides Gallery</h3>
                    <p className="text-xs text-muted-foreground">Silakan periksa setiap slide untuk memastikan tidak ada teks terpotong atau visual rusak.</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {exportedImages.map((src, idx) => (
                        <div key={idx} className="relative aspect-[4/5] rounded-lg border border-hairline overflow-hidden bg-muted shadow-sm group">
                          <img src={src} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute bottom-2 left-2 bg-background/80 px-2 py-0.5 rounded text-[10px] font-mono border border-hairline backdrop-blur-xs">
                            Slide {String(idx + 1).padStart(2, "0")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 5 && plan && (
                <div className="h-full overflow-y-auto p-6 bg-canvas-soft flex items-center justify-center">
                  <div className="max-w-xl w-full space-y-6">
                    
                    {/* Scheduling Header */}
                    <div>
                      <h3 className="text-xl font-bold tracking-tight text-foreground font-heading">
                        Schedule & Publish
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Kirim gambar slide ke Cloudinary dan jadwalkan posting di Instagram & TikTok via Buffer.
                      </p>
                    </div>

                    {/* Channel Status */}
                    <div className="grid grid-cols-2 gap-4">
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
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase block">
                          Instagram Caption & TikTok Title
                        </span>
                      </div>
                      <div className="space-y-2">
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
                    </div>                  </div>

                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
    </div>
  );
}
