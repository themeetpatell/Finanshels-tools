import * as React from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  id: string;
  label: string;
  className?: string;
  errorId?: string;
  error?: string | null;
  children: React.ReactNode;
};

/** Reusable label + control region with optional `aria-describedby` wiring for errors. */
export function FormField({ id, label, className, errorId, error, children }: FormFieldProps) {
  const errId = error ? (errorId ?? `${id}-error`) : undefined;
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>, {
            id,
            "aria-invalid": Boolean(error),
            "aria-describedby": errId,
          })
        : children}
      {error && errId ? (
        <p id={errId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
