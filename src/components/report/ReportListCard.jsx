import { ChevronRight, Globe, Minus, TrendingDown, TrendingUp, Wrench } from "lucide-react";
import { TONE_TEXT, countBySeverity, formatScanDate, gradeOf } from "@/lib/reportStatus";

export default function ReportListCard({ report, trend, onOpen, onFixKit }) {
  const grade = gradeOf(report.score || 0);
  const counts = countBySeverity(Array.isArray(report.findings) ? report.findings : []);
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendClass = trend > 0 ? "text-signal" : trend < 0 ? "text-danger" : "text-muted-foreground";
  const trendText =
    trend === null ? "First scan" : `${trend > 0 ? "+" : ""}${trend} vs previous`;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card/60 p-5 text-left transition-colors hover:border-signal/40"
    >
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-mono text-sm text-foreground/90">
          <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{report.url}</span>
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">{formatScanDate(report.scan_date)}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className={`font-mono text-lg font-semibold leading-none ${TONE_TEXT[grade.tone]}`}>
            {report.score}
            <span className="text-xs text-muted-foreground">/100 · {grade.grade}</span>
          </p>
          <p
            className={`mt-1.5 flex items-center justify-end gap-1 font-mono text-[10px] uppercase tracking-[0.08em] ${trendClass}`}
          >
            <TrendIcon className="h-3 w-3" />
            {trendText}
          </p>
        </div>
        <p className="hidden font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground sm:block">
          {counts.high}h · {counts.medium}m · {counts.low}l
        </p>
        <span
          role="button"
          tabIndex={0}
          onClick={(event) => {
            event.stopPropagation();
            onFixKit?.();
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-signal/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-signal ring-1 ring-signal/25 transition-colors hover:bg-signal/20"
        >
          <Wrench className="h-3 w-3" />
          Fix Kit
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  );
}