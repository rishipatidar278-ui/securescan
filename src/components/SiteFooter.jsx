import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="border-t border-border/70 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal/12 ring-1 ring-signal/30">
              <ShieldCheck className="h-4 w-4 text-signal" />
            </span>
            <span className="font-heading font-semibold tracking-tight">SecureScan</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Automated website security checks, explained in plain language. Only scan sites you own or are authorised
            to test.
          </p>
        </div>

        <div className="flex gap-14 text-sm">
          <div className="space-y-2.5">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Scan</p>
            <Link to="/scan" className="block text-foreground/80 transition-colors hover:text-signal">
              Run a scan
            </Link>
            <Link to="/reports" className="block text-foreground/80 transition-colors hover:text-signal">
              Find past reports
            </Link>
          </div>
          <div className="space-y-2.5">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Checks</p>
            <p className="text-foreground/80">HTTPS &amp; certificate</p>
            <p className="text-foreground/80">Headers &amp; exposure</p>
            <p className="text-foreground/80">Keys, forms, directories</p>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl px-5 font-mono text-[11px] text-muted-foreground">
        SecureScan · © {new Date().getFullYear()}
      </p>
    </footer>
  );
}