import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Search } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import ReportListCard from "@/components/report/ReportListCard";
import CodeReportListCard from "@/components/report/CodeReportListCard";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatScanDate } from "@/lib/reportStatus";

export default function Reports() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const [reports, setReports] = useState([]);
  const [codeReports, setCodeReports] = useState([]);
  const [error, setError] = useState("");

  const lookup = async (event) => {
    event.preventDefault();
    if (!email.trim()) {
      setError("Enter the email address you used when you ran the scan.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const [siteResponse, codeResponse] = await Promise.all([
        base44.functions.invoke("getClientReports", { email: email.trim() }),
        base44.functions.invoke("getCodeReports", { email: email.trim() }),
      ]);
      const siteData = siteResponse?.data || {};
      const codeData = codeResponse?.data || {};
      if (siteData.error) throw new Error(siteData.error);
      if (codeData.error) throw new Error(codeData.error);
      setReports(siteData.reports || []);
      setCodeReports(codeData.reports || []);
      setSearched(true);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Your reports could not be loaded. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const trendData = [...reports].reverse().map((report) => ({
    date: formatScanDate(report.scan_date),
    score: report.score || 0,
  }));

  const trendFor = (list, index) => (index < list.length - 1 ? list[index].score - list[index + 1].score : null);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="relative">
        <div className="grid-trace pointer-events-none absolute inset-x-0 top-0 h-72 opacity-[0.45]" />
        <div className="relative mx-auto max-w-4xl px-5 py-14 lg:py-20">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal">Reports</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Find a past scan</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Enter the email address you used when you ran the scan and we will list every report saved to it — website
            and code scans, most recent first.
          </p>

          <form onSubmit={lookup} className="mt-8 rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-8">
            <div className="space-y-2">
              <Label
                htmlFor="report-email"
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
              >
                Email address
              </Label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  id="report-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="alex@company.com"
                  className="h-12 rounded-xl bg-background/60 text-sm sm:flex-1"
                />
                <Button type="submit" size="lg" disabled={busy} className="h-12 rounded-xl px-6">
                  {busy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching…
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" /> Find my reports
                    </>
                  )}
                </Button>
              </div>
            </div>
            {error && (
              <p className="mt-5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </p>
            )}
          </form>

          {searched && (
            <Tabs defaultValue="website" className="mt-10">
              <TabsList className="h-auto flex-wrap">
                <TabsTrigger value="website" className="rounded-lg">
                  Website scans ({reports.length})
                </TabsTrigger>
                <TabsTrigger value="code" className="rounded-lg">
                  Code scans ({codeReports.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="website" className="mt-5 space-y-4">
                {reports.length === 0 ? (
                  <div className="rounded-2xl border border-border/70 bg-card/40 px-6 py-10 text-center">
                    <p className="font-heading text-lg font-semibold tracking-tight">No website scans found</p>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                      We have no website reports saved to that email address. Check the spelling, or run a new scan.
                    </p>
                  </div>
                ) : (
                  <>
                    {trendData.length > 1 && (
                      <div className="rounded-2xl border border-border/80 bg-card/60 p-5">
                        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                          Score trend
                        </p>
                        <div className="mt-3 h-28">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData} margin={{ top: 5, right: 8, bottom: 5, left: 8 }}>
                              <XAxis dataKey="date" hide />
                              <YAxis domain={[0, 100]} hide />
                              <Tooltip
                                formatter={(value) => [`${value}/100`, "Score"]}
                                contentStyle={{
                                  background: "hsl(var(--card))",
                                  border: "1px solid hsl(var(--border))",
                                  borderRadius: 12,
                                  fontSize: 12,
                                  color: "hsl(var(--foreground))",
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="score"
                                stroke="hsl(var(--signal))"
                                strokeWidth={2}
                                dot={{ r: 3, fill: "hsl(var(--signal))" }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {reports.map((report, index) => (
                      <ReportListCard
                        key={report.id}
                        report={report}
                        trend={trendFor(reports, index)}
                        onOpen={() => navigate(`/report/${report.id}`)}
                        onFixKit={() => navigate(`/report/${report.id}#fix-kit`)}
                      />
                    ))}
                  </>
                )}
              </TabsContent>

              <TabsContent value="code" className="mt-5 space-y-4">
                {codeReports.length === 0 ? (
                  <div className="rounded-2xl border border-border/70 bg-card/40 px-6 py-10 text-center">
                    <p className="font-heading text-lg font-semibold tracking-tight">No code scans found</p>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                      We have no code reports saved to that email address. Paste your code on the code scan page to
                      create one.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-5 rounded-xl"
                      onClick={() => navigate("/scan-code")}
                    >
                      Scan your code
                    </Button>
                  </div>
                ) : (
                  codeReports.map((report, index) => (
                    <CodeReportListCard
                      key={report.id}
                      report={report}
                      trend={trendFor(codeReports, index)}
                      onOpen={() => navigate(`/code-report/${report.id}`)}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}