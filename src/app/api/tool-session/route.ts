import { NextResponse } from "next/server";
import { z } from "zod";

import { persistToolSession } from "@/lib/data/persistence";
import type { Json } from "@/lib/types/json";

const schema = z.object({
  toolSlug: z.string().min(1).max(160),
  anonymousToken: z.string().max(160).optional(),
  inputs: z.unknown(),
  outputs: z.unknown(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
    }

    const res = await persistToolSession({
      toolSlug: parsed.data.toolSlug,
      anonymousToken: parsed.data.anonymousToken,
      inputs: parsed.data.inputs as Json,
      outputs: parsed.data.outputs as Json,
    });

    return NextResponse.json({ ok: true, persistence: res });
  } catch (e) {
    console.error("[api/tool-session]", e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
