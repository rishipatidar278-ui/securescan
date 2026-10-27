import { BookOpen, Gauge, MessagesSquare } from "lucide-react";

const PARTS = [
  {
    icon: Gauge,
    title: "A score you can act on",
    body: "Every check is weighted, so the number at the top of your report reflects the risks that actually matter — not how many boxes were ticked.",
  },
  {
    icon: MessagesSquare,
    title: "Findings in plain language",
    body: "Each check is marked pass, warn or fail, with what we found and why it matters, written for a business owner rather than a security engineer.",
  },
  {
    icon: BookOpen,
    title: "A fix guide for every issue",
    body: "Warnings and failures come with the exact steps to put them right, and the settings or headers involved, so nobody has to guess.",
  },
];

export default function ReportSection() {
  return (
    <section className="border-b border-border/70 py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal">Your report</p>
        <h2 className="mt-4 max-w-2xl font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          A result you can hand to anyone.
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PARTS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border/80 bg-card/60 p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-signal/10 ring-1 ring-signal/20">
                <Icon className="h-5 w-5 text-signal" />
              </span>
              <h3 className="mt-5 font-heading text-lg font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          Reports are saved each time you scan. To find one again, open{" "}
          <span className="text-foreground">Reports</span> and enter the email address you used.
        </p>
      </div>
    </section>
  );
}