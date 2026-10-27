export function buildFixesMarkdown(report) {
  const findings = Array.isArray(report?.findings) ? report.findings.filter((finding) => finding.code_fix) : [];
  const lines = [
    "# SecureScan — code fixes",
    "",
    `Files: ${report?.file_names || "—"}`,
    `Languages: ${report?.code_language || "—"}`,
    `Score: ${report?.score ?? 0}/100 (grade ${report?.grade || "—"})`,
    `Scanned: ${report?.scan_date || "—"}`,
    "",
  ];

  findings.forEach((finding, index) => {
    lines.push(`## ${index + 1}. ${finding.title} — ${String(finding.severity).toUpperCase()}`);
    lines.push(`Location: ${finding.file}${finding.line ? `:${finding.line}` : ""}`);
    if (finding.code_fix.note) lines.push(`Why: ${finding.code_fix.note}`);
    lines.push("", "### Before", "```", finding.code_fix.before, "```", "", "### After", "```", finding.code_fix.after, "```", "");
    if (Array.isArray(finding.fix) && finding.fix.length) {
      lines.push("Steps:");
      finding.fix.forEach((step) => lines.push(`- ${step}`));
      lines.push("");
    }
  });

  if (!findings.length) {
    lines.push("No auto-fixable issues were found in this scan.");
    lines.push("");
  }

  return lines.join("\n");
}

export function downloadTextFile(filename, content, type = "text/markdown") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}