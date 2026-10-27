import { Link, useLocation } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SiteNav() {
  const { pathname } = useLocation();
  const onLanding = pathname === "/";

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-signal/12 ring-1 ring-signal/30">
            <ShieldCheck className="h-5 w-5 text-signal" />
          </span>
          <span className="font-heading text-lg font-semibold tracking-tight">SecureScan</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm text-muted-foreground sm:gap-7">
          {onLanding && (
            <>
              <a href="#checks" className="hidden transition-colors hover:text-foreground md:inline">
                What we check
              </a>
              <a href="#how" className="hidden transition-colors hover:text-foreground md:inline">
                How it works
              </a>
            </>
          )}
          <Link to="/scan-code" className="transition-colors hover:text-foreground">
            Code scan
          </Link>
          <Link to="/reports" className="transition-colors hover:text-foreground">
            Reports
          </Link>
        </nav>

        <Button asChild size="sm" className="rounded-full px-4">
          <Link to="/scan">Run a scan</Link>
        </Button>
      </div>
    </header>
  );
}