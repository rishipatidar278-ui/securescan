import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQS = [
  {
    q: "Is scanning legal?",
    a: "Yes — but only with the owner's permission. That is exactly why SecureScan verifies ownership first: you confirm you own the site or are authorised to test it before any scan runs.",
  },
  {
    q: "What gets checked?",
    a: "HTTPS and certificate setup, security headers (HSTS, Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy), exposed admin pages and sensitive files (.env, .git, backups), open directory listings, unprotected forms, and API keys leaked into public pages.",
  },
  {
    q: "How long does a scan take?",
    a: "Under a minute. Most scans finish in a few seconds, and you can watch each check complete live while it runs.",
  },
];

export default function FaqSection() {
  return (
    <section id="faq" className="border-b border-border/70 py-20 lg:py-24">
      <div className="mx-auto max-w-3xl px-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal">FAQ</p>
        <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Questions, answered.
        </h2>

        <Accordion type="single" collapsible className="mt-10">
          {FAQS.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger className="text-left font-heading text-base font-semibold">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}