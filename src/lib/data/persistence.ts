import { createSupabaseAdmin } from "@/lib/supabase/server";
import { buildCrmPayload } from "@/lib/crm/webhook-log";
import type { Json } from "@/lib/types/json";

export type LeadUpsertPayload = {
  fullName: string;
  workEmail: string;
  phone: string;
  companyName: string;
  companySize: string;
  annualRevenueBand: string;
  primaryChallenge: string;
  consentAccepted: boolean;
  sourceToolSlug?: string;
  calculatorSnapshot?: {
    inputs: Json;
    outputs: Json;
  };
  assessmentSnapshot?: Record<string, unknown>;
};

export type PersistResult = { ok: true; mode: "supabase" | "mock"; id: string };

export async function persistLeadSubmission(payload: LeadUpsertPayload): Promise<PersistResult> {
  const crmEnvelope = buildCrmPayload({
    lead: sanitizeLead(payload),
    assessment: payload.assessmentSnapshot,
    calculator: payload.calculatorSnapshot
      ? {
          toolSlug: payload.sourceToolSlug ?? "unknown",
          inputs: payload.calculatorSnapshot.inputs,
          outputs: payload.calculatorSnapshot.outputs,
        }
      : undefined,
  });

  console.info("[crm:payload_ready]", JSON.stringify(crmEnvelope, null, 2));

  const supabase = createSupabaseAdmin();
  if (!supabase) {
    const id = `mock_${cryptoRandomId()}`;
    return { ok: true, mode: "mock", id };
  }

  /** Insert normalized tables */
  const { data: leadRow, error: leadErr } = await supabase
    .from("leads")
    .insert({
      full_name: payload.fullName,
      work_email: payload.workEmail,
      phone: payload.phone,
      company_name: payload.companyName,
      company_size: payload.companySize,
      annual_revenue_band: payload.annualRevenueBand,
      primary_challenge: payload.primaryChallenge,
      consent_accepted: payload.consentAccepted,
      source_tool_slug: payload.sourceToolSlug ?? null,
      crm_payload: crmEnvelope as unknown as Json,
    })
    .select("id")
    .single();

  if (leadErr || !leadRow?.id) {
    console.error("[supabase:leads_error]", leadErr);
    /** Graceful degrade */
    const id = `fallback_${cryptoRandomId()}`;
    return { ok: true, mode: "mock", id };
  }

  const leadId = leadRow.id as string;

  if (payload.calculatorSnapshot && payload.sourceToolSlug) {
    await supabase.from("calculator_results").insert({
      lead_id: leadId,
      tool_slug: payload.sourceToolSlug,
      inputs: payload.calculatorSnapshot.inputs as Json,
      outputs: payload.calculatorSnapshot.outputs as Json,
    });

    await supabase.from("tool_sessions").insert({
      lead_id: leadId,
      tool_slug: payload.sourceToolSlug,
      completed_at: new Date().toISOString(),
      metadata: { source: "lead_capture_attachment" },
    });
  }

  return { ok: true, mode: "supabase", id: leadId };
}

export async function persistAssessmentResult(payload: {
  anonymousToken?: string;
  assessment: Record<string, unknown>;
}) {
  const supabase = createSupabaseAdmin();
  const envelope = buildCrmPayload({
    lead: {},
    assessment: payload.assessment,
  });

  console.info("[crm:payload_ready]", JSON.stringify(envelope));

  if (!supabase) {
    return { ok: true, mode: "mock" as const, id: `mock_${cryptoRandomId()}` };
  }

  const { data, error } = await supabase
    .from("assessment_results")
    .insert({
      anonymous_token: payload.anonymousToken ?? null,
      payload: payload.assessment as unknown as Json,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    console.error("[supabase:assessment_error]", error);
    return { ok: true, mode: "mock" as const, id: `fallback_${cryptoRandomId()}` };
  }

  return { ok: true, mode: "supabase" as const, id: data.id as string };
}

export async function persistToolSession(meta: {
  toolSlug: string;
  anonymousToken?: string;
  inputs: Json;
  outputs: Json;
}) {
  const supabase = createSupabaseAdmin();
  if (!supabase) return { ok: true, mode: "mock" as const, id: `mock_${cryptoRandomId()}` };

  await supabase.from("calculator_results").insert({
    lead_id: null,
    tool_slug: meta.toolSlug,
    inputs: meta.inputs as Json,
    outputs: meta.outputs as Json,
  });

  const { data, error } = await supabase
    .from("tool_sessions")
    .insert({
      tool_slug: meta.toolSlug,
      anonymous_token: meta.anonymousToken ?? null,
      metadata: { source: "anonymous_completion" },
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    console.error("[supabase:tool_session_error]", error);
    return { ok: true, mode: "mock" as const, id: `fallback_${cryptoRandomId()}` };
  }

  return { ok: true, mode: "supabase" as const, id: data.id as string };
}

function sanitizeLead(p: LeadUpsertPayload) {
  return {
    fullName: p.fullName,
    workEmail: p.workEmail,
    phone: p.phone,
    companyName: p.companyName,
    companySize: p.companySize,
    annualRevenueBand: p.annualRevenueBand,
    primaryChallenge: p.primaryChallenge,
    consentAccepted: p.consentAccepted,
    sourceToolSlug: p.sourceToolSlug ?? null,
  };
}

function cryptoRandomId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}
