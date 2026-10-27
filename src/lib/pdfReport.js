import { jsPDF } from "jspdf";

const INK = [15, 23, 42];
const MUTED = [100, 116, 139];
const LIGHT = [148, 163, 184];
const GREEN = [16, 185, 129];
const AMBER = [217, 119, 6];
const RED = [220, 38, 38];
const RULE = [226, 232, 240];

const GROUPS = [
  {
    severity: "high",
    label: "High severity",
    color: RED,
    note: "Fix these first - each one is a door an attacker can walk through.",
  },
  {
    severity: "medium",
    label: "Medium severity",
    color: AMBER,
    note: "Worth fixing soon - each one weakens a layer of your protection.",
  },
  { severity: "low", label: "Low severity", color: MUTED, note: "Small gaps that are quick to close." },
];

function gradeOf(score) {
  if (score >= 90) return { grade: "A", word: "Strong", color: GREEN };
  if (score >= 80) return { grade: "B", word: "Good", color: GREEN };
  if (score >= 70) return { grade: "C", word: "Fair", color: AMBER };
  if (score >= 60) return { grade: "D", word: "Poor", color: AMBER };
  return { grade: "F", word: "At risk", color: RED };
}

function sanitizeFilenamePart(value) {
  return (
    String(value || "")
      .replace(/^https?:\/\//i, "")
      .replace(/[^a-z0-9.-]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "site"
  );
}

export function generateReportPdf(report) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;
  const bottomLimit = pageH - 30;

  const findings = Array.isArray(report?.findings) ? report.findings : [];
  const counts = { high: 0, medium: 0, low: 0 };
  findings.forEach((finding) => {
    if (counts[finding.severity] !== undefined) counts[finding.severity] += 1;
  });
  const score = Math.max(0, Math.min(100, Math.round(report?.score || 0)));
  const grade = gradeOf(score);
  const scanDate = report?.scan_date
    ? new Date(report.scan_date).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  // Branded header band
  doc.setFillColor(...INK);
  doc.rect(0, 0, pageW, 34, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("SecureScan", margin, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(186, 200, 220);
  doc.text("Website security report", margin, 21);
  doc.text(scanDate, pageW - margin, 14, { align: "right" });
  const urlLines = doc.splitTextToSize(report?.url || "", 95);
  doc.text(urlLines[0] + (urlLines.length > 1 ? "..." : ""), pageW - margin, 21, { align: "right" });

  // Score + grade block
  let y = 52;
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(40);
  doc.text(String(score), margin, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text("/ 100", margin + 2, y + 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...grade.color);
  doc.text(`Grade ${grade.grade} - ${grade.word}`, margin + 30, y + 1);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(
    `${findings.length} issues found: ${counts.high} high, ${counts.medium} medium, ${counts.low} low.`,
    margin + 30,
    y + 9
  );

  y += 24;
  doc.setDrawColor(...RULE);
  doc.line(margin, y, pageW - margin, y);
  y += 12;

  if (findings.length === 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...GREEN);
    doc.text("All clear", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text("No issues were found in this scan.", margin, y + 7);
  } else {
    let findingIndex = 0;
    const asList = (value) => (Array.isArray(value) ? value : value ? [value] : []);

    for (const group of GROUPS) {
      const items = findings.filter((finding) => finding.severity === group.severity);
      if (!items.length) continue;

      if (y + 18 > bottomLimit) {
        doc.addPage();
        y = 24;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...group.color);
      doc.text(group.label, margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text(group.note, margin, y);
      y += 9;

      for (const finding of items) {
        findingIndex += 1;
        const evidence = asList(finding.evidence);
        const fixes = asList(finding.fix);

        const titleLines = doc.splitTextToSize(`${findingIndex}. ${finding.title || "Finding"}`, contentW);
        if (y + titleLines.length * 5 + 6 > bottomLimit) {
          doc.addPage();
          y = 24;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...INK);
        doc.text(titleLines, margin, y);
        y += titleLines.length * 5 + 1.5;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...group.color);
        doc.text(group.label.toUpperCase(), margin, y);
        y += 4.5;

        for (const line of evidence) {
          const lines = doc.splitTextToSize(`- ${line}`, contentW - 4);
          if (y + lines.length * 4.4 > bottomLimit) {
            doc.addPage();
            y = 24;
          }
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.5);
          doc.setTextColor(...MUTED);
          doc.text(lines, margin + 4, y);
          y += lines.length * 4.4 + 1.2;
        }

        if (fixes.length) {
          if (y + 10 > bottomLimit) {
            doc.addPage();
            y = 24;
          }
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(...INK);
          doc.text("How to fix:", margin, y);
          y += 5;
          fixes.forEach((step, index) => {
            const lines = doc.splitTextToSize(`${index + 1}. ${step}`, contentW - 4);
            if (y + lines.length * 4.4 > bottomLimit) {
              doc.addPage();
              y = 24;
            }
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9.5);
            doc.setTextColor(...MUTED);
            doc.text(lines, margin + 4, y);
            y += lines.length * 4.4 + 1.2;
          });
        }

        y += 5;
        doc.setDrawColor(...RULE);
        doc.line(margin, y - 2, pageW - margin, y - 2);
        y += 4;
      }
      y += 6;
    }
  }

  // Footer with summary line on every page
  const summary = `${findings.length} issues found: ${counts.high} high, ${counts.medium} medium, ${counts.low} low`;
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...RULE);
    doc.line(margin, pageH - 16, pageW - margin, pageH - 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...LIGHT);
    doc.text(`SecureScan · ${summary}`, margin, pageH - 10);
    doc.text(`Page ${page} of ${total}`, pageW - margin, pageH - 10, { align: "right" });
  }

  doc.save(`securescan-report-${sanitizeFilenamePart(report?.url)}.pdf`);
}