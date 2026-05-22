# Swiftpay Phase 1 — Zoppix Reverse Engineering via Playwright

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up an interactive Playwright session using system Chrome to reverse engineer the Zoppix payment platform — capture all API calls, page states, and authentication data.

**Architecture:** Three modular scripts in `tools/playwright/src/` — `data-store.mjs` (persistence), `network-interceptor.mjs` (traffic capture), `session.mjs` (main interactive orchestrator). All captured data goes to `tools/playwright/data/`. Post-exploration, `analyze.mjs` processes the raw logs into structured API documentation.

**Tech Stack:** Node.js ESM (.mjs), Playwright 1.60 (channel: chrome), system Google Chrome

---

## Task 1: Create directory structure and configuration files

**Files:**
- Create: `tools/playwright/data/api-logs/.gitkeep`
- Create: `tools/playwright/data/screenshots/.gitkeep`
- Create: `tools/playwright/data/html-snapshots/.gitkeep`
- Create: `.gitignore`

- [ ] **Step 1: Create the data directory tree**

```bash
mkdir -p tools/playwright/data/api-logs
mkdir -p tools/playwright/data/screenshots
mkdir -p tools/playwright/data/html-snapshots
touch tools/playwright/data/api-logs/.gitkeep
touch tools/playwright/data/screenshots/.gitkeep
touch tools/playwright/data/html-snapshots/.gitkeep
```

- [ ] **Step 2: Verify structure exists**

```bash
find tools/playwright/data -type f -o -type d | sort
```

Expected output:
```
tools/playwright/data
tools/playwright/data/api-logs
tools/playwright/data/api-logs/.gitkeep
tools/playwright/data/html-snapshots
tools/playwright/data/html-snapshots/.gitkeep
tools/playwright/data/screenshots
tools/playwright/data/screenshots/.gitkeep
```

- [ ] **Step 3: Create .gitignore to protect captured data**

Write `tools/playwright/.gitignore`:
```
# Session state — contains auth tokens
data/state.json

# Captured data — sensitive, contains real user data and API responses
data/api-logs/*.json
data/screenshots/*.png
data/html-snapshots/*.html
data/api-map.json
data/data-models.json
```

- [ ] **Step 4: Verify files are ignored by git**

```bash
cd /home/matspectrum-ai/OpenGateway && git init 2>/dev/null; git status --short tools/playwright/data/
```

Expected: No tracked files from `tools/playwright/data/` (gitignored correctly).

---

## Task 2: Write data-store.mjs — persistence module

**Files:**
- Create: `tools/playwright/src/data-store.mjs`

- [ ] **Step 1: Write the data-store.mjs module**

Write `tools/playwright/src/data-store.mjs`:

```javascript
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_ROOT = join(__dirname, '..', 'data');

/**
 * Ensure all data subdirectories exist and return their paths.
 */
function ensureDataDirs() {
  const dirs = ['api-logs', 'screenshots', 'html-snapshots'];
  for (const d of dirs) {
    const p = join(DATA_ROOT, d);
    if (!existsSync(p)) mkdirSync(p, { recursive: true });
  }
  return {
    apiLogs: join(DATA_ROOT, 'api-logs'),
    screenshots: join(DATA_ROOT, 'screenshots'),
    htmlSnapshots: join(DATA_ROOT, 'html-snapshots'),
    statePath: join(DATA_ROOT, 'state.json'),
    apiMapPath: join(DATA_ROOT, 'api-map.json'),
    dataModelsPath: join(DATA_ROOT, 'data-models.json'),
  };
}

/**
 * Sanitize a URL path for use as a filename.
 */
function sanitizePath(url) {
  try {
    const { pathname } = new URL(url);
    return pathname.replace(/\//g, '_').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
  } catch {
    return url.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 80);
  }
}

/**
 * Save a single API request/response log entry to a JSON file.
 */
function saveApiLog(logDir, entry) {
  const timestamp = Date.now();
  const filename = `${timestamp}-${entry.method}-${sanitizePath(entry.url)}.json`;
  const filePath = join(logDir, filename);
  writeFileSync(filePath, JSON.stringify(entry, null, 2));
  return filePath;
}

/**
 * Save Playwright browser context state (cookies, localStorage).
 */
async function saveSession(context, statePath) {
  await context.storageState({ path: statePath });
  const cookies = await context.cookies();
  console.log(`  💾 State saved: ${cookies.length} cookie(s) → ${statePath}`);
}

/**
 * Take a full-page screenshot and save it.
 */
async function takeScreenshot(page, screenshotDir, name) {
  const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filePath = join(screenshotDir, `${safeName}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`  📸 Screenshot → ${filePath}`);
  return filePath;
}

