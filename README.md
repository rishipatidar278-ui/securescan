# SecureScan 🔐

**Automated security scanner for AI-built websites and apps. Scan, score, and fix vulnerabilities.**

Anyone can build a website, bot, or app with AI today — but almost nobody security-checks it before going live. SecureScan scans a website, finds the weaknesses, gives it a security score, and hands back ready-to-use fixes. It's the security layer for the AI-builder era.

## Two Scan Modes

**1. Website Scan (URL)** — enter a URL, confirm ownership, and SecureScan inspects it live over HTTPS.

**2. Code Scan (paste or upload)** — no public URL? Paste or upload source files (`.js`, `.ts`, `.jsx`, `.py`, `.java`, `.kt`, `.php`, `.env`, `.json`, `.yml`) and SecureScan reviews the code itself: mobile apps, bots, backends, scripts.

## What Gets Checked

### Website checks

| Check | Severity | Why It Matters |
|---|---|---|
| SSL/HTTPS validity | High | Encrypted connection is the baseline of web security |
| Exposed sensitive paths (`/admin`, `/.env`, `/.git/config`, backups) | High | These should never be publicly reachable |
| Directory listing | High | Exposes your entire file structure to attackers |
| Missing `Strict-Transport-Security` (HSTS) | Medium | Browsers may fall back to plain HTTP |
| Missing `Content-Security-Policy` | Medium | Your strongest defense against cross-site scripting |
| Insecure forms (HTTP action, missing CSRF protection) | Medium | Data can be intercepted or forged |
| Missing `X-Frame-Options` | Low | Stops clickjacking via iframe embedding |
| Missing `X-Content-Type-Options` | Low | Prevents browsers misinterpreting file types |
| Missing `Referrer-Policy` | Low | Controls how much visitor data leaks to other sites |

### Code checks

| Check | Severity | Why It Matters |
|---|---|---|
| Hardcoded secrets (AWS, Google, Stripe, Slack, OpenAI-style keys, generic credentials) | High | Leaked keys mean someone else controls your account |
| SQL injection (string-built queries) | High | Full database read/write by an attacker |
| `eval()` / `exec()` / `os.system` on dynamic input | High | Remote code execution |
| Weak password hashing (MD5 / SHA-1) | High | Password databases get cracked in hours |
| Insecure auth (plain-text comparison, disabled checks) | High | Anyone can log in as anyone |
| Credentials in `.env`-style files | High | Secrets ship straight to the client |
| Outdated / vulnerable dependencies | Medium | Known CVEs apply to your stack |

## Scoring

Score starts at 100. Deductions: **-15 per high-severity finding, -7 per medium, -3 per low** (floor 0).

| Grade | Score |
|---|---|
| A | 90–100 |
| B | 80–89 |
| C | 70–79 |
| D | 60–69 |
| F | Below 60 |

## You Don't Just Get a Report — You Get the Fix

**Code fixes.** Every code finding shows your vulnerable line beside the corrected snippet, side by side: "Your code" (vulnerable) vs "Fixed code" (secure). Copy it, or download all fixes as one file.

**Fix Kit.** Every missing security header is turned into a ready-to-paste config file for the client's platform — four tabs, one per host:

- **Vercel** → `vercel.json`
- **Netlify** → `_headers`
- **Nginx** → `nginx.conf` snippet
- **Apache** → `.htaccess`

Copy, paste, redeploy, rescan. Plus guides for blocking exposed paths and a rescan CTA that re-tests after fixes.

## Features

- Two scan modes: website URL and source code
- Server-side scanning engine (`runSecurityScan`, `runCodeScan` backend functions)
- Security score with A–F grading, findings grouped by severity, plain-language evidence
- Side-by-side code fixes for every code finding
- Fix Kit config generator for Vercel / Netlify / Nginx / Apache
- Professional PDF report export
- Email report delivery
- Scan history with score trends
- Ownership verification gate before every scan

## Tech Stack

- **Base44** backend: entities (`Client`, `ScanReport`, `CodeScanReport`, `User`), backend functions (Deno/TypeScript), auth
- **React + Vite** frontend, Tailwind CSS, shadcn/ui components
- Automated scanning via server-side HTTPS inspection and static code analysis

## Project Structure

```
base44/
  entities/          # Client, ScanReport, CodeScanReport, User schemas
  functions/
    runSecurityScan/ # website scanning engine
    runCodeScan/     # source code scanning engine
    emailReport/     # report delivery
    get*Report*/     # report fetch endpoints
src/
  pages/             # landing, scan, code scan, reports, history
  components/
    landing/         # hero, mode chooser, how-it-works, FAQ
    scan/            # URL scan form + progress
    code/            # code scan form, diff view, fix download
    report/          # report dashboard, finding cards, Fix Kit
    ui/              # shadcn/ui primitives
```

## Run It Locally

This app is built on [Base44](https://base44.com). If you export/clone the code into a Base44 app of your own:

```bash
npm install
npm install -g base44@latest   # Base44 CLI (needs Deno for the local backend)
base44 login                   # one-time per machine
base44 link                    # one-time per clone — writes base44/.app.jsonc
base44 dev                     # local backend + frontend together
```

`base44 dev` prints the frontend URL (typically `http://localhost:5173`). Locally, entity data is in-memory and resets on restart.

## Legal & Ethics

SecureScan only scans websites and code with the confirmed consent of their owner or an authorized party. Unauthorized scanning of third-party systems is illegal (India: IT Act 2000; similar laws apply worldwide). Always get permission first. 🔒

## Roadmap

- GitHub integration — connect a repo, get automated pull requests with fixes
- Scheduled recurring scans with score-drop alerts
- Multi-site dashboard for agencies
- More language coverage in the code engine (Go, Ruby, C#)

## Author

Built by [Rishi Patidar](https://github.com/rishipatidar278-ui)

---
*If you built it with AI, make sure it's secure.*
