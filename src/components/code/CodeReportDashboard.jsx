import { CalendarDays, Code2, FileCode2, ShieldCheck, User } from "lucide-react";
import ScoreRing from "@/components/ScoreRing";
import CodeFindingCard from "@/components/code/CodeFindingCard";
import { TONE_TEXT, countBySeverity, formatScanDate, gradeOf } from "@/lib/reportStatus";

const GROUPS = [
  {
    severity: "high",
    heading: "High severity",
    headingClass: "text-danger",
    note: "Fix these first — each one can expose data or hand over control.",
  },
  {
    severity: "medium",
    heading: "Medium severity",
    headingClass: "text-warn",
    note: "Worth fixing soon — each one weakens a layer of your protection.",
  },
  {
    severity: "low",
    heading: "Low severity",
    headingClass: "text-foreground",
    note: "Small gaps that are quick to close.",
  },
];

export default function CodeReportDashboard({ report }) {
  const findings = Array.isArray(report?.findings) ? report.findings : [];
  const counts = countBySeverity(findings);
  const grade = gradeOf(report?.score || 0);
  const fileCount = report?.file_names ? report.file_names.split(",").filter(Boolean).length : 0;
  const groups = GROUPS.map((group) => ({
    ...group,
    items: findings.filter((finding) => finding.severity === group.severity),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="space-y-12">
      <section className="rounded-3xl border border-border/80 bg-panel/80 p-6 sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-7">
            <ScoreRing score={report?.score || 0} size={148} tone={grade.tone} />
            <div>
              <p className="flex items-baseline gap-2.5">
                <span className={`font-heading text-4xl font-semibold tracking-tight ${TONE_TEXT[grade.tone]}`}>
                  {grade.grade}
                </span>
                <span className="text-sm text-muted-foreground">{grade.word}</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-[0.1em]">
                <span className="rounded-full bg-danger/10 px-2.5 py-1 text-danger ring-1 ring-danger/25">
                  {counts.high} high
                </span>
                <span className="rounded-full bg-warn/10 px-2.5 py-1 text-warn ring-1 ring-warn/25">
                  {counts.medium} medium
                </span>
                <span className="rounded-full bg-border/30 px-2.5 py-1 text-muted-foreground ring-1 ring-border">
                  {counts.low} low
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 text-sm text-muted-foreground lg:text-right">
            <p className="flex items-center gap-2 lg:justify-end">
              <Code2 className="h-3.5 w-3.5 shrink-0" />
              <span className="break-words text-foreground/90">{report?.code_language || "Code"}</span>
            </p>
            {fileCount > 0 && (
              <p className="flex items-center gap-2 lg:justify-end">
                <FileCode2 className="h-3.5 w-3.5 shrink-0" />
                {fileCount} file{fileCount === 1 ? "" : "s"}: <span className="break-all">{report?.file_names}</span>
              </p>
            )}
            <p className="flex items-center gap-2 lg:justify-end">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              {formatScanDate(report?.scan_date)}
            </p>
            <p className="flex items-center gap-2 lg:justify-end">
              <User className="h-3.5 w-3.5 shrink-0" />
              Requested by {report?.client_name}
            </p>
          </div>
        </div>
      </section>

      {findings.length === 0 ? (
        <section className="rounded-2xl border border-signal/25 bg-signal/5 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-signal" />
            <h2 className="font-heading text-xl font-semibold tracking-tight">All clear</h2>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            No issues were found in this code. Re-run it after your next change to stay that way.
          </p>
        </section>
      ) : (
        groups.map((group) => (
          <section key={group.severity}>
            <h2 className={`font-heading text-xl font-semibold tracking-tight ${group.headingClass}`}>{group.heading}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{group.note}</p>
            <div className="mt-6 space-y-4">
              {group.items.map((finding, index) => (
                <CodeFindingCard key={`${finding.id}-${finding.file}-${finding.line}-${index}`} finding={finding} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}