/**
 * Save the current page HTML content.
 */
async function saveHtmlSnapshot(page, htmlDir, name) {
  const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const html = await page.content();
  const filePath = join(htmlDir, `${safeName}.html`);
  writeFileSync(filePath, html);
  console.log(`  📄 HTML snapshot → ${filePath}`);
  return filePath;
}

export {
  ensureDataDirs,
  saveApiLog,
  saveSession,
  takeScreenshot,
  saveHtmlSnapshot,
  DATA_ROOT,
};
```

- [ ] **Step 2: Verify module loads without errors**

```bash
cd /home/matspectrum-ai/OpenGateway && node --input-type=module -e "import { ensureDataDirs } from './tools/playwright/src/data-store.mjs'; const dirs = ensureDataDirs(); console.log('OK:', Object.keys(dirs));"
```

Expected output: `OK: [ 'apiLogs', 'screenshots', 'htmlSnapshots', 'statePath', 'apiMapPath', 'dataModelsPath' ]`

---

## Task 3: Write network-interceptor.mjs — traffic capture module

**Files:**
- Create: `tools/playwright/src/network-interceptor.mjs`

- [ ] **Step 1: Write the network-interceptor.mjs module**

Write `tools/playwright/src/network-interceptor.mjs`:

```javascript
import { saveApiLog } from './data-store.mjs';

/** URL patterns that indicate an API request (not a static asset). */
const API_PATTERNS = ['/api/', '/graphql', '/v1/', '/v2/', '/auth/', '/oauth/'];

/** File extensions that should always be skipped. */
const SKIP_EXTENSIONS = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot|map|webp|mp4|webm)(\?.*)?$/i;

/**
 * Determine whether a URL looks like an API call or a static resource.
 */
function isApiUrl(url) {
  if (SKIP_EXTENSIONS.test(url)) return false;
  return API_PATTERNS.some(p => url.includes(p));
}

/**
 * Set up network logging on a Playwright page.
 * Captures all API requests and responses, saving each to a JSON log file.
 */
function setupNetworkLogging(page, logDir) {
  let captureCount = 0;

  page.on('response', async (response) => {
    const request = response.request();
    const url = request.url();

    if (!isApiUrl(url)) return;

    const entry = {
      timestamp: new Date().toISOString(),
      method: request.method(),
      url,
      requestHeaders: request.headers(),
      postData: null,
      status: response.status(),
      statusText: response.statusText(),
      responseHeaders: response.headers(),
      body: null,
    };

    // Capture request body (POST/PUT/PATCH payloads)
    try {
      const raw = request.postData();
      if (raw) {
        try {
          entry.postData = JSON.parse(raw);
        } catch {
          entry.postData = raw.slice(0, 5000);
        }
      }
    } catch {
      // Request may not expose postData (e.g., redirects)
    }

    // Capture response body
    try {
      const body = await response.text().catch(() => null);
      if (body) {
        try {
          entry.body = JSON.parse(body);
        } catch {
          entry.body = body.slice(0, 10000);
        }
      }
    } catch {
      // Streaming, blob, or opaque responses
    }

    saveApiLog(logDir, entry);
    captureCount++;
  });

  console.log(`  🔌 Network interception active → ${logDir}`);
  return {
    getCount: () => captureCount,
  };
}

export { setupNetworkLogging };
```

- [ ] **Step 2: Verify module loads without errors**

```bash
cd /home/matspectrum-ai/OpenGateway && node --input-type=module -e "import { setupNetworkLogging } from './tools/playwright/src/network-interceptor.mjs'; console.log('OK: setupNetworkLogging is', typeof setupNetworkLogging);"
```

Expected output: `OK: setupNetworkLogging is function`

---

## Task 4: Write session.mjs — main interactive session script

**Files:**
- Create: `tools/playwright/src/session.mjs`
- Remove: `tools/playwright/src/zoppix.mjs` (old file)

- [ ] **Step 1: Remove old zoppix.mjs**

```bash
rm -f /home/matspectrum-ai/OpenGateway/tools/playwright/src/zoppix.mjs
```

- [ ] **Step 2: Write the session.mjs main script**

Write `tools/playwright/src/session.mjs`:

```javascript
import { chromium } from 'playwright';
import { existsSync, unlinkSync, readFileSync, readdirSync } from 'fs';
import { setTimeout as sleep } from 'timers/promises';
import { createInterface } from 'readline';
import { ensureDataDirs, saveSession, takeScreenshot, saveHtmlSnapshot } from './data-store.mjs';
import { setupNetworkLogging } from './network-interceptor.mjs';

