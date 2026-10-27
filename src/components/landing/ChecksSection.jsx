import { FileWarning, FolderOpen, KeyRound, Lock, LogIn, ShieldCheck } from "lucide-react";

const CHECKS = [
  {
    icon: Lock,
    title: "SSL & HTTPS validity",
    body: "We confirm the certificate is valid and current, and that every visitor is really served over an encrypted connection — not quietly downgraded to plain HTTP.",
  },
  {
    icon: ShieldCheck,
    title: "Missing security headers",
    body: "Headers such as HSTS, Content-Security-Policy and X-Frame-Options tell the browser how to protect your visitors. We list the ones your site is missing.",
  },
  {
    icon: LogIn,
    title: "Exposed admin & login pages",
    body: "We knock on the usual doors — /admin, /wp-admin, /phpmyadmin — and tell you when a management page answers to anyone who finds it.",
  },
  {
    icon: KeyRound,
    title: "Leaked API keys",
    body: "We read your public pages the way a bot would, and flag API keys, tokens and secrets left out in the open where anyone can copy them.",
  },
  {
    icon: FileWarning,
    title: "Forms without CSRF protection",
    body: "A form that submits data without a protection token, or over an insecure connection, can be abused by another website on your visitors' behalf.",
  },
  {
    icon: FolderOpen,
    title: "Directory listing",
    body: "When a folder such as /uploads or /backup is browsable, visitors — and attackers — can see files that were never meant to be public.",
  },
];

export default function ChecksSection() {
  return (
    <section id="checks" className="border-b border-border/70 py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal">What we check</p>
        <h2 className="mt-4 max-w-2xl font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Six checks that catch the mistakes attackers look for first.
        </h2>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CHECKS.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-2xl border border-border/80 bg-card/60 p-6 transition-colors hover:border-signal/40"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-signal/10 ring-1 ring-signal/20">
                <Icon className="h-5 w-5 text-signal" />
              </span>
              <h3 className="mt-5 font-heading text-lg font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}