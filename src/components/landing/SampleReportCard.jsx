import { AlertTriangle, Check, X } from "lucide-react";
import ScoreRing from "@/components/ScoreRing";

const SAMPLE = [
  { label: "HTTPS certificate", status: "pass", note: "Valid, auto-renewing" },
  { label: "Security headers", status: "warn", note: "3 missing" },
  { label: "Admin page exposure", status: "fail", note: "/wp-admin is open" },
  { label: "Leaked API keys", status: "pass", note: "None in public pages" },
  { label: "Form protection", status: "warn", note: "No CSRF token on 1 form" },
  { label: "Directory listing", status: "pass", note: "Closed" },
];

const TONE = {
  pass: { icon: Check, text: "text-signal", chip: "bg-signal/10 ring-signal/25" },
  warn: { icon: AlertTriangle, text: "text-warn", chip: "bg-warn/10 ring-warn/25" },
  fail: { icon: X, text: "text-danger", chip: "bg-danger/10 ring-danger/25" },
};

export default function SampleReportCard() {
  return (
    <div className="relative">
      <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-signal/25 via-transparent to-transparent" />
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-panel/95 p-6 shadow-2xl shadow-black/40">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px animate-scan-sweep bg-gradient-to-r from-transparent via-signal to-transparent" />

        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Sample report
          </span>
          <span className="rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
            example.com
          </span>
        </div>

        <div className="mt-6 flex items-center gap-6">
          <ScoreRing score={62} size={132} />
          <div>
            <p className="font-heading text-lg font-semibold tracking-tight">Needs attention</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Two issues worth fixing this week. Both are quick.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          {SAMPLE.map(({ label, status, note }) => {
            const tone = TONE[status];
            const Icon = tone.icon;
            return (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 px-3.5 py-2.5"
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-md ring-1 ${tone.chip}`}>
                  <Icon className={`h-3.5 w-3.5 ${tone.text}`} />
                </span>
                <span className="flex-1 truncate text-sm text-foreground/90">{label}</span>
                <span className={`font-mono text-[11px] ${tone.text}`}>{note}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}