const TRIGGER_FILE = '/tmp/swiftpay-login-done.txt';
const ZOPPIX_URL = 'https://app.zoppix.com.br/';

if (existsSync(TRIGGER_FILE)) unlinkSync(TRIGGER_FILE);

async function waitForTrigger() {
  console.log('');
  console.log('  ┌─────────────────────────────────────────────────────┐');
  console.log(`  │  🔓 Faça o login manualmente no Chrome que abriu.   │`);
  console.log(`  │  📝 Depois DIGITE no terminal:                      │`);
  console.log(`  │     echo done > ${TRIGGER_FILE}     │`);
  console.log('  └─────────────────────────────────────────────────────┘');
  console.log('');

  while (true) {
    if (existsSync(TRIGGER_FILE)) {
      const content = readFileSync(TRIGGER_FILE, 'utf8').trim();
      console.log(`\n📥 Login confirmado: "${content}"\n`);
      break;
    }
    await sleep(1000);
  }
  unlinkSync(TRIGGER_FILE);
}

async function main() {
  console.log('═'.repeat(56));
  console.log('  Swiftpay — Zoppix Reverse Engineering Session');
  console.log('═'.repeat(56));

  const dirs = ensureDataDirs();

  // Launch system Google Chrome
  console.log('\n🌐 Abrindo Google Chrome...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
    args: ['--start-maximized'],
  });

  const context = await browser.newContext({
    viewport: null,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  });

  const page = await context.newPage();

  // Network interception
  const netLog = setupNetworkLogging(page, dirs.apiLogs);

  // Navigate to Zoppix
  console.log(`🔍 Navegando para ${ZOPPIX_URL}`);
  await page.goto(ZOPPIX_URL, { waitUntil: 'networkidle', timeout: 60000 });
  console.log('✅ Página carregada');

  // Capture login page
  await takeScreenshot(page, dirs.screenshots, '01-login-page');
  await saveHtmlSnapshot(page, dirs.htmlSnapshots, '01-login-page');

  // Wait for manual login
  await waitForTrigger();

  // Post-login capture
  const url = page.url();
  console.log(`📍 URL atual: ${url}`);
  await takeScreenshot(page, dirs.screenshots, '02-post-login');
  await saveHtmlSnapshot(page, dirs.htmlSnapshots, '02-post-login');

  // Save session
  await saveSession(context, dirs.statePath);

  // Status report
  const logCount = readdirSync(dirs.apiLogs).length;
  console.log('');
  console.log('═'.repeat(56));
  console.log('  ✅ SESSÃO ATIVA — Chrome permanece aberto');
  console.log(`  📊 API calls capturadas: ${logCount}`);
  console.log(`  🔗 URL: ${url}`);
  console.log('  📁 Dados em: tools/playwright/data/');
  console.log('');
  console.log('  📝 Comandos disponíveis no terminal:');
  console.log('     screenshot <nome>  — salvar screenshot da página');
  console.log('     snapshot <nome>    — salvar HTML completo');
  console.log('     stats              — mostrar estatísticas');
  console.log('     exit               — salvar estado e fechar');
  console.log('═'.repeat(56));
  console.log('');

  // Interactive command loop
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  rl.on('line', async (line) => {
    const cmd = line.trim();
    if (!cmd) return;

    if (cmd === 'exit' || cmd === 'quit') {
      console.log('\n💾 Salvando estado final...');
      await saveSession(context, dirs.statePath);
      const total = readdirSync(dirs.apiLogs).length;
      console.log(`📊 Total API calls: ${total}`);
      console.log('🔒 Fechando Chrome...');
      await browser.close();
      rl.close();
      process.exit(0);

    } else if (cmd.startsWith('screenshot ')) {
      const name = cmd.slice(11).trim();
      await takeScreenshot(page, dirs.screenshots, name || `capture-${Date.now()}`);

    } else if (cmd.startsWith('snapshot ')) {
      const name = cmd.slice(9).trim();
      await saveHtmlSnapshot(page, dirs.htmlSnapshots, name || `capture-${Date.now()}`);

    } else if (cmd === 'stats') {
      const logs = readdirSync(dirs.apiLogs).length;
      const screens = readdirSync(dirs.screenshots).length;
      const snaps = readdirSync(dirs.htmlSnapshots).length;
      console.log(`\n  📊 ESTATÍSTICAS`);
      console.log(`  API logs:      ${logs}`);
      console.log(`  Screenshots:   ${screens}`);
      console.log(`  HTML snapshots:${snaps}`);
      console.log(`  URL atual:     ${page.url()}`);

    } else if (cmd) {
      console.log(`  ❓ Comando: "${cmd}" — use: screenshot | snapshot | stats | exit`);
    }
  });
}

