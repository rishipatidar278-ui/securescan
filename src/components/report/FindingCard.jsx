import { Wrench } from "lucide-react";
import { SEVERITY_META } from "@/lib/reportStatus";

const BADGE = {
  high: "bg-danger/10 ring-danger/25 text-danger",
  medium: "bg-warn/10 ring-warn/25 text-warn",
  low: "bg-border/40 ring-border text-muted-foreground",
};

export default function FindingCard({ finding, fixable = false }) {
  const meta = SEVERITY_META[finding.severity] || SEVERITY_META.low;
  const evidence = Array.isArray(finding.evidence)
    ? finding.evidence
    : finding.evidence
      ? [finding.evidence]
      : [];
  const fix = Array.isArray(finding.fix) ? finding.fix : finding.fix ? [finding.fix] : [];

  return (
    <article className="rounded-2xl border border-border/80 bg-card/60 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-base font-semibold tracking-tight">{finding.title}</h3>
          {fixable && (
            <span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-signal/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-signal ring-1 ring-signal/25">
              <Wrench className="h-3 w-3" />
              Fix Kit can fix this
            </span>
          )}
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em] ring-1 ${
            BADGE[finding.severity] || BADGE.low
          }`}
        >
          {meta.label}
        </span>
      </div>

      {evidence.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-l border-border pl-4">
          {evidence.map((line, index) => (
            <li key={index} className="break-words font-mono text-[12px] leading-relaxed text-muted-foreground">
              {line}
            </li>
          ))}
        </ul>
      )}

      {fix.length > 0 && (
        <div className="mt-5 rounded-xl border border-border/70 bg-background/50 p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-signal">How to fix</p>
          <ol className="mt-3 space-y-2">
            {fix.map((step, index) => (
              <li key={index} className="flex gap-3 text-sm leading-relaxed text-foreground/90">
                <span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </article>
  );
}