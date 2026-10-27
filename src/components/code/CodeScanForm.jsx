import { useRef, useState } from "react";
import { Loader2, ScanSearch, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const FIELD_LABEL = "font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground";
const ALLOWED = ["js", "ts", "jsx", "tsx", "py", "java", "kt", "php", "env", "json", "yml"];
const ACCEPT = ALLOWED.map((extension) => `.${extension}`).join(",");
const MAX_FILES = 25;
const MAX_FILE_BYTES = 200000;

const PLACEHOLDER = `// Paste any code — JavaScript, Python, Java, Kotlin, PHP…
const API_KEY = "sk_live_51H8x…";           // hardcoded key
const q = "SELECT * FROM users WHERE id = " + req.query.id;   // SQL injection

function isAuthenticated(user) {
  // TODO: real check
  return true;
}

const hash = md5(password);`;

export default function CodeScanForm({ busy = false, onSubmit }) {
  const [code, setCode] = useState("");
  const [files, setFiles] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [skipped, setSkipped] = useState([]);
  const fileInput = useRef(null);

  const addFiles = async (event) => {
    const picked = Array.from(event.target.files || []);
    event.target.value = "";

    const rejected = [];
    const accepted = [];

    for (const file of picked) {
      const extension = (file.name.split(".").pop() || "").toLowerCase();
      if (!ALLOWED.includes(extension)) {
        rejected.push(`${file.name} (unsupported type)`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        rejected.push(`${file.name} (over 200 KB)`);
        continue;
      }
      accepted.push({ name: file.name, content: await file.text() });
    }

    setFiles((current) => [...current, ...accepted].slice(0, MAX_FILES));
    setSkipped(rejected);
  };

  const removeFile = (fileName) => {
    setFiles((current) => current.filter((file) => file.name !== fileName));
  };

  const submit = (event) => {
    event.preventDefault();
    if (busy) return;

    if (!code.trim() && files.length === 0) {
      setError("Paste your code or upload at least one file to scan.");
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
      setError("Please confirm this is your own code or that you are authorised to scan it.");
      return;
    }

    setError("");
    onSubmit({ code, files, name: name.trim(), email: email.trim(), confirmed: true });
  };

  return (
    <form onSubmit={submit} className="rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-8">
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <Label htmlFor="code-input" className={FIELD_LABEL}>
              Paste your code
            </Label>
            <span className="font-mono text-[11px] text-muted-foreground">
              {code.length.toLocaleString()} chars
            </span>
          </div>
          <Textarea
            id="code-input"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            rows={14}
            spellCheck={false}
            placeholder={PLACEHOLDER}
            className="min-h-[260px] rounded-xl bg-background/60 font-mono text-[12.5px] leading-relaxed"
          />
        </div>

        <div className="rounded-2xl border border-dashed border-border/80 bg-background/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-foreground/90">
              <Upload className="h-4 w-4 text-signal" />
              Or upload files (up to {MAX_FILES}, text only)
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => fileInput.current?.click()}
            >
              Choose files
            </Button>
          </div>
          <input
            ref={fileInput}
            type="file"
            multiple
            accept={ACCEPT}
            onChange={addFiles}
            className="hidden"
          />
          <p className="mt-2 break-words font-mono text-[11px] text-muted-foreground">{ACCEPT}</p>

          {files.length > 0 && (
            <ul className="mt-3 space-y-2">
              {files.map((file) => (
                <li
                  key={file.name}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/60 px-3 py-2"
                >
                  <span className="truncate font-mono text-[12px] text-foreground/90">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(file.name)}
                    aria-label={`Remove ${file.name}`}
                    className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:text-danger"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {skipped.length > 0 && (
            <p className="mt-3 text-xs leading-relaxed text-warn">Skipped: {skipped.join(", ")}</p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="code-name" className={FIELD_LABEL}>
              Your name
            </Label>
            <Input
              id="code-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Alex Morgan"
              className="h-12 rounded-xl bg-background/60 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code-email" className={FIELD_LABEL}>
              Email address
            </Label>
            <Input
              id="code-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="alex@company.com"
              className="h-12 rounded-xl bg-background/60 text-sm"
            />
          </div>
        </div>

        <label
          htmlFor="code-confirm"
          className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/70 bg-background/40 p-4"
        >
          <Checkbox
            id="code-confirm"
            checked={confirmed}
            onCheckedChange={(value) => setConfirmed(value === true)}
            className="mt-0.5"
          />
          <span className="text-sm leading-relaxed text-foreground/90">
            I confirm this is my own code or I am authorized to scan it.
            <span className="mt-1 block text-xs text-muted-foreground">
              Your code is analysed to build the report and is never shared or executed.
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
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analysing…
          </>
        ) : (
          <>
            <ScanSearch className="mr-2 h-4 w-4" /> Scan my code
          </>
        )}
      </Button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Secrets · SQL injection · auth · dangerous functions · crypto · dependencies
      </p>
    </form>
  );
}