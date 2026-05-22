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

/** @type {Map<string, { requests: any[], responses: any[] }>} */
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
    endpointMap.set(key, { requests: [], responses: [] });
  }

  const ep = endpointMap.get(key);
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
    for (let i = parts.length - 1; i >= 0; i--) {
      if (!/^\d+$/.test(parts[i]) && !/^[0-9a-f-]{32,}$/i.test(parts[i])) {
        return parts[i];
      }
    }
    return parts[0] || 'Unknown';
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
