import { TOOLS_BY_SLUG, type ToolSlug } from "@/lib/tools/registry";

export function ToolPageHeader({ slug }: { slug: ToolSlug }) {
  const tool = TOOLS_BY_SLUG[slug];
  return (
    <header className="space-y-2">
      <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">{tool.title}</h1>
      <p className="max-w-3xl text-pretty text-muted-foreground leading-relaxed">{tool.purpose}</p>
    </header>
  );
}
