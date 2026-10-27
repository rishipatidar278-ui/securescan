import { Link } from "react-router-dom";
import { ArrowRight, Check, Code2, Globe } from "lucide-react";

const MODES = [
  {
    to: "/scan",
    icon: Globe,
    eyebrow: "Mode 1",
    title: "Scan a Website (URL)",
    description:
      "Your project is live at a web address. We check the running site — HTTPS, security headers, exposed files and leaked keys.",
    points: ["Six automated checks", "Results in under a minute", "Fix Kit config for your host"],
  },
  {
    to: "/scan-code",
    icon: Code2,
    eyebrow: "Mode 2",
    title: "Scan your Code (paste/upload)",
    description:
      "A mobile app, bot, backend or anything without a public URL. We read the code and rewrite the unsafe parts for you.",
    points: ["Paste or upload your files", "Secrets, SQL injection, auth, crypto", "Auto-fix: your code vs fixed code"],
  },
];

export default function ModeChooser() {
  return (
    <div className="mt-9 grid gap-4 sm:grid-cols-2">
      {MODES.map((mode) => {
        const Icon = mode.icon;
        return (
          <Link
            key={mode.to}
            to={mode.to}
            className="group flex flex-col rounded-2xl border border-border/80 bg-card/60 p-5 transition-colors hover:border-signal/50 hover:bg-card"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-signal/12 ring-1 ring-signal/30">
                <Icon className="h-4 w-4 text-signal" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {mode.eyebrow}
              </span>
            </div>

            <h2 className="mt-4 font-heading text-base font-semibold tracking-tight">{mode.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{mode.description}</p>

            <ul className="mt-4 flex-1 space-y-1.5">
              {mode.points.map((point) => (
                <li key={point} className="flex items-start gap-2 text-xs text-foreground/80">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal" />
                  {point}
                </li>
              ))}
            </ul>

            <span className="mt-5 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-signal">
              Start
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        );
      })}
    </div>
  );
}