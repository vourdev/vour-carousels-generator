"use client";

import { useMemo, useState, useTransition } from "react";
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
import { Sparkles, Brain, Zap } from "lucide-react";
import { toast } from "sonner";

const modelDetails: Record<string, { label: string; icon: React.ReactNode }> = {
  gemini: {
    label: "Gemini 2.5 Flash",
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
  const [model, setModel] = useState<ModelId | "">(models[0] ?? "");
  const [idea, setIdea] = useState("");
  const [brief, setBrief] = useState<string | null>(null);
  const [plan, setPlan] = useState<SlidePlan | null>(null);
  const [approved, setApproved] = useState(false);
  const [revision, setRevision] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const html = useMemo(() => (plan ? assembleCarousel(plan) : ""), [plan]);

  function run(fn: () => Promise<void>) {
    setError("");
    start(async () => {
      try {
        await fn();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "failed";
        setError(msg);
        toast.error(msg);
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

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1 · Your idea</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="e.g. idempotency di API — kenapa retry aman"
            rows={3}
          />
          <div className="flex items-center gap-3">
            <Select value={model} onValueChange={(v) => setModel(v as ModelId)}>
              <SelectTrigger className="w-56">
                <div className="flex items-center gap-2">
                  {model && modelDetails[model]?.icon}
                  <SelectValue>
                    {model ? modelDetails[model].label : "Model"}
                  </SelectValue>
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
            <Button
              disabled={pending || !idea.trim() || !model}
              onClick={() => run(async () => setBrief(await briefAction(idea, model as ModelId)))}
            >
              {pending ? "Working…" : "Generate brief"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {brief !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">2 · Brief</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={14} />
            <Button
              className="justify-self-start"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  setPlan(await planAction(brief, model as ModelId));
                  setApproved(false);
                })
              }
            >
              {pending ? "Working…" : "Generate HTML"}
            </Button>
          </CardContent>
        </Card>
      )}

      {plan && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">3 · Carousel</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <PreviewFrame html={html} slideCount={plan.slides.length} />
            <div className="flex items-center gap-2">
              <Input
                value={revision}
                onChange={(e) => setRevision(e.target.value)}
                placeholder="Revise, e.g. perpendek slide 2"
              />
              <Button
                variant="outline"
                disabled={pending || !revision.trim()}
                onClick={() =>
                  run(async () => {
                    setPlan(await reviseAction(plan, revision, model as ModelId));
                    setRevision("");
                    setApproved(false);
                  })
                }
              >
                Revise
              </Button>
            </div>
            {approved ? (
              <ExportButton html={html} />
            ) : (
              <Button
                className="justify-self-start"
                disabled={pending}
                onClick={() => setApproved(true)}
              >
                Approve HTML
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
