import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const USER_AGENT = 'Mozilla/5.0 (compatible; SecureScan/1.0)';
const TIMEOUT_MS = 9000;
const MAX_HTML = 900000;

const PENALTY = { high: 15, medium: 7, low: 3 };

const EXPECTED_SCHEMA = {
  url: 'string — the website address to scan, e.g. "example.com"',
  name: 'string — your full name',
  email: 'string — a valid email address',
  ownership_confirmed: 'boolean — must be true (aliases accepted: ownershipConfirmed, authorized, confirmed)',
};

const HEADER_CHECKS = [
  {
    header: 'strict-transport-security',
    label: 'Strict-Transport-Security (HSTS)',
    severity: 'medium',
    why: 'tells browsers to refuse plain HTTP for your domain',
    fix: 'Send Strict-Transport-Security: max-age=31536000; includeSubDomains on every HTTPS response.',
  },
  {
    header: 'content-security-policy',
    label: 'Content-Security-Policy',
    severity: 'medium',
    why: 'limits which scripts a page may run, blunting cross-site-scripting attacks',
    fix: "Send a Content-Security-Policy: start with default-src 'self' and allow only the sources your site genuinely needs.",
  },
  {
    header: 'x-frame-options',
    label: 'X-Frame-Options',
    severity: 'low',
    why: 'stops other sites embedding your pages to trick visitors',
    fix: "Send X-Frame-Options: SAMEORIGIN (or frame-ancestors 'self' inside your Content-Security-Policy).",
  },
  {
    header: 'x-content-type-options',
    label: 'X-Content-Type-Options',
    severity: 'low',
    why: 'stops browsers guessing a file type and running an upload as a script',
    fix: 'Send X-Content-Type-Options: nosniff on every response.',
  },
  {
    header: 'referrer-policy',
    label: 'Referrer-Policy',
    severity: 'low',
    why: "controls how much of your visitors' addresses leaks to other sites",
    fix: 'Send Referrer-Policy: strict-origin-when-cross-origin.',
  },
];

const SENSITIVE_PATHS = [
  {
    path: '/admin',
    title: 'Admin panel publicly reachable',
    match: /passwo?rd|log ?in|sign ?in|control panel|dashboard|username|wp-admin/i,
    fix: [
      'Lock the panel behind authentication before it is served — an IP allow-list, VPN or HTTP basic auth is strongest.',
      'Turn on two-factor authentication and rate-limit failed sign-ins.',
      'Move the panel off its default address so automated scanners do not find it first.',
    ],
  },
  {
    path: '/.env',
    title: 'Environment file (.env) publicly readable',
    match: /^\s*[A-Za-z_][A-Za-z0-9_]{2,}\s*=\s*\S+/m,
    fix: [
      'Delete the .env file from the public folder immediately — it should never be web-accessible.',
      'Rotate every secret inside it: treat all of those values as compromised.',
      'Keep the file outside the web root and deny dotfiles at the server: "location ~ /\\. { deny all; }" on nginx, or an equivalent block on Apache.',
    ],
  },
  {
    path: '/.git/config',
    title: 'Git repository (.git) publicly readable',
    match: /\[core\]|\[branch[^\]]*\]|\[remote[^\]]*\]/i,
    fix: [
      'Delete the .git folder from the web root entirely — deploy builds without version-control metadata.',
      'As a safety net, deny dotfiles at the server: "location ~ /\\. { deny all; }" on nginx, or an equivalent block on Apache.',
      'Review the repository history for secrets — anything ever committed is now exposed.',
    ],
  },
  {
    path: '/phpinfo.php',
    title: 'PHP info page (phpinfo.php) publicly reachable',
    match: /phpinfo\(\)|PHP Version\s+\d/i,
    fix: [
      'Delete phpinfo.php from the server — it is a diagnostic file and should never stay in production.',
      'If you need it temporarily, protect it with authentication and remove it as soon as you are done.',
    ],
  },
  {
    path: '/backup.sql',
    title: 'Database backup (backup.sql) publicly downloadable',
    match: /CREATE TABLE|INSERT INTO|-- (?:MySQL|Host|Table structure)|SET SQL_MODE/i,
    fix: [
      'Delete backup.sql from the public folder immediately and rotate the credentials it may contain.',
      'Never keep backups inside the web root — store them in private cloud storage or off the server.',
      'Deny access to *.sql files at the server level as a safety net.',
    ],
  },
];

