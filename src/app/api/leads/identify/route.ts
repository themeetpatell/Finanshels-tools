import { NextResponse } from "next/server";

import { persistIdentificationLead } from "@/lib/data/persistence";
import { leadIdentifySchema } from "@/lib/validators/lead-identify";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = leadIdentifySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
    }

    const b = parsed.data;
    const res = await persistIdentificationLead({
      fullName: b.fullName.trim(),
      workEmail: b.workEmail.trim().toLowerCase(),
      companyName: b.companyName.trim(),
      companySize: b.companySize,
      consentAccepted: b.consentAccepted,
      funnelContext: b.funnelContext,
      sourceToolSlugHint: b.sourceToolSlugHint,
    });

    return NextResponse.json({ ok: true, persistence: res });
  } catch (e) {
    console.error("[api/leads/identify]", e);
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
}
