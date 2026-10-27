import { useState } from "react";
import { Check, Copy } from "lucide-react";

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const area = document.createElement("textarea");
    area.value = value;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    document.body.removeChild(area);
  }
}

export default function CodeDiff({ fix }) {
  const [copied, setCopied] = useState("");

  if (!fix) return null;

  const copy = async (key, value) => {
    await copyText(value);
    setCopied(key);
    setTimeout(() => setCopied((current) => (current === key ? "" : current)), 2000);
  };

  return (
    <div className="mt-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-danger/30 bg-danger/5">
          <div className="flex items-center justify-between gap-2 border-b border-danger/20 px-3 py-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-danger">Your code</p>
          </div>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words p-3 font-mono text-[12px] leading-relaxed text-foreground/90">
            {fix.before}
          </pre>
        </div>

        <div className="rounded-xl border border-signal/30 bg-signal/5">
          <div className="flex items-center justify-between gap-2 border-b border-signal/20 px-3 py-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-signal">Fixed code</p>
            <button
              type="button"
              onClick={() => copy("after", fix.after)}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-signal transition-colors hover:bg-signal/10"
            >
              {copied === "after" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied === "after" ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words p-3 font-mono text-[12px] leading-relaxed text-foreground/90">
            {fix.after}
          </pre>
        </div>
      </div>

      {fix.note && <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{fix.note}</p>}
    </div>
  );
}