import { ShieldCheck } from "lucide-react";
import SampleReportCard from "@/components/landing/SampleReportCard";
import ModeChooser from "@/components/landing/ModeChooser";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border/70">
      <div className="grid-trace pointer-events-none absolute inset-0 opacity-[0.5]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-signal/25 bg-signal/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-signal">
            <ShieldCheck className="h-3.5 w-3.5" />
            Website &amp; code security scanning
          </span>

          <h1 className="mt-7 font-heading text-4xl font-semibold leading-[1.06] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            Built with AI? Make sure it&apos;s secure.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            You shipped your app, bot or website with AI in a weekend — now check what it exposed. Scan the live site, or
            paste the code behind your mobile app or bot: you get a score, a plain-language explanation, and the exact
            fix — rewritten for you.
          </p>

          <ModeChooser />

          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            <li>No account needed</li>
            <li>Ownership confirmed first</li>
            <li>Auto-fix for every issue</li>
          </ul>
        </div>

        <SampleReportCard />
      </div>
    </section>
  );
}