const STEPS = [
  {
    number: "01",
    title: "Enter URL",
    body: "Paste the address of your site or app. Nothing to install, no account to create, no access to your server needed.",
  },
  {
    number: "02",
    title: "Verify ownership",
    body: "Confirm you own the site or are authorised to test it. We only ever scan the address you name.",
  },
  {
    number: "03",
    title: "Get score + fixes",
    body: "A score out of 100, every issue explained in plain language, and fix steps you can hand straight to your developer.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how" className="border-b border-border/70 py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal">How it works</p>
        <h2 className="mt-4 max-w-2xl font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          From address to actionable report in three steps.
        </h2>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border/80 bg-border/60 md:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number} className="bg-card/70 p-7">
              <span className="font-mono text-sm text-signal">{step.number}</span>
              <h3 className="mt-4 font-heading text-xl font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}