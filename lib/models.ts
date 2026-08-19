/**
 * Model identifiers, as a type only.
 *
 * Which of these are actually usable is decided by the backend (it holds the
 * keys), so this app asks GET /api/models rather than inspecting env vars it
 * cannot see. Kept in sync with the backend's own ModelId union.
 */
export type ModelId =
  | "gemini"
  | "deepseek"
  | "mimo"
  | "openrouter"
  | "omniroute"
  | "vour-high"
  | "vour-lite";
