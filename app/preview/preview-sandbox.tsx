"use client";

import { useState, useMemo } from "react";
import { assembleCarousel } from "@/lib/ds/assemble";
import { samplePlan } from "@/lib/ds/sample";
import { PreviewFrame } from "./preview-frame";
import { ExportButton } from "./export-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { Layout, ArrowLeft, Plus, Trash2, Sliders, ChevronDown, ChevronUp } from "lucide-react";

export function PreviewSandbox() {
  const [plan, setPlan] = useState(samplePlan);
  const [openSlideIdx, setOpenSlideIdx] = useState<number | null>(0);

  const html = useMemo(() => assembleCarousel(plan), [plan]);

  // Handle meta updates
  function updateMeta(field: "title" | "caption" | "hashtags", value: string) {
    setPlan((prev) => {
      if (field === "hashtags") {
        return {
          ...prev,
          hashtags: value.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean),
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  }

  // Handle slide field updates
  function updateSlide(slideIdx: number, field: string, value: any) {
    setPlan((prev) => {
      const slides = [...prev.slides];
      slides[slideIdx] = {
        ...slides[slideIdx],
        [field]: value,
      };
      return { ...prev, slides };
    });
  }

  // Handle nested card updates inside a slide
  function updateSlideCard(slideIdx: number, field: string, value: any) {
    setPlan((prev) => {
      const slides = [...prev.slides];
      const currentSlide = slides[slideIdx];
      if (currentSlide.role === "point") {
        const card = currentSlide.card ? { ...currentSlide.card } : { icon: "lucide:repeat", title: "", body: "", tone: "peach" as const };
        (card as any)[field] = value;
        slides[slideIdx] = {
          ...currentSlide,
          card,
        };
      }
      return { ...prev, slides };
    });
  }

  // Add a point slide
  function addPointSlide() {
    setPlan((prev) => {
      const count = prev.slides.length;
      // Insert point slide beforeoutro (which is usually the last one)
      const slides = [...prev.slides];
      const newPoint = {
        role: "point" as const,
        counter: `0${count} / 0${count}`,
        eyebrow: "KONSEP",
        headline: "Tulis poin baru Anda",
        accentWord: "poin",
        body: "Penjelasan ringkas dari konsep ini.",
        card: {
          icon: "lucide:check-circle",
          title: "Info Card",
          body: "Detail tambahan di sini.",
          tone: "sky" as const,
        },
      };
      
      // Place before outro
      const outroIdx = slides.findIndex((s) => s.role === "outro");
      if (outroIdx !== -1) {
        slides.splice(outroIdx, 0, newPoint);
      } else {
        slides.push(newPoint);
      }

      // Re-index counters for all points
      const points = slides.filter((s) => s.role === "point");
      let pIdx = 2; // cover is slide 1, first point is slide 2
      slides.forEach((s, idx) => {
        if (s.role === "point") {
          s.counter = `${pIdx < 10 ? '0' + pIdx : pIdx} / ${slides.length < 10 ? '0' + slides.length : slides.length}`;
          pIdx++;
        }
      });

      return { ...prev, slides };
    });
    setOpenSlideIdx(plan.slides.length - 1);
  }

  // Delete a slide
  function deleteSlide(slideIdx: number) {
    if (plan.slides.length <= 2) return; // Must keep cover & outro at least
    setPlan((prev) => {
      const slides = prev.slides.filter((_, idx) => idx !== slideIdx);
      // Re-index counters for point slides
      let pIdx = 2;
      slides.forEach((s) => {
        if (s.role === "point") {
          s.counter = `${pIdx < 10 ? '0' + pIdx : pIdx} / ${slides.length < 10 ? '0' + slides.length : slides.length}`;
          pIdx++;
        }
      });
      return { ...prev, slides };
    });
    setOpenSlideIdx(null);
  }

  return (
    <div className="grid lg:grid-cols-[400px_1fr] gap-6 items-stretch lg:h-full lg:overflow-hidden relative pb-16 lg:pb-0 flex-1 min-h-0">
      
      {/* LEFT COLUMN: Slides Content Editor */}
      <div className="flex flex-col h-full gap-4 overflow-hidden min-h-0">
        
        {/* Navigation Sidebar Card */}
        <Card className="shadow-sm shrink-0">
          <CardContent className="p-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium">
              <ArrowLeft className="size-3.5" />
              Kembali
            </Link>
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Sliders className="size-3.5 text-amber-500" />
              Slide Tuner Sandbox
            </span>
          </CardContent>
        </Card>

        {/* Form Controls - Scrollable */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 min-h-0">
          
          {/* Metadata Section */}
          <Card className="shadow-sm shrink-0">
            <CardContent className="p-4 flex flex-col gap-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Metadata Info</span>
              
              <div className="grid gap-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Title</label>
                <Input
                  value={plan.title}
                  onChange={(e) => updateMeta("title", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Caption (Copy)</label>
                <Textarea
                  value={plan.caption}
                  onChange={(e) => updateMeta("caption", e.target.value)}
                  className="text-xs min-h-[60px] resize-none"
                />
              </div>

              <div className="grid gap-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Hashtags (Comma separated)</label>
                <Input
                  value={plan.hashtags.join(", ")}
                  onChange={(e) => updateMeta("hashtags", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Slides List Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Slide Decks ({plan.slides.length})</span>
              <Button
                size="sm"
                onClick={addPointSlide}
                className="h-6 text-[10px] gap-1 px-2"
                variant="outline"
              >
                <Plus className="size-3" /> Add Slide
              </Button>
            </div>

            {plan.slides.map((slide, idx) => {
              const isOpen = openSlideIdx === idx;
              return (
                <Card key={idx} className={`shadow-sm border transition-colors ${isOpen ? 'border-primary/45' : 'hover:border-border'}`}>
                  <CardContent className="p-0">
                    
                    {/* Slide Header Toggle */}
                    <div 
                      onClick={() => setOpenSlideIdx(isOpen ? null : idx)}
                      className="p-3 flex items-center justify-between cursor-pointer select-none bg-muted/10 hover:bg-muted/20"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                          {idx === 0 ? "Cover" : idx === plan.slides.length - 1 ? "Outro" : slide.role.toUpperCase()}
                        </span>
                        <span className="text-xs font-medium text-foreground truncate max-w-[180px]">
                          {(slide as any).headline || (slide as any).eyebrow || "Slide Outro"}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {slide.role === "point" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSlide(idx);
                            }}
                            className="size-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                        {isOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                      </div>
                    </div>

                    {/* Slide Edit Form fields */}
                    {isOpen && (
                      <div className="p-4 border-t border-hairline flex flex-col gap-3 bg-card/40 animate-in fade-in slide-in-from-top-1 duration-150">
                        
                        {/* Cover / Point fields */}
                        {slide.role !== "outro" && (
                          <div className="grid gap-1.5">
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Eyebrow</label>
                            <Input
                              value={(slide as any).eyebrow || ""}
                              onChange={(e) => updateSlide(idx, "eyebrow", e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                        )}

                        <div className="grid gap-1.5">
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase">Headline</label>
                          <Input
                            value={slide.headline || ""}
                            onChange={(e) => updateSlide(idx, "headline", e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>

                        {slide.headline && (
                          <div className="grid gap-1.5">
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Accent Word (Matches verbatim inside headline)</label>
                            <Input
                              value={(slide as any).accentWord || ""}
                              onChange={(e) => updateSlide(idx, "accentWord", e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                        )}

                        {slide.role === "cover" && (
                          <div className="grid gap-1.5">
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Lede (Subheading)</label>
                            <Input
                              value={(slide as any).lede || ""}
                              onChange={(e) => updateSlide(idx, "lede", e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                        )}

                        {slide.role === "point" && (
                          <div className="grid gap-1.5">
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Slide Body Copy</label>
                            <Textarea
                              value={(slide as any).body || ""}
                              onChange={(e) => updateSlide(idx, "body", e.target.value)}
                              className="text-xs min-h-[50px] resize-none"
                            />
                          </div>
                        )}

                        {slide.role === "outro" && (
                          <div className="grid gap-1.5">
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase">Outro Body Copy</label>
                            <Input
                              value={(slide as any).body || ""}
                              onChange={(e) => updateSlide(idx, "body", e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                        )}

                        {/* Nested Point Card details */}
                        {slide.role === "point" && slide.card && (
                          <div className="border border-dashed border-border rounded-lg p-3 bg-muted/5 grid gap-2.5">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Nested Info Card</span>
                            
                            <div className="grid gap-1">
                              <label className="text-[9px] font-semibold text-muted-foreground">Iconify Slug</label>
                              <Input
                                value={slide.card.icon}
                                onChange={(e) => updateSlideCard(idx, "icon", e.target.value)}
                                className="h-7 text-xs font-mono"
                              />
                            </div>

                            <div className="grid gap-1">
                              <label className="text-[9px] font-semibold text-muted-foreground">Card Title</label>
                              <Input
                                value={slide.card.title}
                                onChange={(e) => updateSlideCard(idx, "title", e.target.value)}
                                className="h-7 text-xs"
                              />
                            </div>

                            <div className="grid gap-1">
                              <label className="text-[9px] font-semibold text-muted-foreground">Card Body</label>
                              <Input
                                value={slide.card.body}
                                onChange={(e) => updateSlideCard(idx, "body", e.target.value)}
                                className="h-7 text-xs"
                              />
                            </div>

                            <div className="grid gap-1">
                              <label className="text-[9px] font-semibold text-muted-foreground">Card Theme Accent</label>
                              <Select 
                                value={slide.card.tone} 
                                onValueChange={(v) => updateSlideCard(idx, "tone", v)}
                              >
                                <SelectTrigger className="h-7 text-[10px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {["peach", "stone", "mint", "sky", "pink", "amber"].map((tone) => (
                                    <SelectItem key={tone} value={tone} className="text-[10px]">
                                      {tone.toUpperCase()}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                          </div>
                        )}

                      </div>
                    )}

                  </CardContent>
                </Card>
              );
            })}
          </div>

        </div>

      </div>

      {/* RIGHT COLUMN: Output display workspace preview canvas */}
      <div className="flex flex-col h-full overflow-hidden min-h-0 border border-hairline rounded-xl bg-card shadow-sm">
        
        {/* Workspace Canvas Header */}
        <div className="border-b bg-muted/20 px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <Layout className="size-4 text-emerald-500" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Live Slide preview</span>
          </div>

          {/* Export / Download trigger */}
          <ExportButton html={html} />
        </div>

        {/* Workspace Canvas Preview Frame */}
        <div className="flex-1 min-h-0 bg-canvas-soft overflow-y-auto flex items-center justify-center p-4">
          <PreviewFrame html={html} slideCount={plan.slides.length} />
        </div>

      </div>

    </div>
  );
}
