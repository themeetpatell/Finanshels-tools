"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Row = { label: string; value: number };

export function DimensionBarChart({
  data,
  title = "Dimension scores (0–100)",
}: {
  data: Row[];
  /** Accessible name for the chart region */
  title?: string;
}) {
  return (
    <figure className="w-full space-y-2">
      <figcaption className="text-sm font-medium text-foreground">{title}</figcaption>
      <div className="h-[min(320px,70vw)] w-full min-h-[240px]" role="presentation" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={68} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={36} />
            <Tooltip
              formatter={(v) => [`${v ?? 0}`, "Score"]}
              contentStyle={{ borderRadius: 12 }}
            />
            <Bar dataKey="value" fill="var(--chart-1)" radius={[6, 6, 0, 0]} maxBarSize={56} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="sr-only">
        Bar chart showing {data.map((d) => `${d.label} ${d.value}`).join(", ")}.
      </p>
    </figure>
  );
}
