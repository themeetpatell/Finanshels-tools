import { NextResponse } from "next/server";

import { leadCaptureSchema } from "@/lib/validators/lead";
import { persistLeadSubmission } from "@/lib/data/persistence";
import type { Json } from "@/lib/types/json";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = leadCaptureSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
    }

    const body = parsed.data;
    const res = await persistLeadSubmission({
      fullName: body.fullName,
      workEmail: body.workEmail,
      phone: body.phone,
      companyName: body.companyName,
      companySize: body.companySize,
      annualRevenueBand: body.annualRevenueBand,
      primaryChallenge: body.primaryChallenge,
      consentAccepted: body.consentAccepted,
      sourceToolSlug: body.sourceToolSlug,
      calculatorSnapshot:
        body.calculatorInputs != null && body.calculatorOutputs != null && body.sourceToolSlug
          ? { inputs: body.calculatorInputs as Json, outputs: body.calculatorOutputs as Json }
          : undefined,
      assessmentSnapshot: body.assessmentSnapshot,
    });

    return NextResponse.json({ ok: true, persistence: res });
  } catch (e) {
    console.error("[api/leads]", e);
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
}
