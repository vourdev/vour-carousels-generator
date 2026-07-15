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
import { PreviewFrame } from "@/app/preview/preview-frame";
import { ExportButton } from "@/app/preview/export-button";
import type { ModelId } from "@/lib/ai/registry";
import type { SlidePlan } from "@/lib/ds/schema";
import { briefAction, planAction, reviseAction } from "./actions";
import { Sparkles, Brain, Zap, RotateCcw, Check, Send, Eye, FileText, LayoutGrid, User, Upload } from "lucide-react";
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

  const html = useMemo(() => (plan ? assembleCarousel(plan) : ""), [plan]);

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
      } catch (e) {
        console.error("Failed to parse saved draft", e);
      }
    }
    setMounted(true);
  }, []);

  // Save state to local storage
  useEffect(() => {
    if (!mounted) return;
    const draft = { step, idea, model, brief, plan, approved, activeTab, messages, mdMode };
    localStorage.setItem("vour_carousel_draft", JSON.stringify(draft));
  }, [step, idea, model, brief, plan, approved, activeTab, messages, mdMode, mounted]);

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

  function handleReset() {
    if (typewriterIntervalRef.current) {
      clearInterval(typewriterIntervalRef.current);
    }
    setStep(1);
    setIdea("");
    setBrief("");
    setFinalBrief("");
    setPlan(null);
    setApproved(false);
    setRevision("");
    setIsTyping(false);
    setActiveTab("brief");
    setMdMode("split");
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
        } else if (step === 3 && plan) {
          addMessage("ai", "Merevisi rancangan slide berdasarkan instruksi Anda...");
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
    <div className="grid lg:grid-cols-[400px_1fr] gap-6 items-stretch lg:h-full lg:overflow-hidden relative pb-16 lg:pb-0 flex-1 min-h-0">
      
      {/* LEFT COLUMN: Workspace sidebar & Chat console */}
      <div className="flex flex-col h-full gap-4 overflow-hidden min-h-0">
        
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className={`flex items-center justify-center size-5 rounded-full text-[10px] font-semibold ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>1</span>
                <span className={`text-xs ${step === 1 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>Concept</span>
                <span className="text-muted-foreground/40 text-[10px] mx-0.5">→</span>
                <span className={`flex items-center justify-center size-5 rounded-full text-[10px] font-semibold ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>2</span>
                <span className={`text-xs ${step === 2 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>Brief</span>
                <span className="text-muted-foreground/40 text-[10px] mx-0.5">→</span>
                <span className={`flex items-center justify-center size-5 rounded-full text-[10px] font-semibold ${step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>3</span>
                <span className={`text-xs ${step === 3 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>Carousel</span>
              </div>

              <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 text-[10px] gap-1 px-2 text-muted-foreground hover:text-foreground shrink-0">
                <RotateCcw className="size-3" />
                Clear
              </Button>
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
                <p className="text-[10px] text-muted-foreground text-center">
                  Atau langsung paste teks markdown ke dalam panel kanan.
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
                placeholder={step === 2 ? "Ketik instruksi revisi outline..." : "Ketik instruksi revisi slide..."}
                className="pr-10 h-10 text-xs"
                disabled={pending || isTyping}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRevisionSend();
                }}
              />
              <Button 
                size="icon" 
                className="absolute right-1 size-8" 
                disabled={pending || !revision.trim() || isTyping}
                onClick={handleRevisionSend}
              >
                <Send className="size-3.5" />
              </Button>
            </div>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN: Output display workspace canvas */}
      <div className="flex flex-col h-full overflow-hidden min-h-0 border border-hairline rounded-xl bg-card shadow-sm">
        
        {/* Workspace Canvas Header Tabs */}
        <div className="border-b bg-muted/20 px-4 py-2 flex items-center justify-between shrink-0">
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
              Live Design Preview
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
              <Button
                size="sm"
                disabled={pending || isTyping}
                onClick={handlePlanGeneration}
                className="h-7 text-xs font-medium gap-1 px-3"
              >
                <Check className="size-3.5" />
                Approve & Render Slide
              </Button>
            )}
            {step === 3 && plan && (
              <>
                {approved ? (
                  <ExportButton html={html} />
                ) : (
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() => setApproved(true)}
                    className="h-7 text-xs font-medium gap-1 px-3"
                  >
                    <Eye className="size-3.5" />
                    Approve Design
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Workspace Canvas Main Content area */}
        <div className="flex-1 min-h-0 relative bg-canvas-soft">
          {activeTab === "brief" ? (
            <div className="h-full relative flex flex-col">
              
              {/* Sub-header for Markdown format view toggles */}
              <div className="flex items-center justify-between border-b px-4 py-1.5 bg-muted/10 shrink-0">
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
            <div className="h-full overflow-y-auto flex items-center justify-center p-4 min-h-0">
              {plan ? (
                <PreviewFrame html={html} slideCount={plan.slides.length} />
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  <LayoutGrid className="size-8 mx-auto mb-2 text-muted-foreground/50 animate-pulse" />
                  <p className="text-xs">Slide preview belum siap. Setujui brief outline terlebih dahulu.</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
