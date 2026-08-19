import type { TopicCategory } from "./bank";
import type { PlanMode } from "./schedule";

/**
 * Request shape for a topic batch. The generation itself runs on the backend —
 * this is only the contract for describing what to generate.
 */
export interface GenerateTopicsInput {
  mode: PlanMode;
  count?: number;
  category?: TopicCategory;
  focusArea?: string;
  directives?: string;
  research?: boolean;
  /** Calendar anchor for weekly/monthly plans. */
  startDate?: string;
}
