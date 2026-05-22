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
