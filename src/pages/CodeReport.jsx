import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, ScanSearch } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import CodeReportDashboard from "@/components/code/CodeReportDashboard";
import DownloadFixesButton from "@/components/code/DownloadFixesButton";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function CodeReport() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMissing(false);

    base44.functions
      .invoke("getCodeScanReport", { id })
      .then((response) => {
        const data = response?.data || {};
        if (data.error || !data.report) throw new Error(data.error || "not found");
        if (!cancelled) setReport(data.report);
      })
      .catch(() => {
        if (!cancelled) setMissing(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const shell = (children) => (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="relative">
        <div className="grid-trace pointer-events-none absolute inset-x-0 top-0 h-72 opacity-[0.45]" />
        <div className="relative mx-auto max-w-4xl px-5 py-14 lg:py-20">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );

  if (loading) {
    return shell(
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-signal" />
        <p className="text-sm">Loading report…</p>
      </div>
    );
  }

  if (missing || !report) {
    return shell(
      <div className="rounded-2xl border border-border/70 bg-card/40 px-6 py-10 text-center">
        <p className="font-heading text-lg font-semibold tracking-tight">Report not found</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          This report may have been removed. You can search your past scans from the reports page.
        </p>
        <Button asChild variant="outline" className="mt-5 rounded-xl">
          <Link to="/reports">Go to reports</Link>
        </Button>
      </div>
    );
  }

  return shell(
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/reports"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All reports
          </Link>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Code security report
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DownloadFixesButton report={report} />
          <Button asChild className="rounded-xl">
            <Link to="/scan-code">
              <ScanSearch className="mr-2 h-4 w-4" /> Scan more code
            </Link>
          </Button>
        </div>
      </div>

      <CodeReportDashboard report={report} />
    </div>
  );
}