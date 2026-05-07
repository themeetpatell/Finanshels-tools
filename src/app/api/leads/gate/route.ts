import { NextResponse } from "next/server";

import { persistGateLead } from "@/lib/data/persistence";
import { toolGateLeadSchema } from "@/lib/validators/tool-gate";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = toolGateLeadSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
    }
    const b = parsed.data;
    const res = await persistGateLead({
      firstName: b.firstName,
      workEmail: b.workEmail,
      companyName: b.companyName,
      companySize: b.companySize,
      sourceToolSlug: b.sourceToolSlug,
    });
    return NextResponse.json({ ok: true, persistence: res });
  } catch (e) {
    console.error("[api/leads/gate]", e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
