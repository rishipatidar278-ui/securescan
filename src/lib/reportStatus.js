export const TONE_TEXT = {
  signal: "text-signal",
  warn: "text-warn",
  danger: "text-danger",
};

export const SEVERITY_META = {
  high: { label: "High" },
  medium: { label: "Medium" },
  low: { label: "Low" },
};

export function countBySeverity(findings = []) {
  return findings.reduce(
    (totals, finding) => {
      if (totals[finding.severity] !== undefined) totals[finding.severity] += 1;
      return totals;
    },
    { high: 0, medium: 0, low: 0 }
  );
}

export function gradeOf(score = 0) {
  if (score >= 90) return { grade: "A", word: "Strong", tone: "signal" };
  if (score >= 80) return { grade: "B", word: "Good", tone: "signal" };
  if (score >= 70) return { grade: "C", word: "Fair", tone: "warn" };
  if (score >= 60) return { grade: "D", word: "Poor", tone: "warn" };
  return { grade: "F", word: "At risk", tone: "danger" };
}

export function formatScanDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}