const LISTING_PATHS = ['/uploads/', '/backup/', '/files/', '/assets/'];

const KEY_PATTERNS = [
  { label: 'Google API key', regex: /\bAIza[0-9A-Za-z\-_]{35}\b/ },
  { label: 'Stripe secret key', regex: /\bsk_(?:live|test)_[0-9A-Za-z]{16,}\b/ },
  { label: 'AWS access key', regex: /\bAKIA[0-9A-Z]{16}\b/ },
  { label: 'GitHub token', regex: /\bgh[pousr]_[0-9A-Za-z]{36,}\b/ },
  { label: 'Slack token', regex: /\bxox[abprs]-[0-9A-Za-z-]{10,}\b/ },
  { label: 'Private key block', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { label: 'JSON web token', regex: /\beyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\b/ },
];

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

function normalizeSiteUrl(input) {
  const raw = String(input || '').trim();
  if (!raw) throw new Error('Enter the website address you want scanned.');
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let parsed;
  try {
    parsed = new URL(withScheme);
  } catch {
    throw new Error('That does not look like a valid website address.');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Only http and https addresses can be scanned.');
  }
  if (isBlockedHost(parsed.hostname.toLowerCase())) {
    throw new Error('That address is not reachable on the public internet, so it cannot be scanned.');
  }
  parsed.hash = '';
  return parsed;
}

function isBlockedHost(host) {
  if (!host) return true;
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) return true;
  if (host === '0.0.0.0' || host === '::' || host === '::1' || host === '[::1]') return true;
  if (host.includes(':')) return true;
  if (!host.includes('.')) return true;
  const parts = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (parts) {
    const a = Number(parts[1]);
    const b = Number(parts[2]);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
  }
  return false;
}

function redact(value) {
  if (value.length <= 10) return `${value.slice(0, 3)}••••`;
  return `${value.slice(0, 6)}••••••${value.slice(-2)}`;
}

function snippet(body) {
  return body.replace(/\s+/g, ' ').trim().slice(0, 100);
}

async function loadHomepage(target) {
  try {
    const response = await fetch(target.toString(), {
      redirect: 'follow',
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });
    const declaredSize = Number(headers['content-length'] || 0);
    let html = '';
    if (!declaredSize || declaredSize <= MAX_HTML * 3) {
      html = (await response.text()).slice(0, MAX_HTML);
    }
    return { status: response.status, headers, html, finalUrl: response.url || target.toString(), error: '' };
  } catch (error) {
    return { status: 0, headers: null, html: '', finalUrl: target.toString(), error: error?.message || 'The site did not respond.' };
  }
}

