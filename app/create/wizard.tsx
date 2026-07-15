"use client";

import { useMemo, useState, useTransition, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Sparkles, Brain, Zap, RotateCcw, Check, Send, Sparkle, Eye, FileText, LayoutGrid } from "lucide-react";
import { toast } from "sonner";

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
  const [pending, start] = useTransition();

  const typewriterIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const html = useMemo(() => (plan ? assembleCarousel(plan) : ""), [plan]);

  // Load from local storage
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
      } catch (e) {
        console.error("Failed to parse saved draft", e);
      }
    }
    setMounted(true);
  }, []);

  // Save to local storage
  useEffect(() => {
    if (!mounted) return;
    const draft = { step, idea, model, brief, plan, approved };
    localStorage.setItem("vour_carousel_draft", JSON.stringify(draft));
  }, [step, idea, model, brief, plan, approved, mounted]);

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
    localStorage.removeItem("vour_carousel_draft");
    toast.success("Draft reset successfully");
  }

  function handleBriefGeneration() {
    if (!idea.trim() || !model) return;
    setErrorState("");
    start(async () => {
      try {
        const res = await briefAction(idea, model as ModelId);
        setFinalBrief(res);
        setIsTyping(true);
        setStep(2);

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
      }
    });
  }

  function handlePlanGeneration() {
    if (!brief) return;
    setErrorState("");
    start(async () => {
      try {
        const generatedPlan = await planAction(brief, model as ModelId);
        setPlan(generatedPlan);
        setApproved(false);
        setStep(3);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "failed";
        toast.error(msg);
      }
    });
  }

  function handleRevisionSend() {
    if (!revision.trim()) return;
    setErrorState("");
    start(async () => {
      try {
        if (step === 2) {
          // If in step 2, revision targets the brief outline
          const res = await briefAction(`Current brief:\n${brief}\n\nRevision request:\n${revision}`, model as ModelId);
          setFinalBrief(res);
          setBrief(res);
          setRevision("");
        } else if (step === 3 && plan) {
          // If in step 3, revision targets the HTML slide layout plan
          const updatedPlan = await reviseAction(plan, revision, model as ModelId);
          setPlan(updatedPlan);
          setRevision("");
          setApproved(false);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "failed";
        toast.error(msg);
      }
    });
  }

  // Dummy target to satisfy compiler / typings if needed internally
  const setErrorState = (_val: string) => {};

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
    <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 items-stretch lg:h-[calc(100vh-130px)] lg:overflow-hidden relative pb-16 lg:pb-0">
      
      {/* LEFT COLUMN: Workspace control and Chat input */}
      <div className="flex flex-col h-full gap-4 overflow-hidden min-h-0">
        
        {/* Stepper Header */}
        <Card className="shadow-sm shrink-0">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`flex items-center justify-center size-6 rounded-full text-xs font-semibold ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>1</span>
              <span className={`text-sm ${step === 1 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>Concept</span>
              
              <span className="text-muted-foreground text-xs mx-1">→</span>
              
              <span className={`flex items-center justify-center size-6 rounded-full text-xs font-semibold ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>2</span>
              <span className={`text-sm ${step === 2 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>Brief</span>
              
              <span className="text-muted-foreground text-xs mx-1">→</span>
              
              <span className={`flex items-center justify-center size-6 rounded-full text-xs font-semibold ${step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>3</span>
              <span className={`text-sm ${step === 3 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>Carousel</span>
            </div>

            <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 gap-1.5 text-muted-foreground hover:text-foreground">
              <RotateCcw className="size-3.5" />
              Reset Draft
            </Button>
          </CardContent>
        </Card>

        {/* Dynamic step instructions & workspace controls */}
        <div className="flex-1 overflow-y-auto pr-1 grid gap-4 min-h-0">
          {step === 1 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkle className="size-4 text-indigo-500" />
                  Start Your Content Journey
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <p className="text-sm text-muted-foreground">
                  Enter your core topic, programming concept, or tutorial idea below. The AI will outline the flow and structure in the next step.
                </p>
                
                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">SELECT AI PROVIDER</label>
                  <Select value={model} onValueChange={(v) => setModel(v as ModelId)}>
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        {model && modelDetails[model]?.icon}
                        <SelectValue placeholder="Model" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((m) => (
                        <SelectItem key={m} value={m}>
                          <div className="flex items-center gap-2">
                            {modelDetails[m]?.icon}
                            <span>{modelDetails[m]?.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="size-4 text-blue-500" />
                  Refine Content Brief
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <p className="text-sm text-muted-foreground">
                  Read, edit, or revise the generated outline on the right. Once it covers all key takeaways, approve it to render the design.
                </p>

                <div className="flex items-center gap-2">
                  <Button 
                    disabled={pending || isTyping} 
                    onClick={handlePlanGeneration}
                    className="w-full"
                  >
                    <Check className="size-4 mr-2" />
                    Approve & Create Slide HTML
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && plan && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <LayoutGrid className="size-4 text-emerald-500" />
                  Design Deck & Export
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <p className="text-sm text-muted-foreground">
                  Review slide visuals on the right. You can request copy updates, layout modifications, or tone adjustments using the chat below.
                </p>

                <div className="border-t pt-4 grid gap-2">
                  {approved ? (
                    <div className="grid gap-2 animate-in fade-in zoom-in-95 duration-200">
                      <p className="text-xs text-emerald-500 font-medium flex items-center gap-1.5">
                        <Check className="size-3.5" /> Carousel Approved!
                      </p>
                      <ExportButton html={html} />
                    </div>
                  ) : (
                    <Button 
                      disabled={pending} 
                      onClick={() => setApproved(true)}
                      className="w-full"
                    >
                      <Eye className="size-4 mr-2" />
                      Approve Slide Design
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* BOTTOM CHAT COMPOSER */}
        <div className="p-4 bg-card border border-border rounded-xl shadow-sm flex items-center gap-3 shrink-0">
          {step === 1 ? (
            <div className="flex-1 relative flex items-center">
              <Input
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Type your content idea here... (e.g., idempotency di API)"
                className="pr-12 h-11"
                disabled={pending}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleBriefGeneration();
                }}
              />
              <Button 
                size="icon" 
                className="absolute right-1.5 size-8" 
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
                placeholder={step === 2 ? "Ask AI to revise the brief outline..." : "Ask AI to change slides... (e.g. perpendek slide 2)"}
                className="pr-12 h-11"
                disabled={pending || isTyping}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRevisionSend();
                }}
              />
              <Button 
                size="icon" 
                className="absolute right-1.5 size-8" 
                disabled={pending || !revision.trim() || isTyping}
                onClick={handleRevisionSend}
              >
                <Send className="size-3.5" />
              </Button>
            </div>
          )}
          
          {pending && (
            <div className="text-xs text-muted-foreground animate-pulse shrink-0 flex items-center gap-1.5 font-mono">
              <div className="size-2 rounded-full bg-primary animate-ping" />
              WORKING...
            </div>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN: Output display (Markdown Brief with Typewriter OR Carousel HTML Iframe) */}
      <div className="flex flex-col h-full overflow-hidden min-h-0">
        
        {step < 3 ? (
          <Card className="flex-1 flex flex-col shadow-sm h-full overflow-hidden min-h-0">
            <CardHeader className="border-b bg-muted/20 py-3 flex flex-row items-center justify-between shrink-0">
              <CardTitle className="text-sm font-semibold tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
                <FileText className="size-3.5" />
                Live Content Brief
              </CardTitle>
              {isTyping && (
                <span className="text-[10px] bg-indigo-500/10 text-indigo-500 font-mono font-medium px-2 py-0.5 rounded animate-pulse">
                  Streaming...
                </span>
              )}
            </CardHeader>
            <CardContent className="flex-1 p-0 relative min-h-0">
              <Textarea
                value={brief}
                onChange={(e) => {
                  if (!isTyping) {
                    setBrief(e.target.value);
                    setFinalBrief(e.target.value);
                  }
                }}
                disabled={isTyping}
                placeholder="The content outline brief will write out here once generated..."
                className="w-full h-full border-0 rounded-t-none resize-none focus-visible:ring-0 font-mono text-sm leading-relaxed p-6 bg-transparent overflow-y-auto"
              />
              
              {/* Typewriter pulse cursor overlay when writing */}
              {isTyping && (
                <div className="absolute bottom-6 right-6 flex items-center gap-1 text-[11px] font-mono text-muted-foreground select-none pointer-events-none">
                  <div className="size-1.5 rounded-full bg-primary animate-ping" />
                  typing brief
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-sm flex flex-col h-full overflow-hidden min-h-0">
            <CardHeader className="border-b bg-muted/20 py-3 shrink-0">
              <CardTitle className="text-sm font-semibold tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
                <LayoutGrid className="size-3.5" />
                Live Slide Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4 flex items-center justify-center bg-canvas-soft-2 overflow-y-auto min-h-0">
              <PreviewFrame html={html} slideCount={plan ? plan.slides.length : 0} />
            </CardContent>
          </Card>
        )}

      </div>

    </div>
  );
}
