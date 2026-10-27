import { useState } from "react";
import { Loader2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FIELD_LABEL = "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground";

export default function ScanForm({ initialUrl = "", busy = false, onSubmit }) {
  const [url, setUrl] = useState(initialUrl);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    if (busy) return;

    if (!url.trim()) {
      setError("Enter the website address you want scanned.");
      return;
    }
    if (!name.trim()) {
      setError("Enter your name so we know who requested the scan.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError("Enter a valid email address — you will use it to find this report later.");
      return;
    }
    if (!confirmed) {
      setError("Please confirm you own or are authorised to scan this website.");
      return;
    }

    setError("");
    onSubmit({ url: url.trim(), name: name.trim(), email: email.trim(), confirmed: true });
  };

  return (
    <form onSubmit={submit} className="rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-8">
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="scan-url" className={FIELD_LABEL}>
            Website address
          </Label>
          <Input
            id="scan-url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="yourwebsite.com"
            className="h-12 rounded-xl bg-background/60 font-mono text-sm"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="scan-name" className={FIELD_LABEL}>
              Your name
            </Label>
            <Input
              id="scan-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Alex Morgan"
              className="h-12 rounded-xl bg-background/60 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scan-email" className={FIELD_LABEL}>
              Email address
            </Label>
            <Input
              id="scan-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="alex@company.com"
              className="h-12 rounded-xl bg-background/60 text-sm"
            />
          </div>
        </div>

        <label
          htmlFor="scan-confirm"
          className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/70 bg-background/40 p-4"
        >
          <Checkbox
            id="scan-confirm"
            checked={confirmed}
            onCheckedChange={(value) => setConfirmed(value === true)}
            className="mt-0.5"
          />
          <span className="text-sm leading-relaxed text-foreground/90">
            I confirm that I own this website, or that I have the owner&apos;s permission to have it scanned.
            <span className="mt-1 block text-xs text-muted-foreground">
              SecureScan only requests the pages listed in the report. It never changes anything on your site.
            </span>
          </span>
        </label>
      </div>

      {error && (
        <p className="mt-5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      <Button type="submit" size="lg" disabled={busy} className="mt-6 h-12 w-full rounded-xl">
        {busy ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scanning…
          </>
        ) : (
          <>
            <ScanLine className="mr-2 h-4 w-4" /> Start the scan
          </>
        )}
      </Button>
      <p className="mt-3 text-center text-xs text-muted-foreground">Six checks · usually under a minute</p>
    </form>
  );
}