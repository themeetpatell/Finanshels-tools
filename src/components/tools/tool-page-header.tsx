import { Badge } from "@/components/ui/badge";
import { funnelPhaseMetaForSlug } from "@/lib/tools/canonical-sequence";
import { TOOLS_BY_SLUG, type ToolSlug } from "@/lib/tools/registry";

export function ToolPageHeader({ slug }: { slug: ToolSlug }) {
  const tool = TOOLS_BY_SLUG[slug];
  const phase = funnelPhaseMetaForSlug(slug);
  return (
    <header className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="font-normal text-xs">
          Part {phase.phase} · {phase.visitorTitle}
        </Badge>
      </div>
      <p className="max-w-3xl text-sm text-muted-foreground leading-relaxed">{phase.visitorSummary}</p>
      <h1 className="text-balance text-[1.5rem] font-semibold leading-tight tracking-tight min-[400px]:text-2xl sm:text-3xl md:text-4xl">{tool.title}</h1>
      <p className="max-w-3xl text-pretty text-muted-foreground leading-relaxed">{tool.purpose}</p>
    </header>
  );
}
