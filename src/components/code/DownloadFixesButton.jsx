import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildFixesMarkdown, downloadTextFile } from "@/lib/codeFixes";

export default function DownloadFixesButton({ report }) {
  const findings = Array.isArray(report?.findings) ? report.findings : [];
  const fixable = findings.filter((finding) => finding.code_fix).length;

  const download = () => {
    const stamp = new Date(report?.scan_date || Date.now()).toISOString().slice(0, 10);
    downloadTextFile(`securescan-code-fixes-${stamp}.md`, buildFixesMarkdown(report));
  };

  return (
    <Button onClick={download} disabled={fixable === 0} variant="outline" className="rounded-xl">
      <Download className="mr-2 h-4 w-4" />
      Download all fixes ({fixable})
    </Button>
  );
}