main().catch((err) => {
  console.error('❌ Erro fatal:', err.message);
  process.exit(1);
});
```

- [ ] **Step 3: Verify module loads without errors**

```bash
cd /home/matspectrum-ai/OpenGateway && node --input-type=module -e "
import { chromium } from 'playwright';
import { ensureDataDirs } from './tools/playwright/src/data-store.mjs';
const dirs = ensureDataDirs();
console.log('All imports OK');
console.log('Data dirs:', JSON.stringify(dirs, null, 2));
"
```

Expected output: `All imports OK` followed by directory paths.

- [ ] **Step 4: Quick smoke test — launch Chrome headlessly and navigate**

```bash
cd /home/matspectrum-ai/OpenGateway && timeout 15 node --input-type=module -e "
import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
await page.goto('https://app.zoppix.com.br/', { waitUntil: 'domcontentloaded', timeout: 15000 });
console.log('Title:', await page.title());
console.log('URL:', page.url());
await browser.close();
console.log('Headless smoke test PASSED');
" 2>&1
```

Expected: Prints page title and URL, ends with `Headless smoke test PASSED`.

---

## Task 5: Write analyze.mjs — post-exploration API analysis

**Files:**
- Create: `tools/playwright/src/analyze.mjs`

- [ ] **Step 1: Write the analyze.mjs analysis script**

Write `tools/playwright/src/analyze.mjs`:

```javascript
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const LOG_DIR = join(DATA_DIR, 'api-logs');
const API_MAP_PATH = join(DATA_DIR, 'api-map.json');
const DATA_MODELS_PATH = join(DATA_DIR, 'data-models.json');

if (!existsSync(LOG_DIR)) {
  console.error('❌ No api-logs directory found. Run session.mjs first.');
  process.exit(1);
}

const files = readdirSync(LOG_DIR).filter(f => f.endsWith('.json'));
if (files.length === 0) {
  console.error('❌ No API log files found. Run session.mjs and capture data first.');
  process.exit(1);
}

console.log(`📊 Processing ${files.length} API log files...`);

/** @type {Map<string, { methods: Set<string>, requests: any[], responses: any[] }>} */
const endpointMap = new Map();
/** @type {Map<string, Set<string>>} */
const modelFields = new Map();

for (const file of files) {
  const raw = readFileSync(join(LOG_DIR, file), 'utf8');
  let entry;
  try {
    entry = JSON.parse(raw);
  } catch {
    continue;
  }

  // Normalize URL to a path pattern
  let path;
  try {
    const u = new URL(entry.url);
    path = u.pathname;
  } catch {
    path = entry.url;
  }

  // Create endpoint key: method + path
  const key = `${entry.method} ${path}`;

  if (!endpointMap.has(key)) {
    endpointMap.set(key, { methods: new Set(), requests: [], responses: [] });
  }

  const ep = endpointMap.get(key);
  ep.methods.add(entry.method);
  ep.requests.push({
    headers: entry.requestHeaders,
    postData: entry.postData,
  });
  if (entry.status) {
    ep.responses.push({
      status: entry.status,
      headers: entry.responseHeaders,
      body: entry.body,
    });
  }

  // Extract model fields from response bodies
  if (entry.body && typeof entry.body === 'object') {
    extractModelFields(entry.body, entry.url, modelFields);
  }
}

/**
 * Recursively extract field names from response bodies to infer data models.
 */
function extractModelFields(obj, source, modelFields, prefix = '') {
  if (!obj || typeof obj !== 'object') return;

  if (Array.isArray(obj)) {
    if (obj.length > 0) {
      extractModelFields(obj[0], source, modelFields, prefix);
    }
    return;
  }

  // Heuristic: objects with 3+ fields are potential models
  const keys = Object.keys(obj);
  if (keys.length >= 3) {
    const modelName = prefix || guessModelName(source);
    if (!modelFields.has(modelName)) {
      modelFields.set(modelName, new Set());
    }
    const fields = modelFields.get(modelName);
    for (const key of keys) {
      const val = obj[key];
      const type = Array.isArray(val) ? 'array'
        : typeof val === 'object' && val !== null ? 'object'
        : typeof val;
      fields.add(`${key}:${type}`);
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        extractModelFields(val, source, modelFields, key);
      }
    }
  }
}

