/* eslint-disable @typescript-eslint/no-unused-expressions */
import http from 'k6/http';
import { check, sleep } from 'k6';
import ws from 'k6/experimental/websockets';
import { Rate, Trend } from 'k6/metrics';

export const options = {
  scenarios: {
    merchant_dashboard: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '15m', target: 100 },
        { duration: '2m', target: 0 },
      ],
      exec: 'merchantJourney',
      tags: { journey: 'merchant_dashboard' },
    },
    checkout_flow: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 60 },
        { duration: '15m', target: 60 },
        { duration: '2m', target: 0 },
      ],
      exec: 'checkoutJourney',
      tags: { journey: 'checkout_flow' },
    },
    admin_operations: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 20 },
        { duration: '15m', target: 20 },
        { duration: '2m', target: 0 },
      ],
      exec: 'adminJourney',
      tags: { journey: 'admin_operations' },
    },
    auth_churn: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 20 },
        { duration: '15m', target: 20 },
        { duration: '2m', target: 0 },
      ],
      exec: 'authJourney',
      tags: { journey: 'auth_churn' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1200'],
    'http_req_duration{journey:checkout_flow}': ['p(95)<1500'],
    http_req_failed: ['rate<0.01'],
  },
};

const errorRate = new Rate('errors');
const paymentCreateDuration = new Trend('payment_create_duration');
const checkoutCalculateDuration = new Trend('checkout_calculate_duration');
const adminListDuration = new Trend('admin_list_duration');
const authLoginDuration = new Trend('auth_login_duration');

function bearer() {
  return `Bearer ${__ENV.ACCESS_TOKEN}`;
}

function merchantHeaders() {
  return {
    headers: {
      Authorization: bearer(),
      'Content-Type': 'application/json',
      'X-Merchant-Id': __ENV.MERCHANT_ID,
    },
  };
}

function adminHeaders() {
  return {
    headers: {
      Authorization: bearer(),
      'Content-Type': 'application/json',
      'X-Admin-Role': 'God',
    },
  };
}

export function merchantJourney() {
  const base = __ENV.BASE_URL || 'https://api.swiftpayment.info';
  const panel = __ENV.PANEL_BASE_URL || 'https://swiftpayment.info';

  const dashboardRes = http.get(`${base}/v1/merchant/${__ENV.MERCHANT_ID}/dashboard`, merchantHeaders());
  check(dashboardRes, {
    'dashboard status 2xx': (r) => r.status >= 200 && r.status < 300,
  }) || errorRate.add(1);
  sleep(Math.random() * 2 + 1);

  const paymentsRes = http.get(`${base}/v1/merchant/${__ENV.MERCHANT_ID}/payments?page=1&pageSize=20`, merchantHeaders());
  check(paymentsRes, {
    'payments list 2xx': (r) => r.status >= 200 && r.status < 300,
  }) || errorRate.add(1);
  sleep(Math.random() * 2 + 1);

  const ordersRes = http.get(`${base}/v1/merchant/${__ENV.MERCHANT_ID}/orders?page=1&pageSize=20`, merchantHeaders());
  check(ordersRes, {
    'orders list 2xx': (r) => r.status >= 200 && r.status < 300,
  }) || errorRate.add(1);
  sleep(Math.random() * 2 + 1);

  const balanceRes = http.get(`${base}/v1/balance`, merchantHeaders());
  check(balanceRes, {
    'balance 2xx': (r) => r.status >= 200 && r.status < 300,
  }) || errorRate.add(1);
  sleep(Math.random() * 2 + 1);

  const pageRes = http.get(`${panel}/panel/merchant/dashboard`);
  check(pageRes, {
    'panel page 2xx': (r) => r.status >= 200 && r.status < 300,
  }) || errorRate.add(1);
  sleep(Math.random() * 3 + 2);
}

export function checkoutJourney() {
  const base = __ENV.BASE_URL || 'https://api.swiftpayment.info';

  const calcRes = http.post(
    `${base}/v1/checkouts/calculate`,
    JSON.stringify({
      checkoutId: __ENV.CHECKOUT_ID,
      items: [{ productId: __ENV.PRODUCT_ID, quantity: 1 }],
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Origin: __ENV.CHECKOUT_ORIGIN || 'https://swiftpayment.info',
      },
    }
  );
  checkoutCalculateDuration.add(calcRes.timings.duration);
  check(calcRes, {
    'calculate 2xx or 4xx validation': (r) => [200, 400, 404, 422].includes(r.status),
  }) || errorRate.add(1);
  sleep(Math.random() * 1 + 1);

  const createRes = http.post(
    `${base}/v1/checkouts/create-order`,
    JSON.stringify({
      checkoutId: __ENV.CHECKOUT_ID,
      customer: { name: 'Load Test', email: 'loadtest@example.com', document: '00000000000' },
      items: [{ productId: __ENV.PRODUCT_ID, quantity: 1 }],
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Origin: __ENV.CHECKOUT_ORIGIN || 'https://swiftpayment.info',
      },
    }
  );
  paymentCreateDuration.add(createRes.timings.duration);
  check(createRes, {
    'create order 2xx or 4xx validation': (r) => [200, 400, 404, 422].includes(r.status),
  }) || errorRate.add(1);
  sleep(Math.random() * 2 + 1);

  const getRes = http.get(`${base}/v1/checkouts/${__ENV.CHECKOUT_ID}`);
  check(getRes, {
    'checkout config 2xx or 404': (r) => [200, 404].includes(r.status),
  }) || errorRate.add(1);
  sleep(Math.random() * 2 + 1);
}

