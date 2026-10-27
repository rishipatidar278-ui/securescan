import { useState } from "react";
import { Check, ChevronDown, Copy, Download, Loader2, RefreshCw, ShieldBan, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const HEADER_SNIPPETS = {
  "header-strict-transport-security": ["Strict-Transport-Security", "max-age=31536000; includeSubDomains"],
  "header-content-security-policy": ["Content-Security-Policy", "default-src 'self'"],
  "header-x-frame-options": ["X-Frame-Options", "SAMEORIGIN"],
  "header-x-content-type-options": ["X-Content-Type-Options", "nosniff"],
  "header-referrer-policy": ["Referrer-Policy", "strict-origin-when-cross-origin"],
};

const EXPOSED_PATHS = {
  "exposed-admin": "/admin",
  "exposed--env": "/.env",
  "exposed--git-config": "/.git/config",
  "exposed-phpinfo-php": "/phpinfo.php",
  "exposed-backup-sql": "/backup.sql",
};

const CODE_BLOCK =
  "overflow-x-auto rounded-xl border border-border/70 bg-background/80 p-4 font-mono text-[12px] leading-relaxed text-foreground/90";

function downloadFile(filename, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function FixKit({ report, onRescan, rescanning }) {
  const [copied, setCopied] = useState("");
  const findings = Array.isArray(report?.findings) ? report.findings : [];
  const headerFindings = findings.filter((finding) => HEADER_SNIPPETS[finding.id]);
  const pathFindings = findings.filter(
    (finding) => (finding.id || "").startsWith("exposed-") || (finding.id || "").startsWith("dirlist-")
  );

  const pairs = headerFindings.length
    ? headerFindings.map((finding) => HEADER_SNIPPETS[finding.id])
    : Object.values(HEADER_SNIPPETS);
  const vercelJson = JSON.stringify(
    { headers: [{ source: "/(.*)", headers: pairs.map(([key, value]) => ({ key, value })) }] },
    null,
    2
  );
  const netlify = `/*\n${pairs.map(([key, value]) => `  ${key}: ${value}`).join("\n")}\n`;
  const nginx = `# Serve these security headers on every response — add inside your server { } block\n${pairs
    .map(([key, value]) => `add_header ${key} "${value}" always;`)
    .join("\n")}`;
  const htaccess = `<IfModule mod_headers.c>\n${pairs
    .map(([key, value]) => `  Header always set ${key} "${value}"`)
    .join("\n")}\n</IfModule>`;

  const PLATFORMS = [
    {
      id: "vercel",
      label: "Vercel",
      filename: "vercel.json",
      content: vercelJson,
      hint: "Save as vercel.json at the project root — the next deploy sends every header.",
    },
    {
      id: "netlify",
      label: "Netlify",
      filename: "_headers",
      content: netlify,
      hint: "Save as _headers in the publish directory root.",
    },
    {
      id: "nginx",
      label: "Nginx",
      filename: "nginx-securescan.conf",
      content: nginx,
      hint: "Include this file from your server { } block (or paste the lines in), then reload nginx.",
    },
    {
      id: "apache",
      label: "Apache / .htaccess",
      filename: ".htaccess",
      content: htaccess,
      hint: "Paste into the .htaccess at your web root (requires mod_headers).",
    },
  ];

  const copy = async (key, content) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      const area = document.createElement("textarea");
      area.value = content;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
    }
    setCopied(key);
    setTimeout(() => setCopied((current) => (current === key ? "" : current)), 2000);
  };

  const blockedPaths = [];
  pathFindings.forEach((finding) => {
    if (EXPOSED_PATHS[finding.id]) blockedPaths.push(EXPOSED_PATHS[finding.id]);
    const fromTitle = (finding.title || "").match(/at (\S+)$/);
    if (fromTitle) blockedPaths.push(fromTitle[1]);
  });
  const uniquePaths = [...new Set(blockedPaths)];
  const pattern = uniquePaths
    .map((path) => path.replace(/^\//, "").replace(/([.+?^${}()|[\]\\])/g, "\\$&"))
    .join("|");
  const nginxBlock = `# Block sensitive paths — add inside your server { } block, then reload nginx\nlocation ~* ^/(${pattern}) {\n    return 404;\n}`;
  const apacheBlock = `# Block sensitive paths — add to the .htaccess at your web root\n<IfModule mod_rewrite.c>\n  RewriteEngine On\n  RewriteRule ^(${pattern})(/|$) - [R=404,L]\n</IfModule>`;

  return (
    <section id="fix-kit" className="rounded-3xl border border-border/80 bg-panel/80 p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-signal/12 ring-1 ring-signal/30">
          <Wrench className="h-4 w-4 text-signal" />
        </span>
        <div>
          <h2 className="font-heading text-xl font-semibold tracking-tight">Fix Kit</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {headerFindings.length
              ? "Ready-made config that fixes every missing header at once — pick your platform, then copy or download the file."
              : "No missing headers were detected on this scan — deploy this baseline config to keep the full set in place on every response."}
          </p>
        </div>
      </div>

      <Tabs defaultValue="vercel" className="mt-7">
          <TabsList className="h-auto flex-wrap">
            {PLATFORMS.map((platform) => (
              <TabsTrigger key={platform.id} value={platform.id} className="rounded-lg">
                {platform.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {PLATFORMS.map((platform) => (
            <TabsContent key={platform.id} value={platform.id} className="mt-4">
              <p className="text-xs text-muted-foreground">{platform.hint}</p>
              <pre className={`${CODE_BLOCK} mt-3`}>{platform.content}</pre>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => copy(platform.id, platform.content)}
                >
                  {copied === platform.id ? (
                    <Check className="mr-2 h-4 w-4 text-signal" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  {copied === platform.id ? "Copied" : "Copy"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() =>
                    downloadFile(platform.filename, platform.content, platform.id === "vercel" ? "application/json" : "text/plain")
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download {platform.filename}
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>

      {uniquePaths.length > 0 && (
        <Collapsible className="mt-8 rounded-2xl border border-border/70 bg-card/60">
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
            <span className="flex items-center gap-2.5 font-heading text-base font-semibold">
              <ShieldBan className="h-4 w-4 text-warn" />
              How to block these paths ({uniquePaths.join(", ")})
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-5 pb-5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              First, delete the exposed files from the web root and from whatever pipeline deploys them — a server
              block is a safety net, not the fix. If .env or a backup was readable, rotate every credential inside it;
              treat them as compromised.
            </p>
            <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Nginx — return 404
            </p>
            <pre className={`${CODE_BLOCK} mt-2`}>{nginxBlock}</pre>
            <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Apache — RewriteRule 404
            </p>
            <pre className={`${CODE_BLOCK} mt-2`}>{apacheBlock}</pre>
          </CollapsibleContent>
        </Collapsible>
      )}

      <div className="mt-8 flex flex-col items-start gap-3 rounded-2xl border border-signal/25 bg-signal/5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-heading text-base font-semibold">Fix, deploy, verify.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Apply the config above, ship it, then run a fresh scan to watch your score climb.
          </p>
        </div>
        <Button onClick={onRescan} disabled={rescanning} className="shrink-0 rounded-xl">
          {rescanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          After fixing, rescan
        </Button>
      </div>
    </section>
  );
}