import { NextResponse } from "next/server";
import { z } from "zod";

import { persistAssessmentResult } from "@/lib/data/persistence";

const schema = z.object({
  anonymousToken: z.string().max(160).optional(),
  assessmentPayload: z.record(z.string(), z.unknown()),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
    }

    const res = await persistAssessmentResult({
      anonymousToken: parsed.data.anonymousToken,
      assessment: parsed.data.assessmentPayload,
    });

    return NextResponse.json({ ok: true, persistence: res });
  } catch (e) {
    console.error("[api/assessment]", e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
