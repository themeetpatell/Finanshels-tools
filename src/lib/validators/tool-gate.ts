import { z } from "zod";

export const toolGateLeadSchema = z.object({
  firstName: z.string().min(1).max(80),
  workEmail: z.string().email(),
  companyName: z.string().min(1).max(160),
  companySize: z.string().min(1).max(80),
  sourceToolSlug: z.string().min(1).max(120),
  consentAccepted: z.boolean().refine(Boolean, "Consent is required to continue."),
});

export type ToolGateLeadInput = z.infer<typeof toolGateLeadSchema>;
