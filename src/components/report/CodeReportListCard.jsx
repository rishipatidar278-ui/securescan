import { ChevronRight, Code2, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { TONE_TEXT, countBySeverity, formatScanDate, gradeOf } from "@/lib/reportStatus";

export default function CodeReportListCard({ report, trend, onOpen }) {
  const grade = gradeOf(report.score || 0);
  const counts = countBySeverity(Array.isArray(report.findings) ? report.findings : []);
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendClass = trend > 0 ? "text-signal" : trend < 0 ? "text-danger" : "text-muted-foreground";
  const trendText = trend === null ? "First scan" : `${trend > 0 ? "+" : ""}${trend} vs previous`;
  const fixable = (Array.isArray(report.findings) ? report.findings : []).filter((finding) => finding.code_fix).length;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card/60 p-5 text-left transition-colors hover:border-signal/40"
    >
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-mono text-sm text-foreground/90">
          <Code2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{report.code_language || "Code scan"}</span>
        </p>
        <p className="mt-1.5 truncate text-xs text-muted-foreground">
          {report.file_names || "pasted code"} · {formatScanDate(report.scan_date)}
        </p>
        {fixable > 0 && (
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-signal">
            {fixable} auto-fix{fixable === 1 ? "" : "es"} ready
          </p>
        )}
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
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  );
}