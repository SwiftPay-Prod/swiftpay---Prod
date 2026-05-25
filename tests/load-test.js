import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const failureRate = new Rate('failed_requests');
const apiLatency = new Trend('api_latency');
let counter = 0;

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '1m', target: 500 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    failed_requests: ['rate<0.01'],
    http_req_duration: ['p(95)<5000'],
    api_latency: ['p(95)<2000'],
  },
};

const AUTH_API = 'http://localhost:5001/api/v1';
const PAYMENT_API = 'http://localhost:5002/api/v1';
const MGMT_API = 'http://localhost:5001/api/v1';

export default function () {
  counter++;
  const uniqueId = `${Date.now()}_${__VU}_${counter}`;
  const email = `loadtest_${uniqueId}@test.com`;
  const doc = String(10000000000000 + __VU * 1000 + counter).slice(0, 14);

  // Register
  const registerRes = http.post(`${AUTH_API}/auth/register`, JSON.stringify({
    companyName: 'LoadTest', document: doc,
    name: 'Tester', email, password: 'Test@1234',
  }), { headers: { 'Content-Type': 'application/json' } });
  check(registerRes, { 'register success': (r) => r.status === 200 });

  // Login
  const loginRes = http.post(`${AUTH_API}/auth/login`, JSON.stringify({
    email, password: 'Test@1234',
  }), { headers: { 'Content-Type': 'application/json' } });
  check(loginRes, { 'login success': (r) => r.status === 200 });

  const body = loginRes.json();
  const token = body && body.data ? body.data.accessToken : null;
  if (!token) {
    failureRate.add(1);
    sleep(1);
    return;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  group('Payment Links (Payment API)', () => {
    const createRes = http.post(`${PAYMENT_API}/payment-links`, JSON.stringify({
      title: `Load Test Link ${__VU}`,
      amount: Math.floor(Math.random() * 100000) + 1000,
    }), { headers: authHeaders });
    check(createRes, { 'create payment link': (r) => r.status === 200 });
    apiLatency.add(createRes.timings.duration);

    const listRes = http.get(`${PAYMENT_API}/payment-links?page=1&limit=25`, { headers: authHeaders });
    check(listRes, { 'list payment links': (r) => r.status === 200 });
  });

  group('Wallet (Payment API)', () => {
    const balRes = http.get(`${PAYMENT_API}/wallet/balance`, { headers: authHeaders });
    check(balRes, { 'wallet balance': (r) => r.status === 200 });

    const txRes = http.get(`${PAYMENT_API}/wallet/transactions?page=1&limit=25`, { headers: authHeaders });
    check(txRes, { 'wallet transactions': (r) => r.status === 200 });
  });

  group('Dashboard (Gestao API)', () => {
    const dashRes = http.get(`${MGMT_API}/dashboard/summary`, { headers: authHeaders });
    check(dashRes, { 'dashboard summary': (r) => r.status === 200 });
  });

  group('Settings (Gestao API)', () => {
    http.get(`${MGMT_API}/api-keys`, { headers: authHeaders });
    http.get(`${MGMT_API}/webhooks`, { headers: authHeaders });
    http.get(`${MGMT_API}/profile`, { headers: authHeaders });
  });

  sleep(1);
}
