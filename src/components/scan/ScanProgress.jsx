import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

const CHECKS = [
  "SSL & HTTPS",
  "Security headers",
  "Sensitive files & admin pages",
  "Leaked API keys",
  "Form protection",
  "Directory listing",
];

export default function ScanProgress({ site }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((current) => (current < CHECKS.length - 1 ? current + 1 : current));
    }, 1600);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-8">
      <div className="flex items-center gap-2.5">
        <Loader2 className="h-4 w-4 animate-spin text-signal" />
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-signal">
          Scanning {site || "your site"}
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {CHECKS.map((check, index) => {
          const done = index < step;
          const active = index === step;
          return (
            <div key={check} className="flex items-center gap-3">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full ring-1 ${
                  done ? "bg-signal/15 ring-signal/40" : active ? "bg-signal/10 ring-signal/30" : "ring-border"
                }`}
              >
                {done ? (
                  <Check className="h-3 w-3 text-signal" />
                ) : active ? (
                  <Loader2 className="h-3 w-3 animate-spin text-signal" />
                ) : null}
              </span>
              <span className={`text-sm ${active ? "text-foreground" : "text-muted-foreground"}`}>{check}</span>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Requesting live pages and headers from your site — this usually takes under a minute.
      </p>
    </div>
  );
}