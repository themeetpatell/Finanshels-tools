import { z } from "zod";

export const leadCaptureSchema = z.object({
  fullName: z.string().min(2).max(120),
  workEmail: z.string().email(),
  /** Optional on the short post-assessment path — stored as "(not provided)" when empty. */
  phone: z
    .string()
    .max(40)
    .transform((s) => {
      const t = s.trim();
      return t.length >= 6 ? t : "(not provided)";
    }),
  companyName: z.string().min(2).max(160),
  companySize: z.string().min(1).max(80),
  annualRevenueBand: z.string().min(1).max(120),
  /** Optional — default line when left blank so CRM still has a note. */
  primaryChallenge: z
    .string()
    .max(500)
    .transform((s) => {
      const t = s.trim();
      return t.length >= 2 ? t : "Detailed readout requested via Finance Navigator.";
    }),
  consentAccepted: z
    .boolean()
    .refine((accepted) => accepted === true, { message: "Consent is required to proceed." }),

  sourceToolSlug: z.string().min(1).max(120).optional(),
  calculatorInputs: z.unknown().optional(),
  calculatorOutputs: z.unknown().optional(),
  assessmentSnapshot: z.record(z.string(), z.unknown()).optional(),
});

export type LeadCaptureInput = z.infer<typeof leadCaptureSchema>;