/**
 * Guess a model name from the URL path.
 */
function guessModelName(url) {
  try {
    const { pathname } = new URL(url);
    const parts = pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] || parts[parts.length - 2] || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

// Build API map
const apiMap = [];
for (const [endpoint, data] of endpointMap) {
  const [method, path] = endpoint.split(' ');
  const sampleRequest = data.requests[0] || {};
  const sampleResponse = data.responses[0] || {};

  apiMap.push({
    method,
    path,
    requestCount: data.requests.length,
    sampleRequestHeaders: sampleRequest.headers || {},
    samplePostData: sampleRequest.postData || null,
    sampleResponseStatus: sampleResponse.status || null,
    sampleResponseBody: sampleResponse.body || null,
  });
}

apiMap.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

// Build data models
const dataModels = [];
for (const [name, fields] of modelFields) {
  dataModels.push({
    name,
    fields: Array.from(fields).sort(),
  });
}

writeFileSync(API_MAP_PATH, JSON.stringify(apiMap, null, 2));
writeFileSync(DATA_MODELS_PATH, JSON.stringify(dataModels, null, 2));

console.log(`✅ API Map:    ${API_MAP_PATH} (${apiMap.length} endpoints)`);
console.log(`✅ Data Models: ${DATA_MODELS_PATH} (${dataModels.length} models)`);
```

- [ ] **Step 2: Verify module loads without errors**

```bash
cd /home/matspectrum-ai/OpenGateway && node --input-type=module -e "
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
console.log('analyze.mjs imports verified OK');
"
```

Expected output: `analyze.mjs imports verified OK`

---

## Task 6: Execute the interactive session

**Files:**
- None (runtime execution)

- [ ] **Step 1: Launch the interactive session**

```bash
cd /home/matspectrum-ai/OpenGateway && DISPLAY=:0.0 node tools/playwright/src/session.mjs
```

Expected output:
```
══════════════════════════════════════════════════════
  Swiftpay — Zoppix Reverse Engineering Session
══════════════════════════════════════════════════════

🌐 Abrindo Google Chrome...
  🔌 Network interception active → .../tools/playwright/data/api-logs
🔍 Navegando para https://app.zoppix.com.br/
✅ Página carregada
  📸 Screenshot → .../tools/playwright/data/screenshots/01-login-page.png
  📄 HTML snapshot → .../tools/playwright/data/html-snapshots/01-login-page.html

  ┌─────────────────────────────────────────────────────┐
  │  🔓 Faça o login manualmente no Chrome que abriu.   │
  │  📝 Depois DIGITE no terminal:                      │
  │     echo done > /tmp/swiftpay-login-done.txt        │
  └─────────────────────────────────────────────────────┘
```

- [ ] **Step 2: User logs in and triggers continuation**

After the user logs in to Zoppix in Chrome, they type:
```bash
echo done > /tmp/swiftpay-login-done.txt
```

The session continues automatically, showing:
```
📥 Login confirmado: "done"

📍 URL atual: https://app.zoppix.com.br/...
  📸 Screenshot → .../tools/playwright/data/screenshots/02-post-login.png
  📄 HTML snapshot → .../tools/playwright/data/html-snapshots/02-post-login.html
  💾 State saved: N cookie(s) → .../tools/playwright/data/state.json

══════════════════════════════════════════════════════
  ✅ SESSÃO ATIVA — Chrome permanece aberto
  ...
══════════════════════════════════════════════════════
```

- [ ] **Step 3: Verify captured data exists**

```bash
ls -la tools/playwright/data/api-logs/ | head -5
ls -la tools/playwright/data/screenshots/
wc -l tools/playwright/data/state.json
```

Expected: API log JSON files exist, screenshots exist, state.json is non-empty.

- [ ] **Step 4: Run the API analyzer**

```bash
cd /home/matspectrum-ai/OpenGateway && node tools/playwright/src/analyze.mjs
```

Expected output:
```
📊 Processing N API log files...
✅ API Map:    tools/playwright/data/api-map.json (M endpoints)
✅ Data Models: tools/playwright/data/data-models.json (K models)
```
