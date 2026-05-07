import { z } from "zod";

export const leadCaptureSchema = z.object({
  fullName: z.string().min(2).max(120),
  workEmail: z.string().email(),
  phone: z.string().min(6).max(40),
  companyName: z.string().min(2).max(160),
  companySize: z.string().min(1).max(80),
  annualRevenueBand: z.string().min(1).max(120),
  primaryChallenge: z.string().min(2).max(500),
  consentAccepted: z
    .boolean()
    .refine((accepted) => accepted === true, { message: "Consent is required to proceed." }),

  sourceToolSlug: z.string().min(1).max(120).optional(),
  calculatorInputs: z.unknown().optional(),
  calculatorOutputs: z.unknown().optional(),
  assessmentSnapshot: z.record(z.string(), z.unknown()).optional(),
});

export type LeadCaptureInput = z.infer<typeof leadCaptureSchema>;