async function probe(url) {
  const response = await fetch(url, {
    redirect: 'manual',
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  let body = '';
  if (response.status === 200) body = (await response.text()).slice(0, 60000);
  return { status: response.status, body };
}

async function probePaths(origin, paths) {
  const results = [];
  for (let index = 0; index < paths.length; index += 6) {
    const chunk = paths.slice(index, index + 6);
    const settled = await Promise.allSettled(chunk.map((path) => probe(origin + path)));
    settled.forEach((entry, offset) => {
      const value = entry.status === 'fulfilled' ? entry.value : { status: 0, body: '' };
      results.push({ path: chunk[offset], status: value.status, body: value.body });
    });
  }
  return results;
}

function insecureSubresources(html) {
  const matches = html.match(/(?:src|action)\s*=\s*["']http:\/\/[^"']+["']/gi);
  return matches ? matches.length : 0;
}

async function checkHttps(target, page, findings) {
  const secureUrl = new URL(target.toString());
  secureUrl.protocol = 'https:';

  let httpsWorks = false;
  let secureProblem = '';

  if (target.protocol === 'https:') {
    if (!page.error && page.status > 0) httpsWorks = true;
    else secureProblem = page.error || 'no response';
  } else {
    try {
      const response = await fetch(secureUrl.toString(), {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (response.status > 0) httpsWorks = true;
    } catch (error) {
      secureProblem = error?.message || 'the secure version did not respond';
    }
  }

  if (!httpsWorks) {
    findings.push({
      id: 'https-unreachable',
      title: 'Site is not reachable over HTTPS',
      severity: 'high',
      evidence: [
        `A secure request to https://${secureUrl.host} failed: ${secureProblem}. Visitors see a certificate warning or the page refuses to load.`,
      ],
      fix: [
        "Install a TLS certificate for the domain — most hosts and CDNs issue one free (Let's Encrypt, Cloudflare or the host panel).",
        'Serve every page over https:// and add a permanent redirect from http:// to https://.',
        'Turn on automatic certificate renewal so it never lapses.',
      ],
    });
    return;
  }

  const finalUrl = page.finalUrl || target.toString();
  if (finalUrl.startsWith('http://')) {
    findings.push({
      id: 'no-https-redirect',
      title: 'No redirect from HTTP to HTTPS',
      severity: 'medium',
      evidence: [
        `The page was still served over plain HTTP at ${finalUrl}, even though a secure version of the site exists. Anyone loading the http:// address gets no protection.`,
      ],
      fix: [
        'Add a permanent (301) redirect from http:// to https:// for every page.',
        'Update internal links, sitemaps and canonical tags to https://.',
      ],
    });
  }

  const insecureAssets = insecureSubresources(page.html || '');
  if (!finalUrl.startsWith('http://') && insecureAssets > 0) {
    findings.push({
      id: 'mixed-content',
      title: 'Mixed content on a secure page',
      severity: 'medium',
      evidence: [
        `${insecureAssets} script, image or form target ${insecureAssets === 1 ? 'is' : 'are'} loaded over plain http:// inside the secure page. Browsers mark the padlock as broken.`,
      ],
      fix: [
        'Change every http:// reference in scripts, stylesheets, images and form actions to https://.',
        'Search your templates and content for "http://" and update what you find.',
        'Add upgrade-insecure-requests to your Content-Security-Policy as a safety net.',
      ],
    });
  }
}

async function checkHeaders(page, findings) {
  if (!page.headers) return;

  HEADER_CHECKS.forEach((entry) => {
    if (!page.headers[entry.header]) {
      findings.push({
        id: `header-${entry.header}`,
        title: `Missing ${entry.label} header`,
        severity: entry.severity,
        evidence: [`The homepage response did not include ${entry.label}, which ${entry.why}.`],
        fix: [
          entry.fix,
          'Set the header where responses leave your site: a snippet in your web server config, a hosting panel rule, or a CDN setting.',
        ],
      });
    }
  });
}

async function checkForms(target, page, findings) {
  if (!page.html) return;

  const forms = [...page.html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)];
  if (!forms.length) return;

  const pageToken = /<meta[^>]+name\s*=\s*["']csrf-token["']/i.test(page.html);
  const finalUrl = page.finalUrl || target.toString();
  const securePage = finalUrl.startsWith('https://');
  const insecurePasswords = [];
  const insecureActions = [];
  const unprotected = [];

  forms.forEach(([, attrs, body]) => {
    const method = /method\s*=\s*["']?post/i.test(attrs) ? 'post' : 'get';
    const actionMatch = attrs.match(/action\s*=\s*["']([^"']*)["']/i);
    const action = actionMatch ? actionMatch[1] : '';
    const hasToken = pageToken || /name\s*=\s*["'][^"']*(?:csrf|xsrf|token|authenticity|nonce)[^"']*["']/i.test(body);
    const hasPassword = /<input[^>]+type\s*=\s*["']?password/i.test(body);

    if (method === 'post' && /^http:\/\//i.test(action)) insecureActions.push(action);
    if (method === 'post' && !hasToken) unprotected.push(action || 'submits to the same page');
    if (hasPassword && !securePage) insecurePasswords.push(action || finalUrl);
  });

  if (insecurePasswords.length) {
    findings.push({
      id: 'form-password-plain-http',
      title: 'Password field on a non-HTTPS page',
      severity: 'high',
      evidence: [
        `A password input is served at ${insecurePasswords[0]} over plain HTTP, so sign-in details travel unencrypted.`,
      ],
      fix: [
        'Serve the whole site over HTTPS before anything else — no password should ever be typed on an http:// page.',
        'Redirect every http:// request to https:// permanently.',
      ],
    });
  }

  if (insecureActions.length) {
    findings.push({
      id: 'form-http-action',
      title: 'Form submits over an insecure connection',
      severity: 'medium',
      evidence: insecureActions.map((action) => `A form posts to ${action}, so whatever visitors type can be read on the way.`),
      fix: [
        'Change each form action to an https:// address.',
        'Keep the form on your own domain rather than posting to a third-party http:// endpoint.',
      ],
    });
  }

  if (unprotected.length) {
    findings.push({
      id: 'form-no-csrf',
      title: 'Form without a visible CSRF token',
      severity: 'medium',
      evidence: [
        ...unprotected.map((action) => `No protection token found on a form that ${action}.`),
        'This scanner cannot see server-side protections, so treat this as a prompt to confirm how the form is handled.',
      ],
      fix: [
        'Add a hidden token field (for example name="csrf_token") to every form that changes data.',
        'Validate the token on the server before acting on the submission — a token that is never checked does nothing.',
        "Prefer your framework's built-in CSRF protection (Django, Laravel, Rails and Next.js all ship one).",
      ],
    });
  }
}

async function checkSensitivePaths(origin, findings) {
  const results = await probePaths(origin, SENSITIVE_PATHS.map((entry) => entry.path));

  results.forEach((result, index) => {
    const entry = SENSITIVE_PATHS[index];
    if (result.status !== 200 || !result.body || !entry.match.test(result.body)) return;

    const evidence = [`GET ${origin}${result.path} returned HTTP 200 with real content.`];
    if (entry.path === '/.env') {
      const names = [...result.body.matchAll(/^\s*([A-Za-z_][A-Za-z0-9_]{2,})\s*=/gm)].map((match) => match[1]);
      const unique = [...new Set(names)].slice(0, 5);
      if (unique.length) evidence.push(`Configuration keys exposed: ${unique.join(', ')} (values redacted).`);
    } else {
      evidence.push(`Content snippet: "${snippet(result.body)}"`);
    }

    findings.push({
      id: `exposed-${entry.path.replace(/[^a-z0-9]+/gi, '-')}`,
      title: entry.title,
      severity: 'high',
      evidence,
      fix: entry.fix,
    });
  });
}

async function checkListings(origin, findings) {
  const results = await probePaths(origin, LISTING_PATHS);

  results.forEach((result) => {
    if (result.status !== 200 || !result.body || !/index of \//i.test(result.body)) return;
    findings.push({
      id: `dirlist-${result.path.replace(/[^a-z0-9]+/gi, '-')}`,
      title: `Open directory listing at ${result.path}`,
      severity: 'high',
      evidence: [
        `GET ${origin}${result.path} returned an "Index of /" file listing, so anyone can browse the files in that folder.`,
      ],
      fix: [
        'Turn off directory listing: "Options -Indexes" on Apache, or "autoindex off;" on nginx.',
        'Add an index file to the folder so a listing can never be served.',
        'Move anything private out of the public folder entirely.',
      ],
    });
  });
}

async function checkKeys(page, findings) {
  if (!page.html) return;

  const found = [];
  KEY_PATTERNS.forEach((pattern) => {
    const match = page.html.match(pattern.regex);
    if (match) found.push({ label: pattern.label, hint: redact(match[0]) });
  });

  if (found.length) {
    findings.push({
      id: 'leaked-keys',
      title: 'API keys exposed in page source',
      severity: 'high',
      evidence: found.map((item) => `${item.label} found in the page source (${item.hint}).`),
      fix: [
        "Treat every one of these keys as compromised: rotate it in the provider's dashboard and issue a new one.",
        'Move the key server-side so it is only used by your own backend, never sent to the browser.',
        'Replace hard-coded keys with environment variables or a secrets store.',
        'Check your bundled JavaScript too — keys are often left behind in build output.',
      ],
    });
  }
}

function gradeFor(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export default async function (req) {
  try {
    const payload = await req.json();
    const url = String(payload?.url || '').trim();
    const name = String(payload?.name || '').trim();
    const email = String(payload?.email || '').trim().toLowerCase();

    const confirmed =
      payload?.ownership_confirmed === true ||
      payload?.ownershipConfirmed === true ||
      payload?.authorized === true ||
      payload?.confirmed === true;

    if (!url) {
      return Response.json({ error: 'Enter the website address you want scanned.', expected_fields: EXPECTED_SCHEMA }, { status: 400 });
    }
    if (name.length < 2) {
      return Response.json({ error: 'Enter your name so we know who requested the scan.', expected_fields: EXPECTED_SCHEMA }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return Response.json({ error: 'Enter a valid email address.', expected_fields: EXPECTED_SCHEMA }, { status: 400 });
    }
    if (!confirmed) {
      return Response.json(
        {
          error: 'Please confirm you own or are authorised to scan this website by sending ownership_confirmed: true.',
          expected_fields: EXPECTED_SCHEMA,
        },
        { status: 400 }
      );
    }

    let target;
    try {
      target = normalizeSiteUrl(url);
    } catch (error) {
      return Response.json(
        { error: error?.message || 'That does not look like a valid website address.', expected_fields: EXPECTED_SCHEMA },
        { status: 400 }
      );
    }
    const page = await loadHomepage(target);

    let origin = target.origin;
    try {
      origin = new URL(page.finalUrl).origin;
    } catch {
      origin = target.origin;
    }

    const findings = [];
    await Promise.all([
      checkHttps(target, page, findings),
      checkSensitivePaths(origin, findings),
      checkListings(origin, findings),
    ]);
    checkHeaders(page, findings);
    checkForms(target, page, findings);
    checkKeys(page, findings);

    let score = 100;
    findings.forEach((finding) => {
      score -= PENALTY[finding.severity] || 0;
    });
    score = Math.max(0, score);

    findings.sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3));

    const now = new Date().toISOString();
    const scannedUrl = page.finalUrl || target.toString();

    const base44 = createClientFromRequest(req);

    const existing = await base44.asServiceRole.entities.Client.filter({ email }, { limit: 1 });
    let clientId;
    if (existing.items && existing.items.length) {
      clientId = existing.items[0].id;
      await base44.asServiceRole.entities.Client.update(clientId, {
        name,
        site_url: scannedUrl,
        verification_status: 'verified',
        last_scan_date: now,
      });
    } else {
      const created = await base44.asServiceRole.entities.Client.create({
        name,
        email,
        site_url: scannedUrl,
        verification_status: 'verified',
        last_scan_date: now,
      });
      clientId = created.id;
    }

    const saved = await base44.asServiceRole.entities.ScanReport.create({
      client_id: clientId,
      client_name: name,
      client_email: email,
      url: scannedUrl,
      scan_date: now,
      score,
      findings,
    });

    return Response.json({
      report: {
        id: saved.id,
        client_name: name,
        client_email: email,
        url: scannedUrl,
        scan_date: now,
        score,
        grade: gradeFor(score),
        findings,
      },
    });
  } catch (error) {
    return Response.json({ error: error?.message || 'The scan could not be completed.' }, { status: 500 });
  }
}