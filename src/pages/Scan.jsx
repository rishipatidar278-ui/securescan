import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import ScanForm from "@/components/scan/ScanForm";
import ScanProgress from "@/components/scan/ScanProgress";
import { base44 } from "@/api/base44Client";

export default function Scan() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const initialUrl = urlParams.get("url") || "";

  const [stage, setStage] = useState("form");
  const [scanSite, setScanSite] = useState("");
  const [error, setError] = useState("");

  const runScan = async (payload) => {
    setError("");
    setScanSite(payload.url);
    setStage("scanning");

    try {
      const response = await base44.functions.invoke("runSecurityScan", payload);
      const data = response?.data || {};
      if (data.error) throw new Error(data.error);
      navigate(`/report/${data.report.id}`);
    } catch (err) {
      const message =
        err?.response?.data?.error || err?.message || "The scan could not be completed. Please try again.";
      setError(message);
      setStage("form");
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
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal">New scan</p>
              <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                Scan your website
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Enter the address you want checked, confirm you are authorised to scan it, and we will run the checks
                against the live site and explain what we find.
              </p>
            </div>

            {stage === "scanning" ? (
              <ScanProgress site={scanSite} />
            ) : (
              <>
                {error && (
                  <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                    {error}
                  </p>
                )}
                <ScanForm initialUrl={initialUrl} onSubmit={runScan} />
              </>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}