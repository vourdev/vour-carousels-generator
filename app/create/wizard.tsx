"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PreviewFrame, type PreviewMode } from "@/components/preview-frame";
import type { ModelId } from "@/lib/models";
import type { SlidePlan } from "@/lib/ds/schema";
import { planAction, reviseAction, reviseBriefAction, humanVoiceEditorAction, clearRevisionMemoryAction, uploadSingleImageAction, publishAction, getPublishingConfigAction, assembleAction, startCaptureAction, pollCaptureAction, getCarouselAction } from "./actions";
import type { CaptureResult } from "./actions";
import {
  emptyDraft,
  restoreDraft,
  serializeDraft,
  revocableUrls,
  type DraftSnapshot,
} from "./draft-state";
import { saveExportedCarouselAction, markCarouselStatusAction, deleteCarouselAction } from "@/app/history/actions";
import {
  linkTopicCarouselAction,
  listTopicsAction,
  markTopicPublishedAction,
} from "@/app/topics/actions";
import type { Topic } from "@/lib/topics/bank";
import { AlertCircle, ArrowRight, Images, LayoutGrid, PanelRightOpen, RectangleVertical, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { compressImageBlob, revealedLength, summarizeError } from "./_components/utils";
import { LOADING_JOBS, type LoadingKind } from "./_components/step-loader";
import { ChatFeed, type ArtifactCard, type Message } from "./_components/chat-feed";
import { Composer } from "./_components/composer";
import { ArtifactPanel, type ArtifactTab, type ArtifactTabDef } from "./_components/artifact-panel";
import { BriefEditor, type MdMode } from "./_components/brief-editor";
import { ExportPanel } from "./_components/export-panel";
import { PublishPanel, type PublishState } from "./_components/publish-panel";
import { ScreenshotUploads } from "./_components/screenshot-uploads";
import { ModelPicker } from "./_components/model-picker";
import { ProgressStrip } from "./_components/progress-strip";
import { PANEL_DEFAULT, SplitHandle } from "./_components/split-handle";

const STARTERS = [
  "Kenapa index database nggak selalu bikin query cepat",
  "5 kesalahan pakai Prisma yang bikin server lemot",
  "JWT itu bukan enkripsi",
];

export function Wizard({
  models,
  initialTopic,
}: {
  models: ModelId[];
  initialTopic?: Topic | null;
}) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<number>(1);
  const [model, setModel] = useState<ModelId | "">(models[0] ?? "");
  const [idea, setIdea] = useState("");
  const [brief, setBrief] = useState<string>("");
  const [finalBrief, setFinalBrief] = useState<string>("");
  const [plan, setPlan] = useState<SlidePlan | null>(null);
  const [approved, setApproved] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  // The artifact tab doubles as the draft's saved view, so it keeps its old name.
  const [activeTab, setActiveTab] = useState<ArtifactTab>("brief");
  // The canvas is a panel now, not a permanent column: it opens when there is
  // something to look at and closes when the user wants the conversation back.
  const [panelOpen, setPanelOpen] = useState(false);
  const [mdMode, setMdMode] = useState<"split" | "editor" | "preview">("split");
  // Detail or overview for the slide canvas. Lives here rather than in PreviewFrame because
  // the toggle sits in the panel's tab bar, and is not persisted — it is how you are looking
  // at the deck right now, not part of the draft.
  const [previewMode, setPreviewMode] = useState<PreviewMode>("single");
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "Halo! Sesi pembuatan carousel @vourdev aktif. Ketik ide topik atau instruksi revisi di sini — seluruh sesi percakapan akan terjaga utuh.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [pending, start] = useTransition();
  const typewriterIntervalRef = useRef<NodeJS.Timeout | null>(null);
  /** Completes the in-flight brief reveal immediately; set while a reveal is running. */
  const revealFinishRef = useRef<(() => void) | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

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
  /**
   * Key for this draft's server-side revision memory. Minted here rather than
   * reusing carouselId because a carousel row only exists after export, while
   * revisions start at Gate 1. Restored with the draft so memory survives a
   * reload; cleared once the draft is scheduled, stocked, or reset.
   */
  const [draftId, setDraftId] = useState<string>(() => crypto.randomUUID());
  // Mobile shows one panel at a time (desktop keeps the 2-col layout).
  const [mobilePanel, setMobilePanel] = useState<"chat" | "canvas">("chat");
  /**
   * Preview pane width as a % of the studio shell, driven by the split handle.
   * Session-local on purpose: it is a viewing preference, not part of the draft, so it
   * is deliberately absent from both the draft payload and the database.
   */
  const [panelPct, setPanelPct] = useState(PANEL_DEFAULT);
  const splitRef = useRef<HTMLDivElement>(null);

  const [editableTitle, setEditableTitle] = useState("");
  const [editableCaption, setEditableCaption] = useState("");

  // Topic Bank linkage — set when the wizard is started from a saved topic.
  const [topicId, setTopicId] = useState<string | null>(null);
  const [topicTitle, setTopicTitle] = useState<string | null>(null);
  const [bankTopics, setBankTopics] = useState<Topic[]>([]);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [chatInput, setChatInput] = useState<string>("");
  const initialTopicApplied = useRef(false);

  // Step-1 brief generation runs outside useTransition so it can be cancelled:
  // bumping the run id makes the in-flight result a no-op when it lands.
  const [briefPending, setBriefPending] = useState(false);
  const genRunRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  // Which long-running job is in flight, so each step can show its own loader.
  const [loadingJob, setLoadingJob] = useState<LoadingKind | null>(null);

  // True while handleReset is awaiting the server-side clears. The draft on screen is
  // still the old one during that window, and the debounced autosave would happily
  // write it back out — after which removing the key just races the next write.
  const [isResetting, setIsResetting] = useState(false);

  // Prompt history state (terminal-style ArrowUp / ArrowDown navigation)
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [draftInput, setDraftInput] = useState<string>("");

  // Load prompt history from local storage
  useEffect(() => {
    const savedHistory = localStorage.getItem("vour_carousel_prompt_history");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) setPromptHistory(parsed);
      } catch (e) {
        console.error("Failed to parse prompt history", e);
      }
    }
  }, []);

  // Save prompt history to local storage
  useEffect(() => {
    if (promptHistory.length > 0) {
      localStorage.setItem("vour_carousel_prompt_history", JSON.stringify(promptHistory.slice(-50)));
    }
  }, [promptHistory]);

  function pushPromptToHistory(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setPromptHistory((prev) => {
      if (prev.length > 0 && prev[prev.length - 1] === trimmed) return prev;
      return [...prev, trimmed];
    });
    setHistoryIndex(-1);
    setDraftInput("");
  }

  function handlePromptKeyDown(
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    currentValue: string,
    setValue: (val: string) => void,
    onSubmit: () => void
  ) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (currentValue.trim()) {
        pushPromptToHistory(currentValue);
        onSubmit();
      }
      return;
    }

    if (e.key === "ArrowUp") {
      if (promptHistory.length === 0) return;
      e.preventDefault();

      if (historyIndex === -1) {
        setDraftInput(currentValue);
        const nextIndex = 0;
        setHistoryIndex(nextIndex);
        setValue(promptHistory[promptHistory.length - 1 - nextIndex]);
      } else if (historyIndex < promptHistory.length - 1) {
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setValue(promptHistory[promptHistory.length - 1 - nextIndex]);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      if (historyIndex === -1) return;
      e.preventDefault();

      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setValue(promptHistory[promptHistory.length - 1 - nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setValue(draftInput);
      }
      return;
    }
  }

  function handleUnifiedSubmit(overrideText?: string) {
    const textToSubmit = (overrideText ?? chatInput).trim();
    if (!textToSubmit || !model) {
      if (!model) toast.error("Pilih model AI dulu");
      return;
    }

    pushPromptToHistory(textToSubmit);
    addMessage("user", textToSubmit);
    setChatInput("");
    setIdea("");

    // Every branch below writes its result back into the draft when it settles. Reset
    // bumps this counter, so a result that lands afterwards belongs to a draft that no
    // longer exists and is dropped instead of resurrecting it.
    const runId = genRunRef.current;

    if (step === 1 || !brief.trim()) {
      runBriefGeneration(
        (signal) => fetchBrief(textToSubmit, signal),
        "Gagal memproses"
      );
    } else if (step === 2) {
      setLoadingJob("briefRevise");
      start(async () => {
        try {
          addMessage("ai", "Merevisi brief outline berdasarkan instruksi Anda...");
          const res = await reviseBriefAction(brief, textToSubmit, model as ModelId, draftId);
          if (genRunRef.current !== runId) return;
          setFinalBrief(res);
          setBrief(res);
          toast.success("Revisi brief outline selesai!");
          addMessage("ai", "Brief outline berhasil diperbarui dengan konteks penuh. Silakan periksa perubahannya.");
        } catch (e) {
          const msg = e instanceof Error ? e.message : "failed";
          toast.error(msg);
          addMessage("ai", `Revisi brief gagal: ${summarizeError(msg)}`);
        } finally {
          setLoadingJob(null);
        }
      });
    } else if (step === 3 || step === 4) {
      setLoadingJob("planRevise");
      start(async () => {
        try {
          addMessage("ai", "Merevisi rancangan slide berdasarkan instruksi Anda...");
          if (step === 4) {
            setStep(3);
            setActiveTab("preview");
          }
          const updatedPlan = await reviseAction(plan!, textToSubmit, model as ModelId, draftId);
          // Reset while this was in flight: the draft it revises is gone.
          if (genRunRef.current !== runId) return;
          setPlan(updatedPlan);
          setApproved(false);
          toast.success("Revisi rancangan slide selesai!");
          addMessage("ai", "Rancangan slide berhasil disesuaikan. Silakan cek preview terbaru pada panel di sebelah kanan.");
        } catch (e) {
          const msg = e instanceof Error ? e.message : "failed";
          toast.error(msg);
          addMessage("ai", `Revisi slide gagal: ${summarizeError(msg)}`);
        } finally {
          setLoadingJob(null);
        }
      });
    } else if (step === 5) {
      addMessage("ai", "Sesi aktif: Penyesuaian metadata/caption dapat dilakukan langsung di form bawah.");
    }
  }

  // The deck HTML is assembled on the server: render-slide reads ~1.5 MB of unDraw SVGs
  // off disk, and importing it here shipped all of that to the browser. Only the finished
  // HTML for the current plan crosses the wire now, so this is async instead of a useMemo.
  // Keyed by the plan it was built from, so a result that arrives after the plan moved on
  // is ignored rather than briefly shown as the current deck.
  const [assembled, setAssembled] = useState<{ plan: SlidePlan; html: string } | null>(null);

  useEffect(() => {
    if (!plan) return;
    let cancelled = false;
    assembleAction(plan)
      .then((out) => {
        if (!cancelled) setAssembled({ plan, html: out });
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "failed";
        toast.error(`Gagal menyusun preview: ${summarizeError(msg)}`);
      });
    return () => {
      cancelled = true;
    };
  }, [plan]);

  const html = assembled?.plan === plan ? assembled.html : "";

  /** Any long-running job is in flight. Drives the composer, title and unload guard. */
  const busy = pending || briefPending || exportPending;

  /* ── Staying correct while the tab is in the background ──────────────────────
   * The generation request itself is unaffected: fetch is not throttled in a hidden
   * tab, only timers are. What needed fixing was everything driven by a timer, plus
   * telling the user what is happening when they are not looking at the page. */

  // Snap the reveal to complete the moment the tab is hidden. Nobody is watching the
  // animation, and this guarantees a finished brief the instant they come back.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") revealFinishRef.current?.();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  // Surface progress in the tab title, which is the only part of the page a
  // backgrounded user can still see.
  useEffect(() => {
    const base = "Create carousel · Vour";
    document.title = busy ? `◐ ${LOADING_JOBS[loadingJob ?? "brief"].title}… · Vour` : base;
    return () => {
      document.title = base;
    };
  }, [busy, loadingJob]);

  // Closing the tab DOES abort the request — unlike backgrounding it. Say so rather
  // than letting the work vanish silently.
  useEffect(() => {
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);
  const slideCount = plan?.slides.length ?? 0;

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

  /** Push a whole snapshot into the individual state slots. One call site per field. */
  const applyDraft = useCallback((d: DraftSnapshot) => {
    setStep(d.step);
    setIdea(d.idea);
    setModel(d.model as ModelId | "");
    setBrief(d.brief);
    setFinalBrief(d.finalBrief);
    setPlan(d.plan);
    setApproved(d.approved);
    setActiveTab(d.activeTab);
    setMessages(d.messages);
    setMdMode(d.mdMode);
    setCarouselId(d.carouselId);
    setDraftId(d.draftId);
    setDueAt(d.dueAt);
    setEditableTitle(d.editableTitle);
    setEditableCaption(d.editableCaption);
    setExportedImages(d.exportedImages);
    setUploadedImageUrls(d.uploadedImageUrls);
    setTopicId(d.topicId);
    setTopicTitle(d.topicTitle);
  }, []);

  // Load state from local storage
  useEffect(() => {
    const saved = localStorage.getItem("vour_carousel_draft");
    if (saved) {
      try {
        // restoreDraft fills in every field, so a draft written before a field existed
        // comes back with that field's empty value rather than leaving the previous
        // session's value standing in a slot nobody wrote to. The model is the one
        // exception: a draft saved before it was recorded should keep the picker's
        // default rather than blank it.
        applyDraft(
          restoreDraft(JSON.parse(saved), crypto.randomUUID(), { model: models[0] ?? "" })
        );
      } catch (e) {
        console.error("Failed to parse saved draft", e);
      }
    }
    setMounted(true);
  }, [applyDraft]);

  // Save state to local storage
  useEffect(() => {
    if (!mounted || isResetting) return;
    const draft = serializeDraft({
      step,
      idea,
      model,
      brief,
      finalBrief,
      plan,
      approved,
      activeTab,
      messages,
      mdMode,
      carouselId,
      draftId,
      dueAt,
      editableTitle,
      editableCaption,
      exportedImages,
      uploadedImageUrls,
      topicId,
      topicTitle,
    });
    // Debounced: coalesce rapid changes (keystrokes, 15ms typewriter ticks) into
    // one write instead of serializing the full draft on every state change.
    const t = setTimeout(() => {
      try {
        localStorage.setItem("vour_carousel_draft", JSON.stringify(draft));
      } catch {
        // An imported .html carousel is around a megabyte on its own, and the draft also
        // carries the plan and the whole transcript, so a long session can pass the ~5 MB
        // origin quota. Losing autosave is survivable; throwing out of this effect and
        // taking the editor down with it is not.
      }
    }, 400);
    return () => clearTimeout(t);
  }, [
    step,
    idea,
    model,
    brief,
    finalBrief,
    plan,
    approved,
    activeTab,
    messages,
    mdMode,
    mounted,
    carouselId,
    draftId,
    dueAt,
    editableTitle,
    editableCaption,
    exportedImages,
    uploadedImageUrls,
    topicId,
    topicTitle,
    isResetting,
  ]);

  // Auto-scroll chat feed to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending, isTyping, loadingJob]);

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

  /* Fetch publishing channels config.
   *
   * Keyed to the Jadwal tab existing, not to reaching step 5. The tab appears as soon as
   * there are exported images, so it can be opened while the wizard is still on step 4 —
   * and it was: the panel then rendered with a null config and reported both Instagram and
   * TikTok "Nonaktif · BUFFER_IG_CHANNEL_ID", which reads as a missing environment
   * variable rather than a request that was never made.
   *
   * The failure is surfaced for the same reason: a swallowed error is indistinguishable
   * from an unconfigured channel, and the two need different fixes. */
  const canPublish = exportedImages.length > 0 || step === 5;
  useEffect(() => {
    if (!canPublish) return;
    getPublishingConfigAction()
      .then(setPubConfig)
      .catch((err) => {
        console.error(err);
        toast.error(
          `Gagal memuat konfigurasi channel: ${summarizeError(
            err instanceof Error ? err.message : String(err)
          )}`
        );
      });
  }, [canPublish]);

  // Step 1: load pickable Topic Bank entries (queued/idea) for the dropdown.
  useEffect(() => {
    if (!mounted || step !== 1) return;
    listTopicsAction({ limit: 50 })
      .then((all) => setBankTopics(all.filter((t) => t.status === "idea" || t.status === "queued")))
      .catch(() => { });
  }, [mounted, step]);

  // Arriving via /create?topic=… — auto-start the brief from that topic.
  useEffect(() => {
    if (!mounted || !initialTopic || initialTopicApplied.current) return;
    initialTopicApplied.current = true;
    if (step !== 1 || brief) {
      toast.info(
        `Ada draft yang sedang berjalan. Reset dulu untuk mulai dari topic "${initialTopic.title}".`
      );
      return;
    }
    // Hoisted function declaration, defined further down with the other generation
    // handlers; grouping it here instead would split them up for no benefit.
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/immutability
    startBriefFromTopic(initialTopic);
  }, [mounted, initialTopic, step, brief]);

  // Clean up object URLs on unmount/re-export. Exported slides are normally Cloudinary
  // URLs now — revoking one is a no-op, but filtering says which are ours to free.
  useEffect(() => {
    return () => {
      revocableUrls(exportedImages).forEach((url) => URL.revokeObjectURL(url));
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

  const handleUpdateScreenshot = (slideIndex: number, dataUrl: string) => {
    if (!plan) return;
    const newSlides = [...plan.slides];
    const slide = newSlides[slideIndex];
    if (slide && slide.role === "point" && slide.mockup?.type === "screenshot") {
      newSlides[slideIndex] = {
        ...slide,
        mockup: {
          ...slide.mockup,
          screenshotImage: {
            dataUrl,
            uploadedAt: new Date().toISOString(),
          },
          evidenceStatus: "captured",
        },
      };
      setPlan({ ...plan, slides: newSlides });
    }
  };

  const handleContinueWithoutScreenshots = () => {
    setShowPendingModal(false);
    if (plan) {
      const updatedSlides = plan.slides.map((s) => {
        if (s.role === "point" && s.mockup?.type === "screenshot" && s.mockup.evidenceStatus === "pending") {
          return {
            ...s,
            mockup: {
              ...s.mockup,
              evidenceStatus: "fallback_used" as const,
            },
          };
        }
        return s;
      });
      setPlan({ ...plan, slides: updatedSlides });
    }
    handleExport(true);
  };

  /**
   * Poll a capture job to completion.
   *
   * `stillMine` is checked every tick rather than only at the end: a reset or a second
   * export while this is in flight means the draft the result belongs to is gone, and the
   * poll should stop there instead of running for another two minutes.
   *
   * The ceiling is generous because the work legitimately takes minutes on a degraded
   * uplink — 269 seconds measured for five slides — and the failure it protects against
   * is a job that never settles, not one that is merely slow.
   */
  const waitForCapture = async (
    jobId: string,
    stillMine: () => boolean
  ): Promise<CaptureResult | null> => {
    const deadline = Date.now() + 12 * 60 * 1000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 4000));
      if (!stillMine()) return null;
      const s = await pollCaptureAction(jobId);
      if (!stillMine()) return null;
      if (s.status === "done") return { images: s.images, urls: s.urls, uploadError: s.uploadError };
      if (s.status === "error") throw new Error(s.error);
      // The backend forgot the job — swept, or restarted mid-render. The slides may still
      // have reached the row, but nothing here can prove it, so say so plainly.
      if (s.status === "unknown") {
        throw new Error("Proses ekspor terputus di server. Coba ekspor ulang.");
      }
    }
    throw new Error("Ekspor melebihi batas waktu. Coba ekspor ulang.");
  };

  const handleExport = async (forceExport = false) => {
    // The plan is what gets sent; the backend assembles the deck itself. This used to
    // gate on `html`, which is produced by an async effect — so clicking Export before
    // the preview had assembled did nothing at all, with no message.
    if (!plan) {
      toast.error("Belum ada rancangan slide untuk diekspor.");
      return;
    }

    if (!forceExport) {
      const pendingScreenshots = plan.slides.filter(
        (s) => s.role === "point" && s.mockup?.type === "screenshot" && s.mockup.evidenceStatus === "pending"
      );
      if (pendingScreenshots.length > 0) {
        setShowPendingModal(true);
        return;
      }
    }

    const runId = ++genRunRef.current;
    setExportPending(true);
    setLoadingJob("export");
    addMessage("ai", "Mengekspor slide rancangan menjadi gambar PNG...");
    try {
      // The backend renders AND uploads: the URLs come back permanent, so a refresh
      // does not have to pay for Playwright a second time.
      //
      // Polled rather than awaited in one call. The work takes minutes on a bad uplink —
      // most of it Cloudinary retries, not rendering — and Cloudflare closes an origin
      // connection at 100 seconds, so the single long request came back 524 while the
      // slides were already uploaded. Each poll is a short request; the work outlives it.
      const jobId = await startCaptureAction(plan!, carouselId ?? undefined);
      if (genRunRef.current !== runId) return;
      const result = await waitForCapture(jobId, () => genRunRef.current === runId);
      if (!result) return; // superseded by a reset or a second export
      const { images: base64s, urls, uploadError } = result;
      // A reset (or a second export) while this was in flight — the draft this result
      // belongs to is gone, and writing it back is what used to un-reset the wizard.
      if (genRunRef.current !== runId) return;

      // Only present when the upload failed. On the normal path the slides are already
      // on Cloudinary and there is no base64 to decode.
      const generatedBlobs = base64s.map((b) => {
        const bin = window.atob(b);
        const len = bin.length;
        const u8 = new Uint8Array(len);
        for (let i = 0; i < len; i++) u8[i] = bin.charCodeAt(i);
        return new Blob([u8], { type: "image/jpeg" });
      });
      setBlobs(generatedBlobs);

      // Only this page's own allocations need revoking; a Cloudinary URL is not ours.
      revocableUrls(exportedImages).forEach((url) => URL.revokeObjectURL(url));

      // Cloudinary URLs when the upload worked, object URLs when it did not. The
      // fallback is the pre-existing behaviour: the deck still renders and publish
      // still uploads, it just does not survive a reload.
      if (uploadError) {
        // Be specific about what "sementara" costs. These are object URLs: they are not
        // written to the draft and they die with the page, so a refresh loses them and
        // the only way back is another export.
        toast.warning(
          "Upload permanen gagal. Gambar hanya ada di tab ini — jangan refresh sebelum unduh atau ulangi ekspor."
        );
      }
      const displayUrls = urls.length > 0 ? urls : generatedBlobs.map((b) => URL.createObjectURL(b));
      if (displayUrls.length === 0) throw new Error("Ekspor tidak menghasilkan gambar apa pun.");
      setExportedImages(displayUrls);
      setUploadedImageUrls(urls);

      // Persist to history. The thumbnail is a Cloudinary URL when we have one, and a
      // tiny local base64 JPEG otherwise — the History grid reads whichever it gets.
      if (plan) {
        try {
          const thumb = urls[0] ?? (generatedBlobs[0] ? await compressImageBlob(generatedBlobs[0], 120) : null);
          if (carouselId) {
            // Re-export of a deck already on file: /api/capture has written the new
            // URLs onto the row, so only the copy fields are left to sync.
            await markCarouselStatusAction(carouselId, {
              status: "exported",
              title: editableTitle || plan.title,
              caption: editableCaption || plan.caption,
              thumbnail: thumb,
            });
          } else {
            const id = await saveExportedCarouselAction({
              source: "ai",
              title: editableTitle || plan.title,
              caption: editableCaption || plan.caption,
              hashtags: plan.hashtags,
              slideCount,
              model: model || null,
              thumbnail: thumb,
              imageUrls: urls,
            });
            if (genRunRef.current !== runId) return;
            setCarouselId(id);
            // Topic Bank trigger: mark the source topic as generated + link it.
            if (topicId) {
              linkTopicCarouselAction(topicId, id).catch((err) =>
                console.error("failed to link topic to carousel", err)
              );
            }
          }
        } catch (err) {
          console.error("history save failed", err);
        }
      }

      setStep(4);
      setActiveTab("preview");
      addMessage("ai", "Ekspor gambar berhasil diselesaikan! Tinjau hasil preview di sebelah kanan. Anda dapat mengunduh gambar ke lokal, atau melanjutkan ke langkah Publish.");
    } catch (e) {
      if (genRunRef.current !== runId) return;
      const msg = e instanceof Error ? e.message : "failed";
      toast.error(`Gagal ekspor: ${msg}`);
      addMessage("ai", `Gagal memproses ekspor gambar: ${msg}`);
    } finally {
      if (genRunRef.current === runId) {
        setExportPending(false);
        setLoadingJob(null);
      }
    }
  };

  /**
   * Save every slide as a file.
   *
   * The Cloudinary branch is the normal path now, not the after-a-reload fallback it was
   * written as. Capture uploads server-side and only returns base64 when that upload
   * failed, so on a successful export `blobs` is empty for the whole session — which is
   * why the button sat permanently disabled while the per-slide link still worked.
   */
  const handleDownloadAll = async () => {
    const { namedBlobs, downloadNamedBlobs, downloadUrlsAsFiles } = await import(
      "@/lib/export/download"
    );
    if (blobs.length > 0) {
      downloadNamedBlobs(namedBlobs(blobs));
      toast.success(`${blobs.length} gambar diunduh.`);
      return;
    }
    if (exportedImages.length > 0) {
      try {
        await downloadUrlsAsFiles(exportedImages);
        toast.success(`${exportedImages.length} gambar diunduh.`);
      } catch (err) {
        toast.error(
          `Gagal mengunduh gambar dari penyimpanan: ${summarizeError(
            err instanceof Error ? err.message : String(err)
          )}`
        );
      }
      return;
    }
    toast.error("Belum ada slide gambar yang di-export.");
  };

  /** One slide, saved rather than opened. Same reason as the bulk path. */
  const handleDownloadOne = async (index: number) => {
    const url = exportedImages[index];
    if (!url) return;
    const { downloadNamedBlobs } = await import("@/lib/export/download");
    if (blobs[index]) {
      downloadNamedBlobs([{ name: `slide-${index + 1}.jpg`, blob: blobs[index] }]);
      return;
    }
    try {
      const res = await fetch(url, { mode: "cors", credentials: "omit" });
      if (!res.ok) throw new Error(String(res.status));
      downloadNamedBlobs([{ name: `slide-${index + 1}.jpg`, blob: await res.blob() }]);
    } catch (err) {
      toast.error(
        `Gagal mengunduh slide ${index + 1}: ${summarizeError(
          err instanceof Error ? err.message : String(err)
        )}`
      );
    }
  };

  /**
   * Restore the exported slides after a reload.
   *
   * This used to re-run handleExport() — a full Chromium render, one screenshot per
   * slide — because the images had been object URLs and died with the page. They are
   * uploaded at capture time now, so the row already has them and this is one GET.
   */
  useEffect(() => {
    if (!mounted || step < 4 || exportedImages.length > 0 || exportPending || !carouselId) return;
    let cancelled = false;
    getCarouselAction(carouselId)
      .then((saved) => {
        if (cancelled || !saved?.imageUrls?.length) return;
        setExportedImages(saved.imageUrls);
        setUploadedImageUrls(saved.imageUrls);
      })
      .catch((err) => console.error("failed to restore exported slides", err));
    return () => {
      cancelled = true;
    };
  }, [mounted, step, carouselId, exportedImages.length, exportPending]);

  /**
   * The permanent URLs for this deck, uploading only if there are none.
   *
   * /api/capture uploads as part of the render, so the normal path is a no-op — the
   * loop below only runs when Cloudinary was unreachable at export time. Publishing and
   * saving-to-stock each had their own copy of it, which is how they drifted into
   * writing different things to the row afterwards.
   */
  const ensureUploadedUrls = async (): Promise<string[]> => {
    if (uploadedImageUrls.length > 0) return uploadedImageUrls;
    if (blobs.length === 0) return [];

    setPublishState({ status: "uploading", progressMsg: "Mengunggah gambar ke Cloudinary..." });
    const uploaded: string[] = [];
    for (let idx = 0; idx < blobs.length; idx++) {
      setPublishState({
        status: "uploading",
        progressMsg: `Mengunggah slide ${idx + 1} dari ${blobs.length} ke Cloudinary...`,
      });
      const base64 = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onloadend = () => res(reader.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(blobs[idx]);
      });
      uploaded.push(await uploadSingleImageAction(base64));
    }
    setUploadedImageUrls(uploaded);
    // The gallery is showing object URLs in this branch; swap them for the permanent
    // ones so a reload from here on keeps working.
    revocableUrls(exportedImages).forEach((url) => URL.revokeObjectURL(url));
    setExportedImages(uploaded);
    return uploaded;
  };

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
      const urls = await ensureUploadedUrls();
      if (urls.length === 0) throw new Error("Tidak ada gambar untuk dipublikasikan. Export ulang dulu.");
      // Promote the thumbnail to a real URL if the row still has the local base64 one.
      if (carouselId) {
        await markCarouselStatusAction(carouselId, { imageUrls: urls, thumbnail: urls[0] || null });
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
      // Scheduled: the draft has left the editor, so its revision memory is dead
      // weight. Dropped here rather than on unmount so a closed tab still clears.
      clearRevisionMemoryAction(draftId).catch(console.error);
      localStorage.removeItem("vour_carousel_draft");

      // Topic Bank trigger: the source topic is now published/scheduled.
      if (topicId) {
        markTopicPublishedAction(topicId).catch(console.error);
      }

      addMessage(
        "ai",
        `Sukses! Carousel berhasil dijadwalkan di Buffer pada ${scheduleDate.toLocaleString("id-ID")}.${results.igPostId ? `\n- Instagram Post ID: ${results.igPostId}` : ""
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
      if (carouselId) markCarouselStatusAction(carouselId, { status: "failed" }).catch(() => { });
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
      const urls = await ensureUploadedUrls();
      if (urls.length === 0) throw new Error("Tidak ada gambar untuk disimpan. Export ulang dulu.");

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

      // Saved to stock: same end-of-life as scheduling — no more revisions.
      clearRevisionMemoryAction(draftId).catch(console.error);
      localStorage.removeItem("vour_carousel_draft");

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

  /**
   * Throw the draft away and start clean — in one click.
   *
   * It used to take two, because cancelling and clearing were not the same act. The
   * generation guard is what actually discards an in-flight result: handleCancelGeneration
   * bumps `genRunRef`, and reset only called `abort()`. A brief request that had already
   * come back off the wire ignores the abort, so its `.then` still passed the run check
   * and ran applyBriefResult — which sets `finalBrief`, moves back to step 2 and starts a
   * typewriter writing the old brief back into state, after the reset had cleared it. The
   * second click worked because by then nothing was in flight.
   *
   * So: bump the guard first, so every in-flight brief, plan and export lands on a draft
   * that no longer exists and returns; await the server-side clears so the UI never shows
   * a state the backend has not reached; then apply one snapshot.
   */
  async function handleReset() {
    genRunRef.current++;
    abortRef.current?.abort();
    abortRef.current = null;
    if (typewriterIntervalRef.current) {
      clearInterval(typewriterIntervalRef.current);
      typewriterIntervalRef.current = null;
    }
    // Holds a closure that writes the previous brief back into state. Left set, it fires
    // on the next tab switch — the reveal's own "snap to finished" handler, un-resetting
    // a draft that is already gone.
    revealFinishRef.current = null;
    setIsResetting(true);

    // Both clears are awaited: the draft row and its revision memory belong to the
    // backend, and an optimistic UI here would let the next draft inherit them.
    try {
      await Promise.all([
        carouselId && publishState.status !== "success"
          ? deleteCarouselAction(carouselId).catch((err) =>
              console.error("Failed to delete draft from db on reset:", err)
            )
          : Promise.resolve(),
        clearRevisionMemoryAction(draftId).catch((err) =>
          console.error("Failed to clear revision memory on reset:", err)
        ),
      ]);
    } finally {
      setIsResetting(false);
    }

    revocableUrls(exportedImages).forEach((url) => URL.revokeObjectURL(url));

    // One snapshot, so a field added to DraftSnapshot cannot be left behind here —
    // which is exactly how the export URLs would have survived a reset. The model is
    // handed back in: it is saved with the draft but chosen by the user, and a reset
    // that cleared it left the composer rejecting every message.
    applyDraft(emptyDraft(crypto.randomUUID(), { model: model || models[0] || "" }));
    // Not part of the persisted draft, so cleared alongside rather than within it.
    setBlobs([]);
    setApproved(false);
    setIsTyping(false);
    setBriefPending(false);
    setExportPending(false);
    setLoadingJob(null);
    setPublishState({ status: "idle", progressMsg: "" });

    // The autosave is suppressed for the whole await above and re-runs on the cleared
    // values, so this removes a key that is about to be rewritten empty. Kept because
    // "about to be" is a 400ms debounce, and a tab closed inside it should not come
    // back to the draft that was just discarded.
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

  function applyBriefResult(res: string) {
    setFinalBrief(res);
    setIsTyping(true);
    setStep(2);
    setActiveTab("brief");
    setPanelOpen(true);
    addMessage("ai", "Brief outline berhasil dibuat! Silakan tinjau draf markdown di panel kanan. Anda bisa langsung mengedit teksnya atau ketik revisi di kolom chat.");

    if (typewriterIntervalRef.current) {
      clearInterval(typewriterIntervalRef.current);
    }

    // Reveal position comes from the wall clock, not from counting ticks. A hidden tab
    // has its timers clamped to >=1s and then frozen, so the old "advance 4 chars per
    // 15ms tick" turned an 11-second reveal into 12+ minutes if you switched tabs.
    // Deriving the offset from elapsed time makes a late tick harmless — it lands where
    // the reveal should already be. See revealedLength() and its tests.
    // eslint-disable-next-line react-hooks/purity -- only called from a settled fetch, never during render
    const startedAt = Date.now();
    const finish = () => {
      setBrief(res);
      setIsTyping(false);
      if (typewriterIntervalRef.current) {
        clearInterval(typewriterIntervalRef.current);
        typewriterIntervalRef.current = null;
      }
    };
    revealFinishRef.current = finish;

    typewriterIntervalRef.current = setInterval(() => {
      const n = revealedLength(startedAt, Date.now(), res.length);
      if (n >= res.length) finish();
      else setBrief(res.slice(0, n));
    }, 15);
  }


  /** Cancellable brief run: result is discarded if the user hit Stop meanwhile. */
  function runBriefGeneration(
    fetchFn: (signal: AbortSignal) => Promise<string>,
    errorLabel: string,
  ) {
    // Abort any in-flight request first
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const runId = ++genRunRef.current;
    setBriefPending(true);
    setLoadingJob("brief");

    fetchFn(controller.signal)
      .then((brief) => {
        if (genRunRef.current !== runId) return;
        applyBriefResult(brief);
      })
      .catch((e) => {
        if (genRunRef.current !== runId) return;
        if (e.name === "AbortError") return;
        const msg = e instanceof Error ? e.message : "failed";
        toast.error(msg);
        addMessage("ai", `${errorLabel}: ${summarizeError(msg)}`);
      })
      .finally(() => {
        if (genRunRef.current !== runId) return;
        setBriefPending(false);
        setLoadingJob(null);
      });
  }

  async function fetchBrief(idea: string, signal: AbortSignal): Promise<string> {
    const r = await fetch("/api/generate-brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea, modelId: model }),
      signal,
    });
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${r.status}`);
    }
    return (await r.json()).brief;
  }

  async function fetchBriefFromTopic(topicId: string, signal: AbortSignal): Promise<string> {
    const r = await fetch("/api/generate-brief-from-topic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId, modelId: model }),
      signal,
    });
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${r.status}`);
    }
    return (await r.json()).brief;
  }

  /** Stop button (step 1): abandon the in-flight brief generation. */
  function handleCancelGeneration() {
    abortRef.current?.abort();
    genRunRef.current++;
    setBriefPending(false);
    setLoadingJob(null);
    if (typewriterIntervalRef.current) clearInterval(typewriterIntervalRef.current);
    setIsTyping(false);
    addMessage("ai", "Generasi dibatalkan. Silakan ketik ide baru atau pilih topic lain.");
  }

  /** Topic Bank trigger: expand a saved topic straight into a brief (gate 1). */
  function startBriefFromTopic(t: { id: string; title: string }) {
    if (!model) {
      toast.error("Pilih model AI dulu");
      return;
    }
    setTopicId(t.id);
    setTopicTitle(t.title);
    addMessage("user", `Buat carousel dari topic: ${t.title}`);
    runBriefGeneration(
      (signal) => fetchBriefFromTopic(t.id, signal),
      "Gagal memproses topic",
    );
  }

  function handlePlanGeneration() {
    if (!brief) return;
    addMessage("user", "Approve brief outline & generate Slide design.");
    setLoadingJob("plan");
    const runId = genRunRef.current;
    start(async () => {
      try {
        const generatedPlan = await planAction(brief, model as ModelId);
        // Reset while the plan was generating — do not walk the cleared draft to step 3.
        if (genRunRef.current !== runId) return;
        setPlan(generatedPlan);
        setPanelOpen(true);
        setApproved(false);
        setStep(3);
        setActiveTab("preview");
        addMessage("ai", "Slide deck HTML berhasil dirender! Anda sekarang dapat meninjau visualnya pada tab 'Live Design Preview'. Jika butuh penyesuaian, ketik revisi Anda di kolom chat.");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "failed";
        toast.error(msg);
        addMessage("ai", `Gagal merender slide: ${summarizeError(msg)}`);
      } finally {
        setLoadingJob(null);
      }
    });
  }

  function handleHumanVoicePolish() {
    if (!brief.trim() || !model) return;
    addMessage("user", "Jalankan Human Voice Editor (Anti-Agentic Copywriting pass)...");
    start(async () => {
      try {
        addMessage("ai", "Memoles brief dengan Human Voice Editor...");
        const polished = await humanVoiceEditorAction(brief, model as ModelId);
        setBrief(polished);
        setFinalBrief(polished);
        toast.success("Brief berhasil dipoles dengan Human Voice Editor!");
        addMessage("ai", "Brief telah diperbarui tanpa pola agentic/AI generik. Silakan periksa hasilnya.");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "failed";
        toast.error(msg);
        addMessage("ai", `Gagal memoles brief: ${summarizeError(msg)}`);
      }
    });
  }


  if (!mounted) {
    return <div className="min-h-[400px] flex items-center justify-center text-sm text-muted-foreground animate-pulse">Loading draft workspace...</div>;
  }

  /* ── Derived view state ───────────────────────────────────────────────────────
   * Which tabs exist is a pure function of what has been produced. A tab appearing is
   * how the user learns the stage moved on, so there is no separate stepper to read. */
  const tabs: ArtifactTabDef[] = [
    ...(brief ? [{ id: "brief" as const, label: "Brief" }] : []),
    ...(plan ? [{ id: "preview" as const, label: "Slide" }] : []),
    ...(exportedImages.length > 0 || exportPending ? [{ id: "images" as const, label: "Gambar" }] : []),
    ...(exportedImages.length > 0 ? [{ id: "publish" as const, label: "Jadwal" }] : []),
  ];
  const hasArtifact = tabs.length > 0;
  const activeArtifactTab: ArtifactTab = tabs.some((t) => t.id === activeTab)
    ? activeTab
    : (tabs[tabs.length - 1]?.id ?? "brief");

  const artifactCards: ArtifactCard[] = [
    ...(brief ? [{ kind: "brief" as const, title: "Brief carousel", subtitle: "Kerangka isi tiap slide" }] : []),
    ...(plan ? [{ kind: "slides" as const, title: `Rancangan ${slideCount} slide`, subtitle: "Pratinjau desain" }] : []),
    ...(exportedImages.length > 0
      ? [{ kind: "images" as const, title: `${exportedImages.length} gambar siap`, subtitle: "JPEG 1080x1350" }]
      : []),
  ];

  function openArtifact(tab: ArtifactTab) {
    setActiveTab(tab);
    setPanelOpen(true);
    setMobilePanel("canvas");
  }

  const composerPlaceholder =
    step === 1
      ? "Ceritakan ide carousel kamu..."
      : step === 2
        ? "Minta perubahan pada brief..."
        : step === 3 || step === 4
          ? "Minta perubahan pada slide..."
          : "Ketik instruksi...";

  /* Contextual next step. Only the one action that makes sense right now is offered,
   * which is what replaced the always-visible row of stage buttons. */
  const nextAction =
    step === 2 && brief ? (
      <Button size="sm" onClick={handlePlanGeneration} disabled={busy || isTyping} className="gap-1.5">
        <LayoutGrid className="size-4" />
        Buat rancangan slide
      </Button>
    ) : step === 3 && plan ? (
      <Button size="sm" onClick={() => handleExport()} disabled={busy} className="gap-1.5">
        <Images className="size-4" />
        Jadikan gambar
      </Button>
    ) : step === 4 && exportedImages.length > 0 ? (
      <Button size="sm" onClick={() => { setStep(5); openArtifact("publish"); }} className="gap-1.5">
        Atur jadwal posting
        <ArrowRight className="size-4" />
      </Button>
    ) : step === 4 && plan ? (
      /* Step 4 with nothing to show. Reachable whenever the render survived but the
       * upload did not: the slides were object URLs, which are stripped on save and
       * dead after a reload, and the carousel row was written with no imageUrls, so
       * the restore effect finds nothing either. This branch used to be `null` — no
       * export action (that one is gated on step 3), no publish action (gated on
       * having images), no way back. The wizard simply ended. */
      <Button size="sm" onClick={() => handleExport(true)} disabled={busy} className="gap-1.5">
        <Images className="size-4" />
        Ulangi ekspor gambar
      </Button>
    ) : null;

  return (
    <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden font-sans">
      <div className="shrink-0 flex items-center justify-between gap-3 pb-2">
        <ProgressStrip step={step} />

        <div className="flex items-center gap-0.5 shrink-0">
          {hasArtifact && !panelOpen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openArtifact(activeArtifactTab)}
              className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <PanelRightOpen className="size-4" />
              <span className="hidden sm:inline">Buka hasil</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            title="Mulai sesi baru"
            aria-label="Mulai sesi baru"
            className="size-8 text-muted-foreground hover:text-foreground active:scale-95 transition-transform"
          >
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </div>

      {/* One shell, two panes. The border and radius belong to this container now — the
          panes inside it are separated by the drag handle, not by a gap between cards. */}
      <div
        ref={splitRef}
        style={{ "--panel-w": `${panelPct}%` } as React.CSSProperties}
        className="flex-1 min-h-0 flex rounded-xl border border-hairline overflow-hidden"
      >
        <div
          className={`flex-1 min-w-0 min-h-0 flex-col bg-card/40 ${
            panelOpen ? (mobilePanel === "canvas" ? "hidden lg:flex" : "flex") : "flex"
          }`}
        >
          <ChatFeed
            messages={messages as Message[]}
            busy={busy}
            loadingJob={loadingJob}
            artifacts={artifactCards}
            onOpenArtifact={(kind) => openArtifact(kind === "slides" ? "preview" : kind)}
            footer={nextAction}
            emptyState={
              <div className="flex flex-col items-center text-center gap-5 py-10">
                <span className="size-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Sparkles className="size-5" />
                </span>
                <div className="space-y-1.5">
                  <h2 className="text-lg font-semibold tracking-tight">Mau bikin carousel tentang apa?</h2>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Tulis idenya seperti mengobrol. Brief, desain slide, sampai jadwal posting disusun dari sini.
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 w-full max-w-sm">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleUnifiedSubmit(s)}
                      disabled={!model || busy}
                      className="text-left text-sm rounded-lg border border-hairline bg-card px-3.5 py-2.5 hover:bg-muted/50 hover:border-primary/30 active:scale-[0.99] transition-all disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            }
          />

          <Composer
            value={chatInput}
            onChange={(v) => {
              setChatInput(v);
              if (historyIndex !== -1) setHistoryIndex(-1);
            }}
            onSubmit={() => handleUnifiedSubmit()}
            onKeyDown={(e) => handlePromptKeyDown(e, chatInput, setChatInput, () => handleUnifiedSubmit())}
            onCancel={handleCancelGeneration}
            busy={briefPending}
            canSend={Boolean(model) && chatInput.trim().length > 0 && !isTyping}
            placeholder={composerPlaceholder}
            topics={bankTopics}
            onPickTopic={startBriefFromTopic}
            hint={
              topicTitle ? (
                <p className="text-[11px] text-muted-foreground text-center truncate">
                  Dari Topic Bank: <span className="text-foreground font-medium">{topicTitle}</span>
                </p>
              ) : null
            }
            modelSelector={
              <ModelPicker models={models} model={model} onChange={setModel} disabled={busy} />
            }
          />
        </div>

        {panelOpen && hasArtifact && (
          <>
            <SplitHandle containerRef={splitRef} value={panelPct} onCommit={setPanelPct} />
            <div
              className={`min-h-0 w-full lg:w-(--panel-w) lg:shrink-0 ${
                mobilePanel === "canvas" ? "flex" : "hidden lg:flex"
              }`}
            >
              <ArtifactPanel
                tabs={tabs}
                active={activeArtifactTab}
                onSelect={setActiveTab}
                onClose={() => {
                  setPanelOpen(false);
                  setMobilePanel("chat");
                }}
                loadingJob={loadingJob}
                actions={
                  activeArtifactTab === "preview" && slideCount > 1 ? (
                    <button
                      type="button"
                      onClick={() => setPreviewMode((m) => (m === "grid" ? "single" : "grid"))}
                      aria-pressed={previewMode === "grid"}
                      aria-label={previewMode === "grid" ? "Tampilkan satu slide" : "Tampilkan semua slide"}
                      title={previewMode === "grid" ? "Tampilkan satu slide" : "Tampilkan semua slide"}
                      className={`relative size-7 rounded-lg flex items-center justify-center transition-[color,background-color] duration-150 ease-out shrink-0 ${
                        previewMode === "grid"
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      }`}
                    >
                      {/* Both icons stay mounted and cross-fade, so the swap has an exit as
                          well as an enter without pulling in a motion library. */}
                      <LayoutGrid
                        className="absolute size-4 transition-[opacity,scale,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
                        style={
                          previewMode === "grid"
                            ? { opacity: 0, scale: 0.25, filter: "blur(4px)" }
                            : { opacity: 1, scale: 1, filter: "blur(0px)" }
                        }
                      />
                      <RectangleVertical
                        className="absolute size-4 transition-[opacity,scale,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
                        style={
                          previewMode === "grid"
                            ? { opacity: 1, scale: 1, filter: "blur(0px)" }
                            : { opacity: 0, scale: 0.25, filter: "blur(4px)" }
                        }
                      />
                    </button>
                  ) : null
                }
              >
                {activeArtifactTab === "brief" && (
                  <BriefEditor
                    brief={brief}
                    onChange={setBrief}
                    mode={mdMode as MdMode}
                    onModeChange={setMdMode}
                    disabled={busy || isTyping}
                    onPolish={handleHumanVoicePolish}
                    polishDisabled={busy || isTyping || !brief.trim() || !model}
                  />
                )}

                {activeArtifactTab === "preview" && (
                  // The canvas owns the height rather than growing past it: the thumbnail
                  // strip and the slide counter are navigation, and navigation you have to
                  // scroll to find is not navigation. PreviewFrame reads this box and fits
                  // the slide inside whatever is left.
                  <div className="flex-1 min-h-0 p-3 flex flex-col gap-3">
                    <div className="flex-1 min-h-0 flex justify-center">
                      {/* Wider cap than the default 540px: the divider exists so this can
                          actually grow when the user drags it. */}
                      <PreviewFrame
                        html={html}
                        slideCount={slideCount}
                        maxWidthClass="max-w-[720px]"
                        mode={previewMode}
                        onModeChange={setPreviewMode}
                      />
                    </div>
                    {plan && (
                      // Renders nothing unless a slide is waiting on a real screenshot, so
                      // this costs the preview no height in the ordinary case.
                      <div className="shrink-0 max-h-[38%] overflow-y-auto">
                        <ScreenshotUploads plan={plan} onUpdate={handleUpdateScreenshot} />
                      </div>
                    )}
                  </div>
                )}

                {activeArtifactTab === "images" && (
                  <ExportPanel
                    images={exportedImages}
                    pending={exportPending}
                    expectedCount={slideCount}
                    canDownload={!exportPending && (blobs.length > 0 || exportedImages.length > 0)}
                    onDownloadAll={handleDownloadAll}
                    onDownloadOne={handleDownloadOne}
                  />
                )}

                {activeArtifactTab === "publish" && (
                  <PublishPanel
                    dueAt={dueAt}
                    onDueAtChange={setDueAt}
                    title={editableTitle}
                    onTitleChange={setEditableTitle}
                    caption={editableCaption}
                    onCaptionChange={setEditableCaption}
                    onCommitEdits={handleSaveEdits}
                    config={pubConfig}
                    state={publishState as PublishState}
                    onPublish={handlePublish}
                    onSaveToStock={handleSaveToStock}
                    onReset={handleReset}
                  />
                )}
              </ArtifactPanel>
            </div>
          </>
        )}
      </div>

      {panelOpen && hasArtifact && (
        <div className="lg:hidden shrink-0 pt-2 flex justify-center">
          <div className="inline-flex p-0.5 bg-muted/60 rounded-lg border border-hairline">
            <button
              type="button"
              onClick={() => setMobilePanel("chat")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                mobilePanel === "chat" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              Obrolan
            </button>
            <button
              type="button"
              onClick={() => setMobilePanel("canvas")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                mobilePanel === "canvas" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              Hasil
            </button>
          </div>
        </div>
      )}

      {showPendingModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pending-shot-title"
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <Card className="w-full max-w-md bg-card border-hairline shadow-xl">
            <CardContent className="p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <span className="size-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                  <AlertCircle className="size-5" />
                </span>
                <div>
                  <h3 id="pending-shot-title" className="font-semibold text-sm text-foreground">
                    Ada slide yang butuh screenshot
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {plan?.slides.filter((s) => s.role === "point" && s.mockup?.type === "screenshot" && s.mockup.evidenceStatus === "pending").length} slide belum ada gambar aslinya.
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-muted/40 rounded-lg flex flex-col gap-1.5">
                {plan?.slides.map((s, idx) =>
                  s.role === "point" && s.mockup?.type === "screenshot" && s.mockup.evidenceStatus === "pending" ? (
                    <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate">Slide {idx + 1}: {s.headline}</span>
                      <span className="text-rose-500 font-medium shrink-0">Belum ada</span>
                    </div>
                  ) : null
                )}
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Kamu bisa unggah screenshot di panel Slide, atau lanjut tanpa gambar dan slide itu dirender sebagai kutipan teks.
              </p>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => setShowPendingModal(false)}>
                  Unggah dulu
                </Button>
                <Button size="sm" variant="secondary" onClick={handleContinueWithoutScreenshots}>
                  Lanjut tanpa gambar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
