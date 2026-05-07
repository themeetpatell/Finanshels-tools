import type { FieldErrors, FieldValues } from "react-hook-form";

/** Returns the first nested validation message from react-hook-form errors (readout + a11y). */
export function getFirstErrorMessage<T extends FieldValues>(errors: FieldErrors<T>): string | undefined {
  for (const v of Object.values(errors)) {
    if (!v) continue;
    if (typeof v.message === "string") return v.message;
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      const inner = getFirstErrorMessage(v as FieldErrors<T>);
      if (inner) return inner;
    }
  }
  return undefined;
}
