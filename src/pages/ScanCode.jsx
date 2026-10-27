import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import CodeScanForm from "@/components/code/CodeScanForm";
import { base44 } from "@/api/base44Client";

const CHECKS = [
  "Reading files and detecting languages",
  "Hunting hardcoded secrets and API keys",
  "Tracing SQL queries and request input",
  "Checking auth, dangerous calls and crypto",
  "Auditing dependencies and .env contents",
  "Writing fixes for every issue found",
];

export default function ScanCode() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const runScan = async (payload) => {
    setError("");
    setBusy(true);
    setAnalyzing(true);

    try {
      const response = await base44.functions.invoke("runCodeScan", payload);
      const data = response?.data || {};
      if (data.error) throw new Error(data.error);
      navigate(`/code-report/${data.report.id}`);
    } catch (err) {
      const message =
        err?.response?.data?.error || err?.message || "The code scan could not be completed. Please try again.";
      setError(message);
      setAnalyzing(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="relative">
        <div className="grid-trace pointer-events-none absolute inset-x-0 top-0 h-72 opacity-[0.45]" />
        <div className="relative mx-auto max-w-4xl px-5 py-14 lg:py-20">
          <div className="space-y-8">
            <div>
              <Link
                to="/scan"
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-signal"
              >
                Scanning a live website instead?
              </Link>
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-signal">New code scan</p>
              <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Scan your code</h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                For mobile apps, bots, backends and anything without a public URL. Paste your code or upload the files,
                and we will point at every unsafe line — then hand you the corrected snippet.
              </p>
            </div>

            {analyzing ? (
              <div className="rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-signal" />
                  <p className="font-heading text-lg font-semibold tracking-tight">Analysing your code…</p>
                </div>
                <ul className="mt-6 space-y-3">
                  {CHECKS.map((check) => (
                    <li key={check} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-signal/60" />
                      {check}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Usually a few seconds
                </p>
              </div>
            ) : (
              <>
                {error && (
                  <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                    {error}
                  </p>
                )}
                <CodeScanForm busy={busy} onSubmit={runScan} />
              </>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}