import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fn-marketing-shell flex min-h-screen flex-col overflow-x-hidden">
      <SiteHeader />
      <main
        id="main"
        className="relative mx-auto min-w-0 w-full max-w-6xl flex-1 px-3 pb-28 pt-8 sm:px-4 sm:pt-10 md:pb-12 md:pt-12"
      >
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
