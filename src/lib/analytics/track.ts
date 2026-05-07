export type AnalyticsEventName =
  | "assessment_started"
  | "assessment_completed"
  | "tool_started"
  | "tool_gate_completed"
  | "tool_completed"
  | "lead_identification_submitted"
  | "lead_capture_submitted"
  | "whatsapp_cta_clicked"
  | "consultation_cta_clicked";

export type AnalyticsPayload = Record<string, unknown>;

/**
 * Analytics abstraction — swap implementation for GA4/PostHog without touching UI.
 * Development default: structured console logging.
 */
export function trackEvent(name: AnalyticsEventName, payload: AnalyticsPayload = {}) {
  const enriched = {
    name,
    ts: new Date().toISOString(),
    ...payload,
  };

  if (process.env.NODE_ENV === "development") {
    console.info("[analytics]", enriched);
  }

  if (typeof window !== "undefined") {
    const w = window as Window & { dataLayer?: unknown[] };
    w.dataLayer = w.dataLayer ?? [];
    w.dataLayer.push({ event: name, ...payload });
  }
}
