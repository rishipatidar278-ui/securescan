import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const PENALTY = { high: 15, medium: 7, low: 3 };
const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };
const MAX_FILES = 25;
const MAX_FILE_CHARS = 200000;
const MAX_TOTAL_CHARS = 400000;

const ALLOWED_EXTENSIONS = ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'kt', 'php', 'env', 'json', 'yml', 'txt'];

const LANGUAGE_BY_EXTENSION = {
  js: 'JavaScript',
  ts: 'TypeScript',
  jsx: 'JavaScript (JSX)',
  tsx: 'TypeScript (TSX)',
  py: 'Python',
  java: 'Java',
  kt: 'Kotlin',
  php: 'PHP',
  env: 'Environment file',
  json: 'JSON',
  yml: 'YAML',
  txt: 'Text',
};

const EXPECTED_FIELDS = {
  code: 'string — the code you want analysed',
  files: 'array — optional [{ name: "app.js", content: "…" }] of text files',
  name: 'string — your full name',
  email: 'string — a valid email address',
  ownership_confirmed: 'boolean — must be true',
};

const PLACEHOLDER_VALUE = /(your[_-]|example|sample|changeme|change_me|placeholder|xxxxxxxx|dummy|replace[_-]?me|insert[_-]?here|todo|<[a-z_]+>|\$\{|process\.env|os\.environ)/i;

const SECRET_PATTERNS = [
  { id: 'secret-aws-access-key', label: 'AWS access key', env: 'AWS_ACCESS_KEY_ID', regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { id: 'secret-google-api-key', label: 'Google API key', env: 'GOOGLE_API_KEY', regex: /\bAIza[0-9A-Za-z\-_]{35}\b/g },
  { id: 'secret-slack-token', label: 'Slack token', env: 'SLACK_TOKEN', regex: /\bxox[abprs]-[0-9A-Za-z\-]{10,}\b/g },
  { id: 'secret-stripe-secret-key', label: 'Stripe secret key', env: 'STRIPE_SECRET_KEY', regex: /\bsk_(?:live|test)_[0-9A-Za-z]{16,}\b/g },
  { id: 'secret-stripe-publishable-key', label: 'Stripe publishable key', env: 'STRIPE_PUBLISHABLE_KEY', regex: /\bpk_(?:live|test)_[0-9A-Za-z]{16,}\b/g },
  { id: 'secret-openai-key', label: 'OpenAI-style API key', env: 'OPENAI_API_KEY', regex: /\bsk-(?:proj-)?[A-Za-z0-9_\-]{20,}\b/g },
  { id: 'secret-github-token', label: 'GitHub token', env: 'GITHUB_TOKEN', regex: /\bgh[pousr]_[0-9A-Za-z]{36,}\b/g },
  { id: 'secret-private-key-block', label: 'Private key block', env: 'PRIVATE_KEY', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  {
    id: 'secret-jwt-secret',
    label: 'JWT signing secret',
    env: 'JWT_SECRET',
    regex: /(?:jwt[_-]?secret|jwtSecret|signing[_-]?key)\s*[:=]\s*['"`][^'"`]{8,}['"`]/gi,
  },
  {
    id: 'secret-generic-credential',
    label: 'Hardcoded credential',
    env: '',
    generic: true,
    regex:
      /\b(?:api[_-]?key|secret|token|password|passwd|pwd|client[_-]?secret|auth[_-]?key|access[_-]?key|private[_-]?key)\w*\s*[:=]\s*['"`][A-Za-z0-9+/=_\-.$:@!#%]{12,}['"`]/gi,
  },
  {
    id: 'secret-long-key-value',
    label: 'Long key-like value',
    env: '',
    generic: true,
    regex: /\b(?:key|secret|token|password|passwd)\w*\s*[:=]\s*['"`](?:[A-Za-z0-9+/=]{32,}|[0-9a-fA-F]{32,})['"`]/gi,
  },
];

const KNOWN_SECRET_TESTS = SECRET_PATTERNS.map(
  (pattern) => new RegExp(pattern.regex.source, pattern.regex.flags.replace(/g/g, '')),
);

const CREDENTIAL_HIGH_TOKENS = new Set(['password', 'passwd', 'pwd', 'pass', 'passphrase', 'secret']);
const CREDENTIAL_MEDIUM_TOKENS = new Set(['token', 'apikey']);

const CREDENTIAL_PLACEHOLDERS = new Set([
  'changeme',
  'change_me',
  'change-me',
  'password',
  'passwd',
  'pwd',
  'secret',
  'token',
  'apikey',
  'api_key',
  'todo',
  'tbd',
  'none',
  'null',
  'undefined',
  'test',
  'example',
  'sample',
  'string',
]);

const BARE_KEY_ASSIGNMENT =
  /(?:^|[^\w$.])\$?([A-Za-z_][\w$-]{0,60})\s*(?::=|[:=])\s*(["'`])((?:\\.|(?!\2)[^\\\n]){6,})\2/g;
const QUOTED_KEY_ASSIGNMENT = /(["'])([A-Za-z_][\w$-]{0,60})\1\s*:\s*(["'])((?:\\.|(?!\3)[^\\\n]){6,})\3/g;

const SQL_KEYWORDS = /\b(?:SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM)\b/i;
const SQL_DYNAMIC = /(?:\+\s*[A-Za-z_$][\w$.[\]]*|\$\{[^}]+\}|\.format\s*\(|%\s*[(\w]|\bf["'`]|`\$\{)/;
const SQL_REQUEST_INPUT = /(?:req\.(?:query|params|body)|request\.(?:GET|POST|args|form|json)|params\[|\$_GET|\$_POST|\$_REQUEST)/i;
const SQL_BOUND = /(?:\$\d|\?\s*[,)]|%s|:\w+\s*[,)])/;

const DANGEROUS_PATTERNS = [
  {
    id: 'dangerous-eval',
    label: 'eval() on dynamic input',
    regex: /\beval\s*\(/,
    fix: [
      'Remove eval() — parse the data instead of executing it.',
      'For JSON payloads use JSON.parse, and for arithmetic use a small expression parser.',
    ],
    code_fix: {
      language: 'JavaScript',
      before: "const result = eval(userInput);",
      after: '// Parse data instead of executing it\nconst result = JSON.parse(userInput);',
      note: 'eval() runs whatever the string contains, so any user input reaches your process with your permissions.',
    },
  },
  {
    id: 'dangerous-exec',
    label: 'exec() on dynamic input',
    regex: /(?<![.\w])exec\s*\(/,
    fix: ['Never execute user input as code.', 'Use a parser or a dedicated library for the operation you need.'],
    code_fix: {
      language: 'Python',
      before: 'exec(request.data)',
      after: '# Never run user input as code — decode it instead\nimport json\ndata = json.loads(request.data)',
      note: 'exec() runs arbitrary Python with your app’s permissions.',
    },
  },
  {
    id: 'dangerous-os-system',
    label: 'os.system() with a shell',
    regex: /os\.system\s*\(/,
    fix: ['Call the program directly with an argument list instead of a shell string.', 'Validate every value that reaches the command.'],
    code_fix: {
      language: 'Python',
      before: 'os.system("convert " + filename)',
      after: 'import subprocess\nsubprocess.run(["convert", filename], shell=False, check=True)',
      note: 'A shell string lets injected characters in the filename run as extra commands.',
    },
  },
  {
    id: 'dangerous-child-process',
    label: 'child_process.exec() with a shell',
    regex: /child_process\.(?:exec|execSync)\s*\(/,
    fix: ['Use execFile or spawn with an argument array so the shell never parses user input.'],
    code_fix: {
      language: 'JavaScript',
      before: 'exec(`convert ${filename}`);',
      after: "const { execFile } = require('child_process');\nexecFile('convert', [filename], (err, stdout) => { /* … */ });",
      note: 'exec() hands the whole string to a shell; execFile passes each argument separately.',
    },
  },
  {
    id: 'dangerous-unpickle',
    label: 'pickle.loads() on untrusted data',
    regex: /pickle\.loads?\s*\(/,
    fix: ['Never unpickle data you did not generate yourself — a pickle can execute code.', 'Use JSON for data crossing a trust boundary.'],
    code_fix: {
      language: 'Python',
      before: 'data = pickle.loads(request.body)',
      after: 'import json\ndata = json.loads(request.body)',
      note: 'Restoring a pickle can run arbitrary code as soon as it is loaded.',
    },
  },
  {
    id: 'dangerous-shell-true',
    label: 'subprocess with shell=True',
    regex: /subprocess\.\w+\([^)]*shell\s*=\s*True/,
    fix: ['Drop shell=True and pass the command as a list of arguments.', 'Keep user input out of the command string entirely.'],
    code_fix: {
      language: 'Python',
      before: 'subprocess.run("ping " + host, shell=True)',
      after: 'subprocess.run(["ping", host], shell=False)',
      note: 'shell=True makes the shell interpret characters such as ; and | inside the argument.',
    },
  },
  {
    id: 'dangerous-new-function',
    label: 'new Function() compiles a string',
    regex: /new\s+Function\s*\(/,
    fix: ['Compile nothing from user input — parse it instead.'],
    code_fix: {
      language: 'JavaScript',
      before: 'const fn = new Function(userCode);',
      after: '// Parse data instead of compiling code\nconst data = JSON.parse(userCode);',
      note: 'new Function() has the same reach as eval().',
    },
  },
  {
    id: 'dangerous-vm',
    label: 'vm.runInNewContext() on untrusted code',
    regex: /runInNewContext\s*\(/,
    severity: 'medium',
    fix: ['Do not run untrusted code in a vm context — it is not a security boundary.', 'Move the logic to a sandboxed service or a real parser.'],
  },
  {
    id: 'dangerous-inner-html',
    label: 'dangerouslySetInnerHTML',
    regex: /dangerouslySetInnerHTML/,
    severity: 'medium',
    fix: ['Render text as text so markup in user content cannot run.', 'If you need rich text, sanitize it with a dedicated HTML sanitizer first.'],
    code_fix: {
      language: 'JavaScript (JSX)',
      before: '<div dangerouslySetInnerHTML={{ __html: userText }} />',
      after: '<div>{userText}</div>',
      note: 'Rendering user content as HTML turns any injected tag into executable script.',
    },
  },
];

const WEAK_CRYPTO =
  /(?:\bmd5\s*\(|\bsha1\s*\(|\bcreateHash\s*\(\s*['"](?:md5|sha1)['"]|hashlib\.(?:md5|sha1)\s*\(|MessageDigest\.getInstance\s*\(\s*["'](?:MD5|SHA-?1)["'])/i;
const PASSWORD_CONTEXT = /(password|passwd|pwd|credential|login|passphrase|user)/i;

const NPM_THRESHOLDS = {
  lodash: '4.17.21',
  minimist: '1.2.6',
  axios: '1.6.0',
  express: '4.19.2',
  jsonwebtoken: '9.0.0',
  moment: '2.29.4',
  'node-fetch': '2.6.7',
  ejs: '3.1.10',
  'body-parser': '1.20.3',
  semver: '7.5.2',
  'tough-cookie': '4.1.3',
  'word-wrap': '1.2.4',
  json5: '2.2.3',
  braces: '3.0.3',
  micromatch: '4.0.8',
  'cross-spawn': '7.0.5',
  nanoid: '3.3.8',
  ws: '8.17.1',
  tar: '6.2.1',
  undici: '5.28.4',
  vite: '5.4.15',
  next: '14.2.25',
};

const NPM_HIGH = new Set(['jsonwebtoken', 'json5', 'next', 'express', 'axios', 'lodash']);

const PY_THRESHOLDS = {
  django: '4.2.16',
  flask: '3.0.3',
  requests: '2.32.0',
  pyyaml: '6.0.1',
  pillow: '10.3.0',
  jinja2: '3.1.4',
  urllib3: '2.2.2',
  numpy: '1.26.0',
  cryptography: '42.0.7',
  setuptools: '70.0.0',
  aiohttp: '3.10.2',
  certifi: '2024.7.4',
};

const PY_HIGH = new Set(['pyyaml', 'django', 'flask', 'jinja2']);

function truncate(value, max) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function extensionOf(name) {
  const match = String(name || '').match(/\.([A-Za-z0-9]+)$/);
  return match ? match[1].toLowerCase() : '';
}

function guessLanguage(code) {
  if (/<\?php/.test(code)) return 'PHP';
  if (/public\s+(?:final\s+)?class|System\.out\.println/.test(code)) return 'Java';
  if (/\bfun\s+\w+\s*\(|\bval\s+\w+\s*=/.test(code)) return 'Kotlin';
  if (/^\s*(?:def |import |from .+ import )/m.test(code) && !/function\s+\w+\s*\(/.test(code)) return 'Python';
  if (/(?:const|let|function|=>|require\(|import .+ from)/.test(code)) return 'JavaScript';
  return 'Code';
}

function looksLikeEnvFile(name, content) {
  const lower = String(name || '').toLowerCase();
  if (extensionOf(name) === 'env') return true;
  if (/(?:^|\/)\.env(?:\.[\w-]+)?$/i.test(lower)) return true;
  const credentialLines = content
    .split(/\r?\n/)
    .filter((line) => /^\s*(?:export\s+)?[A-Z][A-Z0-9_]{2,}\s*=\s*\S+/.test(line));
  return credentialLines.length >= 3 && !/[;{}]/.test(content);
}

function lineNumberAt(content, index) {
  return content.slice(0, index).split('\n').length;
}

function identifierBeforeAssignment(text) {
  const matches = [...String(text || '').matchAll(/([A-Za-z_$][\w$]*)\s*[:=]/g)];
  if (!matches.length) return '';
  return matches[matches.length - 1][1];
}

function toEnvName(identifier) {
  return String(identifier || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .toUpperCase()
    .replace(/^_+|_+$/g, '');
}

function languageFamily(language) {
  const value = String(language || '').toLowerCase();
  if (value.includes('python')) return 'python';
  if (value.includes('php')) return 'php';
  if (value.includes('kotlin')) return 'kotlin';
  if (value === 'java') return 'java';
  return 'js';
}

function envLookupSnippet(variableName, envName, language) {
  const variable = variableName || 'secretValue';
  switch (languageFamily(language)) {
    case 'python':
      return `${variable} = os.environ["${envName}"]`;
    case 'php':
      return `$${variable} = getenv('${envName}');`;
    case 'java':
      return `String ${variable} = System.getenv("${envName}");`;
    case 'kotlin':
      return `val ${variable} = System.getenv("${envName}")`;
    default:
      return `const ${variable} = process.env.${envName};`;
  }
}

function sqlFixSnippet(language) {
  switch (languageFamily(language)) {
    case 'python':
      return 'cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))\nrows = cursor.fetchall()';
    case 'php':
      return "$stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');\n$stmt->execute([$userId]);\n$rows = $stmt->fetchAll();";
    case 'java':
      return 'PreparedStatement stmt = conn.prepareStatement("SELECT * FROM users WHERE id = ?");\nstmt.setInt(1, userId);\nResultSet rows = stmt.executeQuery();';
    case 'kotlin':
      return 'val stmt = conn.prepareStatement("SELECT * FROM users WHERE id = ?")\nstmt.setInt(1, userId)\nval rows = stmt.executeQuery()';
    default:
      return "const rows = await db.query('SELECT * FROM users WHERE id = $1', [userId]);";
  }
}

function bcryptSnippet(language) {
  switch (languageFamily(language)) {
    case 'python':
      return 'import bcrypt\n\nhashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt(12))\n# later, on sign-in:\nok = bcrypt.checkpw(password.encode(), hashed)';
    case 'php':
      return "$hash = password_hash($password, PASSWORD_BCRYPT);\n// later, on sign-in:\nif (password_verify($password, $hash)) { /* signed in */ }";
    case 'java':
      return 'String hash = BCrypt.hashpw(password, BCrypt.gensalt(12));\n// later, on sign-in:\nboolean ok = BCrypt.checkpw(password, hash);';
    case 'kotlin':
      return 'val hash = BCrypt.hashpw(password, BCrypt.gensalt(12))\n// later, on sign-in:\nval ok = BCrypt.checkpw(password, hash)';
    default:
      return "const bcrypt = require('bcrypt');\n\nconst hash = await bcrypt.hash(password, 12);\n// later, on sign-in:\nconst ok = await bcrypt.compare(password, hash);";
  }
}

function storeHashSnippet(language) {
  switch (languageFamily(language)) {
    case 'python':
      return '# Hash first, then save the hash\nhashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt(12))\ncursor.execute("INSERT INTO users (email, password) VALUES (%s, %s)", (email, hashed))';
    case 'php':
      return '$hash = password_hash($password, PASSWORD_BCRYPT);\n$stmt = $pdo->prepare("INSERT INTO users (email, password) VALUES (?, ?)");\n$stmt->execute([$email, $hash]);';
    case 'java':
      return 'String hash = BCrypt.hashpw(password, BCrypt.gensalt(12));\nPreparedStatement stmt = conn.prepareStatement("INSERT INTO users (email, password) VALUES (?, ?)");\nstmt.setString(1, email);\nstmt.setString(2, hash);\nstmt.executeUpdate();';
    case 'kotlin':
      return 'val hash = BCrypt.hashpw(password, BCrypt.gensalt(12))\nconn.prepareStatement("INSERT INTO users (email, password) VALUES (?, ?)").use { stmt ->\n    stmt.setString(1, email)\n    stmt.setString(2, hash)\n    stmt.executeUpdate()\n}';
    default:
      return '// Hash first, then save the hash\nconst hash = await bcrypt.hash(req.body.password, 12);\nawait db.users.create({ email: req.body.email, password: hash });';
  }
}

function scanSecrets(doc, push) {
  SECRET_PATTERNS.forEach((pattern) => {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let match;
    while ((match = regex.exec(doc.content)) !== null) {
      if (match.index === regex.lastIndex) regex.lastIndex += 1;
      if (pattern.generic && PLACEHOLDER_VALUE.test(match[0])) continue;

      const line = lineNumberAt(doc.content, match.index);
      const text = (doc.lines[line - 1] || '').trim();
      if (!text) continue;

      const identifier = identifierBeforeAssignment(text);
      const envName = toEnvName(identifier) || pattern.env || 'SECRET_VALUE';

      push(doc, {
        id: pattern.id,
        title: `${pattern.label} hardcoded in your code`,
        severity: 'high',
        line,
        evidence: [`${doc.name}:${line} — ${truncate(text, 160)}`],
        fix: [
          'Rotate the value in the provider dashboard now — anything pasted into code should be treated as leaked.',
          `Read it from an environment variable at runtime instead (suggested name: ${envName}).`,
          'Keep the file out of version control and add .env to .gitignore.',
        ],
        code_fix: {
          before: text,
          after: envLookupSnippet(identifier, envName, doc.language),
          language: doc.language,
          note: 'The literal moves out of the source and is read from the environment at startup.',
        },
      });
    }
  });
}

function credentialKindFor(keyName) {
  const normalized = String(keyName || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase();
  const tokens = normalized.split(/[^a-z0-9]+/).filter(Boolean);
  const joined = tokens.join('');
  if (tokens.some((token) => CREDENTIAL_HIGH_TOKENS.has(token))) return 'credential';
  if (tokens.some((token) => CREDENTIAL_MEDIUM_TOKENS.has(token)) || joined.includes('apikey') || joined.includes('token')) {
    return 'token';
  }
  return null;
}

function isPlaceholderValue(value) {
  const text = String(value || '').trim();
  if (!text) return true;
  if (PLACEHOLDER_VALUE.test(text)) return true;
  if (/^\d{4}-\d{2}-\d{2}(?:[T ].*)?$/.test(text)) return true;
  const lower = text.toLowerCase();
  if (CREDENTIAL_PLACEHOLDERS.has(lower)) return true;
  if (/^(?:x{3,}|\*{3,}|\.{3,}|-{3,}|0{6,}|123456)$/.test(lower)) return true;
  return /^[<{].*[>}]$/.test(text);
}

function envExpression(envName, language) {
  switch (languageFamily(language)) {
    case 'python':
      return `os.environ["${envName}"]`;
    case 'php':
      return `getenv('${envName}')`;
    case 'java':
    case 'kotlin':
      return `System.getenv("${envName}")`;
    default:
      return `process.env.${envName}`;
  }
}

function scanHardcodedCredentials(doc, push) {
  doc.lines.forEach((raw, index) => {
    if (!raw) return;
    if (KNOWN_SECRET_TESTS.some((regex) => regex.test(raw))) return;

    const candidates = [];

    BARE_KEY_ASSIGNMENT.lastIndex = 0;
    let bare;
    while ((bare = BARE_KEY_ASSIGNMENT.exec(raw)) !== null) {
      candidates.push({ match: bare, key: bare[1], value: bare[3] });
    }

    QUOTED_KEY_ASSIGNMENT.lastIndex = 0;
    let quoted;
    while ((quoted = QUOTED_KEY_ASSIGNMENT.exec(raw)) !== null) {
      candidates.push({ match: quoted, key: quoted[2], value: quoted[4] });
    }

    candidates.sort((a, b) => a.match.index - b.match.index);

    const seenKeys = new Set();

    for (const candidate of candidates) {
      const kind = credentialKindFor(candidate.key);
      if (!kind) continue;
      if (isPlaceholderValue(candidate.value)) continue;

      const keyName = toEnvName(candidate.key) || 'SECRET_VALUE';
      if (seenKeys.has(keyName)) continue;
      seenKeys.add(keyName);

      const severe = kind === 'credential';
      const line = index + 1;
      const envName = keyName;
      const whole = candidate.match[0];
      const beforeValue = whole.slice(0, whole.length - candidate.value.length - 1);
      const prefix = beforeValue.slice(0, -1);
      const leading = raw.slice(0, candidate.match.index);
      const rest = raw.slice(candidate.match.index + whole.length);
      const after = `${leading}${prefix}${envExpression(envName, doc.language)}${rest}`.trim();

      push(doc, {
        id: `${severe ? 'secret-hardcoded-credential' : 'secret-hardcoded-token'}-${keyName.toLowerCase()}`,
        title: `Hardcoded ${severe ? 'credential' : 'token'}: ${candidate.key}`,
        severity: severe ? 'high' : 'medium',
        line,
        evidence: [`${doc.name}:${line} — ${truncate(raw, 160)}`],
        fix: [
          `Move the literal out of the source and read ${candidate.key} from an environment variable at runtime (suggested name: ${envName}).`,
          'Rotate the value now if this file was committed or shared — treat it as leaked.',
          'Add .env to .gitignore and set the variable in your host’s environment settings.',
        ],
        code_fix: {
          before: raw.trim(),
          after,
          language: doc.language,
          note: 'The literal moves out of the source and is read from the environment at startup.',
        },
      });
    }
  });
}

function scanSql(doc, push) {
  doc.lines.forEach((raw, index) => {
    if (!SQL_KEYWORDS.test(raw)) return;
    const window = doc.lines.slice(index, index + 3).join(' ');
    if (SQL_BOUND.test(raw) && !SQL_DYNAMIC.test(raw)) return;

    const dynamic = SQL_DYNAMIC.test(window);
    const fromRequest = SQL_REQUEST_INPUT.test(window);
    if (!dynamic && !fromRequest) return;

    push(doc, {
      id: 'sql-injection',
      title: 'User input reaches a SQL query',
      severity: 'high',
      line: index + 1,
      evidence: [`${doc.name}:${index + 1} — ${truncate(raw, 160)}${dynamic ? '' : ' (query reads request values directly)'}`],
      fix: [
        'Pass values as bound parameters instead of joining them into the query text.',
        'Validate the input type before it reaches the database (numbers as numbers, ids against an allow-list).',
        'Never build SQL from raw request fields, even when they look harmless.',
      ],
      code_fix: {
        before: raw.trim(),
        after: sqlFixSnippet(doc.language),
        language: doc.language,
        note: 'Bound parameters travel separately from the SQL text, so the value can never change the query.',
      },
    });
  });
}

function scanAuth(doc, push) {
  doc.lines.forEach((raw, index) => {
    const line = index + 1;
    const window = doc.lines.slice(Math.max(0, index - 3), index + 4).join('\n');

    if (/(?:password|passwd|pwd|pass)\s*(?:===?|!==?)\s*['"`]/i.test(raw)) {
      push(doc, {
        id: 'auth-plaintext-comparison',
        title: 'Password compared in plain text',
        severity: 'high',
        line,
        evidence: [`${doc.name}:${line} — ${truncate(raw, 160)}`],
        fix: [
          'Store passwords only as a slow salted hash (bcrypt, scrypt or Argon2).',
          'Compare with the hashing library’s verify function, never with == or ===.',
          'Re-hash every existing password the next time that user signs in.',
        ],
        code_fix: {
          before: raw.trim(),
          after: bcryptSnippet(doc.language),
          language: doc.language,
          note: 'bcrypt is deliberately slow and salted, so a stolen database cannot be reversed cheaply.',
        },
      });
      return;
    }

    if (/(?:password|passwd|pwd)\s*(?:===?|!==?)/i.test(raw) && /\bif\b|return/i.test(raw)) {
      push(doc, {
        id: 'auth-password-equality',
        title: 'Password equality check looks unhashed',
        severity: 'medium',
        line,
        evidence: [`${doc.name}:${line} — ${truncate(raw, 160)}`],
        fix: [
          'Confirm the stored value is a hash — if it is the raw password, replace this comparison with a hash verify call.',
          'Use bcrypt, scrypt or Argon2 with a per-user salt.',
        ],
        code_fix: {
          before: raw.trim(),
          after: bcryptSnippet(doc.language),
          language: doc.language,
          note: 'Compare the submitted password against the stored hash.',
        },
      });
      return;
    }

    if (/(?:password|passwd|pwd)\s*[:=]\s*(?:req\.(?:body|query)|request\.(?:form|json|POST|data)|payload|input|body\.)/i.test(raw)) {
      push(doc, {
        id: 'auth-unhashed-password',
        title: 'Password stored without hashing',
        severity: 'high',
        line,
        evidence: [`${doc.name}:${line} — ${truncate(raw, 160)}`],
        fix: [
          'Hash the password before it is saved — never write the plain value to the database.',
          'Use bcrypt with a cost of 12 (or Argon2id with sensible parameters).',
          'Rotate any account whose plain password may already be stored.',
        ],
        code_fix: {
          before: raw.trim(),
          after: storeHashSnippet(doc.language),
          language: doc.language,
          note: 'Only the hash is persisted; the plain password never touches storage or logs.',
        },
      });
      return;
    }

    if (/algorithms?\s*:\s*\[?\s*['"]none['"]/i.test(raw) || /jwt\.decode\([^)]*verify\s*=\s*false/i.test(raw)) {
      push(doc, {
        id: 'auth-jwt-verification-disabled',
        title: 'JWT signature verification disabled',
        severity: 'high',
        line,
        evidence: [`${doc.name}:${line} — ${truncate(raw, 160)}`],
        fix: [
          'Always verify the signature with your own secret or public key.',
          'Reject the "none" algorithm explicitly and pin the accepted algorithm.',
        ],
        code_fix: {
          before: raw.trim(),
          after: "jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });",
          language: doc.language,
          note: 'Without verification anyone can mint a token with any claims they like.',
        },
      });
      return;
    }

    if (/return\s+true\s*;?/i.test(raw)) {
      const todo = /(TODO|FIXME|placeholder|bypass|disabled|temporarily|stub|for now)/i.test(window);
      const authish = /(auth|login|authenticate|verify|admin|permission|session|token|access)/i.test(window);
      if (todo && authish) {
        push(doc, {
          id: 'auth-disabled-check',
          title: 'Authentication check disabled with a placeholder',
          severity: 'high',
          line,
          evidence: [`${doc.name}:${line} — ${truncate(raw, 160)}`],
          fix: [
            'Replace the placeholder with a real check before this reaches production.',
            'Deny by default: return false unless the credential was verified.',
            'Add a test that fails when the guard is bypassed.',
          ],
          code_fix: {
            before: raw.trim(),
            after:
              "if (!user) return false;\nreturn await verifySessionToken(user, token); // deny by default",
            language: doc.language,
            note: 'A guard that always returns true removes the protection entirely.',
          },
        });
      }
    }
  });
}

function scanDangerous(doc, push) {
  DANGEROUS_PATTERNS.forEach((pattern) => {
    doc.lines.forEach((raw, index) => {
      if (!pattern.regex.test(raw)) return;
      if (pattern.id === 'dangerous-exec' && /child_process|os\.system/.test(raw)) return;
      push(doc, {
        id: pattern.id,
        title: pattern.label,
        severity: pattern.severity || 'high',
        line: index + 1,
        evidence: [`${doc.name}:${index + 1} — ${truncate(raw, 160)}`],
        fix: pattern.fix,
        code_fix: pattern.code_fix ? { ...pattern.code_fix, before: raw.trim() } : null,
      });
    });
  });
}

function scanWeakCrypto(doc, push) {
  doc.lines.forEach((raw, index) => {
    if (!WEAK_CRYPTO.test(raw)) return;
    const window = doc.lines.slice(Math.max(0, index - 2), index + 3).join(' ');
    if (!PASSWORD_CONTEXT.test(window)) return;

    push(doc, {
      id: 'weak-crypto-password',
      title: 'Weak hash (MD5/SHA-1) used for passwords',
      severity: 'high',
      line: index + 1,
      evidence: [`${doc.name}:${index + 1} — ${truncate(raw, 160)}`],
      fix: [
        'Replace MD5/SHA-1 with a password hashing function: bcrypt, scrypt or Argon2.',
        'Add a random salt per password (the bcrypt libraries do this for you).',
        'Force a password reset for accounts hashed with the weak algorithm.',
      ],
      code_fix: {
        before: raw.trim(),
        after: bcryptSnippet(doc.language),
        language: doc.language,
        note: 'MD5 and SHA-1 are fast, so a leaked hash database can be brute-forced in hours.',
      },
    });
  });
}

function versionParts(value) {
  return String(value || '0')
    .replace(/^[^0-9]*/, '')
    .split(/[.\-+]/)
    .map((part) => parseInt(part, 10) || 0);
}

function versionLess(a, b) {
  const left = versionParts(a);
  const right = versionParts(b);
  for (let index = 0; index < 3; index += 1) {
    const l = left[index] || 0;
    const r = right[index] || 0;
    if (l !== r) return l < r;
  }
  return false;
}

function lineOfDependency(doc, name) {
  const found = doc.lines.findIndex((line) => new RegExp(`["']?${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']?\\s*[:=]`).test(line));
  return found >= 0 ? found + 1 : null;
}

function pushDependency(doc, push, name, version, safe, severe, ecosystem) {
  if (name === 'request') {
    push(doc, {
      id: 'vulnerable-dependency-request',
      title: 'Deprecated dependency: request',
      severity: 'high',
      line: lineOfDependency(doc, name),
      evidence: [`${doc.name} — "request" is deprecated and no longer receives security fixes.`],
      fix: ['Migrate to fetch (built into Node 18+) or axios.', 'Remove the dependency once the calls are migrated.'],
      code_fix: {
        before: `"${name}": "${version}"`,
        after: '// remove "request" and use fetch instead\n// const res = await fetch(url);',
        language: ecosystem,
        note: 'Unmaintained packages stop receiving security patches.',
      },
    });
    return;
  }
  if (!safe || !versionLess(version, safe)) return;

  push(doc, {
    id: `vulnerable-dependency-${name}`,
    title: `Outdated dependency: ${name} ${version}`,
    severity: severe,
    line: lineOfDependency(doc, name),
    evidence: [`${doc.name} — ${name} ${version} is older than ${safe}, which carries published security fixes.`],
    fix: [
      `Upgrade ${name} to ${safe} or newer.`,
      ecosystem === 'npm'
        ? 'Run npm audit after the upgrade and check the changelog for breaking changes.'
        : 'Run pip-audit after the upgrade and check the changelog for breaking changes.',
    ],
    code_fix: {
      before: `"${name}": "${version}"`,
      after: `"${name}": "${safe}"`,
      language: ecosystem,
      note: 'Update the manifest, reinstall, then run your test suite.',
    },
  });
}

function scanDependencies(doc, push) {
  const name = String(doc.name || '').toLowerCase();

  if (name.endsWith('package.json')) {
    let parsed;
    try {
      parsed = JSON.parse(doc.content);
    } catch {
      return;
    }
    const groups = [parsed.dependencies, parsed.devDependencies];
    groups.forEach((group) => {
      if (!group || typeof group !== 'object') return;
      Object.entries(group).forEach(([pkg, rawVersion]) => {
        const version = String(rawVersion || '').replace(/^[\^~>=<\s]+/, '');
        if (pkg === 'request') {
          pushDependency(doc, push, pkg, version, null, 'high', 'npm');
          return;
        }
        const safe = NPM_THRESHOLDS[pkg];
        if (!safe) return;
        pushDependency(doc, push, pkg, version, safe, NPM_HIGH.has(pkg) ? 'high' : 'medium', 'npm');
      });
    });
    return;
  }

  if (name.endsWith('requirements.txt')) {
    doc.lines.forEach((raw, index) => {
      const match = raw.match(/^\s*([A-Za-z0-9_.-]+)\s*==\s*([0-9][\w.]*)/);
      if (!match) return;
      const pkg = match[1].toLowerCase();
      const safe = PY_THRESHOLDS[pkg];
      if (!safe) return;
      const version = match[2];
      if (!versionLess(version, safe)) return;
      push(doc, {
        id: `vulnerable-dependency-${pkg}`,
        title: `Outdated dependency: ${pkg} ${version}`,
        severity: PY_HIGH.has(pkg) ? 'high' : 'medium',
        line: index + 1,
        evidence: [`${doc.name}:${index + 1} — ${pkg} ${version} is older than ${safe}, which carries published security fixes.`],
        fix: [
          `Upgrade ${pkg} to ${safe} or newer.`,
          'Run pip-audit after the upgrade and check the changelog for breaking changes.',
        ],
        code_fix: {
          before: raw.trim(),
          after: `${pkg}==${safe}`,
          language: 'Python',
          note: 'Update the requirements file, then reinstall and run your tests.',
        },
      });
    });
  }
}

function scanEnvFile(doc, push) {
  const credentials = [];
  doc.lines.forEach((raw, index) => {
    const match = raw.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/);
    if (!match) return;
    const key = match[1];
    const value = match[2].trim().replace(/^['"]|['"]$/g, '');
    if (!value) return;
    if (!/(KEY|SECRET|TOKEN|PASSWORD|PASS|PWD|CREDENTIAL|PRIVATE|AUTH|DSN|CONNECTION|DATABASE_URL|WEBHOOK)/i.test(key)) return;
    credentials.push({ key, raw: raw.trim(), line: index + 1 });
  });

  if (!credentials.length) return;

  push(doc, {
    id: 'env-credentials',
    title: `Environment file exposes ${credentials.length} credential${credentials.length === 1 ? '' : 's'}`,
    severity: 'high',
    line: credentials[0].line,
    evidence: credentials.slice(0, 12).map((credential) => `${doc.name}:${credential.line} — ${truncate(credential.raw, 140)}`),
    fix: [
      'Rotate every credential listed here — they have been exposed.',
      'Keep .env out of the repository and add it to .gitignore.',
      'Load the values from your host’s environment settings or a secret manager at deploy time.',
    ],
    code_fix: {
      before: credentials.map((credential) => credential.raw).join('\n'),
      after: `# .env — never committed. Values live in your host's secret settings.\n# Rotate every key below, then load them at runtime:\n${credentials
        .map((credential) => `${credential.key}=`)
        .join('\n')}`,
      language: 'Environment file',
      note: 'An environment file in the codebase hands over every service the app can reach.',
    },
  });
}

function analyzeDocument(doc, push) {
  if (doc.kind === 'env') {
    scanEnvFile(doc, push);
    return;
  }
  scanSecrets(doc, push);
  scanHardcodedCredentials(doc, push);
  scanSql(doc, push);
  scanAuth(doc, push);
  scanDangerous(doc, push);
  scanWeakCrypto(doc, push);
  scanDependencies(doc, push);
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
    const payload = await req.json().catch(() => ({}));

    const name = String(payload?.name || '').trim();
    const email = String(payload?.email || '').trim().toLowerCase();
    const confirmed =
      payload?.ownership_confirmed === true || payload?.ownershipConfirmed === true || payload?.confirmed === true;

    if (name.length < 2) {
      return Response.json({ error: 'Enter your name so we know who requested the scan.', expected_fields: EXPECTED_FIELDS }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return Response.json({ error: 'Enter a valid email address.', expected_fields: EXPECTED_FIELDS }, { status: 400 });
    }
    if (!confirmed) {
      return Response.json(
        { error: 'Please confirm this is your own code or that you are authorised to scan it.', expected_fields: EXPECTED_FIELDS },
        { status: 400 }
      );
    }

    const rawFiles = Array.isArray(payload?.files) ? payload.files : [];
    if (rawFiles.length > MAX_FILES) {
      return Response.json({ error: `Send at most ${MAX_FILES} files per scan.` }, { status: 400 });
    }

    const docs = [];

    rawFiles.forEach((file) => {
      const fileName = String(file?.name || 'file').slice(0, 120);
      const content = String(file?.content || '');
      const extension = extensionOf(fileName);
      if (extension && !ALLOWED_EXTENSIONS.includes(extension)) {
        throw new Error(`Only these file types can be scanned: ${ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(', ')}.`);
      }
      if (!content.trim()) return;
      if (content.length > MAX_FILE_CHARS) {
        throw new Error(`${fileName} is larger than ${Math.round(MAX_FILE_CHARS / 1000)}k characters. Scan it in smaller parts.`);
      }
      const kind = looksLikeEnvFile(fileName, content) ? 'env' : 'code';
      docs.push({
        name: fileName,
        content,
        lines: content.split(/\r?\n/),
        kind,
        language: kind === 'env' ? 'Environment file' : LANGUAGE_BY_EXTENSION[extension] || guessLanguage(content),
      });
    });

    const pasted = String(payload?.code || '');
    if (pasted.trim()) {
      if (pasted.length > MAX_FILE_CHARS) {
        throw new Error(`The pasted code is larger than ${Math.round(MAX_FILE_CHARS / 1000)}k characters. Scan it in smaller parts.`);
      }
      const kind = looksLikeEnvFile('pasted-code', pasted) ? 'env' : 'code';
      docs.push({
        name: 'pasted-code',
        content: pasted,
        lines: pasted.split(/\r?\n/),
        kind,
        language: kind === 'env' ? 'Environment file' : guessLanguage(pasted),
      });
    }

    if (!docs.length) {
      return Response.json({ error: 'Paste your code or upload at least one file to scan.', expected_fields: EXPECTED_FIELDS }, { status: 400 });
    }

    const totalChars = docs.reduce((sum, doc) => sum + doc.content.length, 0);
    if (totalChars > MAX_TOTAL_CHARS) {
      return Response.json(
        { error: `That is more than ${Math.round(MAX_TOTAL_CHARS / 1000)}k characters in total. Scan a smaller selection of files.` },
        { status: 400 }
      );
    }

    const findings = [];
    const seen = new Set();
    const push = (doc, finding) => {
      if (!finding) return;
      const key = `${finding.id}|${doc.name}|${finding.line || 0}`;
      if (seen.has(key)) return;
      seen.add(key);
      findings.push({ ...finding, file: doc.name, language: doc.language });
    };

    docs.forEach((doc) => analyzeDocument(doc, push));

    let score = 100;
    findings.forEach((finding) => {
      score -= PENALTY[finding.severity] || 0;
    });
    score = Math.max(0, score);

    findings.sort((a, b) => {
      const severity = (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3);
      if (severity !== 0) return severity;
      if (a.file !== b.file) return String(a.file).localeCompare(String(b.file));
      return (a.line || 0) - (b.line || 0);
    });

    const languages = [...new Set(docs.map((doc) => doc.language))];
    const codeLanguage = languages.join(', ');
    const fileNames = docs.map((doc) => doc.name).join(', ').slice(0, 300);
    const grade = gradeFor(score);
    const now = new Date().toISOString();

    const base44 = createClientFromRequest(req);
    const saved = await base44.asServiceRole.entities.CodeScanReport.create({
      client_name: name,
      client_email: email,
      code_language: codeLanguage,
      file_names: fileNames,
      score,
      grade,
      findings,
      scan_date: now,
    });

    return Response.json({
      report: {
        id: saved.id,
        client_name: name,
        client_email: email,
        code_language: codeLanguage,
        file_names: fileNames,
        score,
        grade,
        findings,
        scan_date: now,
      },
    });
  } catch (error) {
    return Response.json({ error: error?.message || 'The code scan could not be completed.' }, { status: 400 });
  }
}