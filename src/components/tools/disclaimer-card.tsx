import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DisclaimerCard({
  title = "Important disclaimer",
  body,
}: {
  title?: string;
  body: string;
}) {
  return (
    <Card className="border-dashed bg-muted/30">
      <CardHeader className="gap-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="leading-relaxed text-sm text-muted-foreground">{body}</CardDescription>
      </CardHeader>
    </Card>
  );
}
