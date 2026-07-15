import { requireSession } from "@/lib/session";
import { assembleCarousel } from "@/lib/ds/assemble";
import { samplePlan } from "@/lib/ds/sample";
import { PreviewFrame } from "./preview-frame";

// samplePlan is static and request-independent — assemble once at module load.
const sampleHtml = assembleCarousel(samplePlan);

export default async function PreviewPage() {
  await requireSession();
  return (
    <main className="mx-auto mt-[4vh] max-w-[720px] p-6">
      <h1 className="mb-4 text-[32px] tracking-tight">
        <span className="gradient-text">Preview</span>
      </h1>
      <PreviewFrame html={sampleHtml} />
    </main>
  );
}
