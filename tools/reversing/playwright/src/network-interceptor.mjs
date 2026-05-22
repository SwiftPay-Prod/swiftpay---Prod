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

  console.log(`🔌 Network interception active → ${logDir}`);
  return {
    getCount: () => captureCount,
  };
}

export { setupNetworkLogging, isApiUrl };
