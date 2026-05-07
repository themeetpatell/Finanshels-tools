import { z } from "zod";

/** Minimum viable profile shown before engagement surfaces (matches hiring gate sizing). */
export const leadIdentifySchema = z.object({
  fullName: z.string().min(2).max(120),
  workEmail: z.string().email(),
  companyName: z.string().min(2).max(160),
  companySize: z.enum(["1-5", "6-20", "21-50", "51-200", "201-plus"]),
  consentAccepted: z.boolean().refine((v) => v === true, { message: "Consent is required to continue." }),
  funnelContext: z.enum(["assessment_entry", "toolkit_hub", "tool_entry"]),
  sourceToolSlugHint: z.string().max(120).optional(),
});

export type LeadIdentifyInput = z.infer<typeof leadIdentifySchema>;