export function adminJourney() {
  const base = __ENV.BASE_URL || 'https://api.swiftpayment.info';

  const txRes = http.get(`${base}/v1/admin/transactions?page=1&pageSize=20`, adminHeaders());
  adminListDuration.add(txRes.timings.duration);
  check(txRes, {
    'admin transactions 2xx': (r) => r.status >= 200 && r.status < 300,
  }) || errorRate.add(1);
  sleep(Math.random() * 2 + 1);

  const payoutRes = http.get(`${base}/v1/admin/payouts?page=1&pageSize=20`, adminHeaders());
  check(payoutRes, {
    'admin payouts 2xx': (r) => r.status >= 200 && r.status < 300,
  }) || errorRate.add(1);
  sleep(Math.random() * 2 + 1);

  const merchantRes = http.get(`${base}/v1/admin/merchants?page=1&pageSize=20`, adminHeaders());
  check(merchantRes, {
    'admin merchants 2xx': (r) => r.status >= 200 && r.status < 300,
  }) || errorRate.add(1);
  sleep(Math.random() * 2 + 1);

  const acquirerRes = http.get(`${base}/v1/admin/acquirers`, adminHeaders());
  check(acquirerRes, {
    'admin acquirers 2xx': (r) => r.status >= 200 && r.status < 300,
  }) || errorRate.add(1);
  sleep(Math.random() * 2 + 1);

  const reconciliationRes = http.get(`${base}/v1/admin/reconciliations?page=1&pageSize=20`, adminHeaders());
  check(reconciliationRes, {
    'admin reconciliations 2xx': (r) => r.status >= 200 && r.status < 300,
  }) || errorRate.add(1);
  sleep(Math.random() * 2 + 1);
}

export function authJourney() {
  const base = __ENV.BASE_URL || 'https://api.swiftpayment.info';

  const loginRes = http.post(
    `${base}/v1/auth/signin`,
    JSON.stringify({
      email: __ENV.LOAD_USER_EMAIL || 'loadtest@teste.com',
      password: __ENV.LOAD_USER_PASSWORD || 'LoadTest123!',
      deviceId: `load-${__VU}-${__ITER}`,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Type': 'web',
      },
    }
  );
  authLoginDuration.add(loginRes.timings.duration);
  check(loginRes, {
    'signin 2xx or 4xx': (r) => [200, 401, 422].includes(r.status),
  }) || errorRate.add(1);
  sleep(Math.random() * 2 + 1);

  const forgotRes = http.post(
    `${base}/v1/auth/forgot-password`,
    JSON.stringify({ email: __ENV.LOAD_USER_EMAIL || 'loadtest@teste.com' }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  check(forgotRes, {
    'forgot password 202 or 4xx': (r) => [202, 404, 429].includes(r.status),
  }) || errorRate.add(1);
  sleep(Math.random() * 2 + 1);

  const confirmRes = http.post(
    `${base}/v1/auth/send-email-confirmation`,
    JSON.stringify({ email: __ENV.LOAD_USER_EMAIL || 'loadtest@teste.com' }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  check(confirmRes, {
    'send email confirmation 202 or 4xx': (r) => [202, 404, 429].includes(r.status),
  }) || errorRate.add(1);
  sleep(Math.random() * 2 + 1);
}

export function websocketJourney() {
  const notificationsUrl = `${__ENV.WS_URL || 'wss://swiftpayment.info'}/hubs/notifications?access_token=${__ENV.ACCESS_TOKEN}`;
  const paymentUrl = `${__ENV.WS_URL || 'wss://swiftpayment.info'}/hubs/payment-status?access_token=${__ENV.ACCESS_TOKEN}`;

  const params = { tags: { ws: 'notifications' } };
  ws.connect(notificationsUrl, params, (socket) => {
    socket.on('open', () => check(socket, { 'ws notifications open': (s) => s.readyState === 1 }) || errorRate.add(1));
    socket.on('error', (e) => { check(e, { 'ws notifications no error': () => false }) || errorRate.add(1); socket.close(); });
    socket.setTimeout(() => { socket.close(); }, Math.random() * 20 + 20);
  });

  const paymentParams = { tags: { ws: 'payment-status' } };
  ws.connect(paymentUrl, paymentParams, (socket) => {
    socket.on('open', () => check(socket, { 'ws payment-status open': (s) => s.readyState === 1 }) || errorRate.add(1));
    socket.on('error', (e) => { check(e, { 'ws payment-status no error': () => false }) || errorRate.add(1); socket.close(); });
    socket.setTimeout(() => { socket.close(); }, Math.random() * 20 + 20);
  });

  sleep(Math.random() * 10 + 10);
}

export function teardown(_data) {
  console.log('load run finished');
}

