import { Label } from "@/components/ui/label";

/** Label + arbitrary control — for selects and compound fields (no automatic error wiring). */
export function LabeledSlot({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
