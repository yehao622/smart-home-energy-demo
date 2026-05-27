import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

const failedLogins = new Counter('failed_logins');
const successLogins = new Counter('success_logins');

const BASE_URL = 'http://localhost:80';

// Three traffic profiles
export const options = {
  scenarios: {
    // Scenario 1: Normal traffic — 10 steady users for 1 minute
    normal_traffic: {
      executor: 'constant-vus',
      vus: 10,
      duration: '1m',
      startTime: '0s',
      tags: { scenario: 'normal' },
    },
    // Scenario 2: Spike — ramp to 100 users instantly, hold 30s, ramp down
    spike_traffic: {
      executor: 'ramping-vus',
      startTime: '1m',
      stages: [
        { duration: '10s', target: 100 },
        { duration: '30s', target: 100 },
        { duration: '10s', target: 0  },
      ],
      tags: { scenario: 'spike' },
    },
    // Scenario 3: Soak — 30 users sustained for 2 minutes
    soak_traffic: {
      executor: 'constant-vus',
      vus: 30,
      duration: '2m',
      startTime: '2m',
      tags: { scenario: 'soak' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    http_req_failed:   ['rate<0.15'],  // Less than 15% failure rate
  },
};

// Login once at the start, reuse token for entire VU lifetime
export function setup() {
  const tokens = [];
  // Pre-generate tokens for all VUs
  for (let i = 0; i < 130; i++) {
    const res = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ username: 'demo', password: 'demo123' }),
      { headers: { 'Content-Type': 'application/json' } },
    );
    tokens.push(res.json('access_token'));
    sleep(0.1); // avoid hammering login during setup
  }
  return { tokens };
}

export default function (data) {
  // Each VU uses its own pre-fetched token
  const token = data.tokens[__VU % data.tokens.length];

  const params = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  // 1. Health check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health status 200': (r) => r.status === 200,
  });

  // 2. Get devices (authenticated)
  const devicesRes = http.get(`${BASE_URL}/api/devices`, params);
  check(devicesRes, {
    'devices status 200': (r) => r.status === 200,
  });

  // 3. Simulate occasional failed login (1 in 10 requests)
  if (Math.random() < 0.1) {
    const failRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ username: 'demo', password: 'wrongpassword' }),
      { headers: { 'Content-Type': 'application/json' } },
    );
    check(failRes, {
      'failed login blocked': (r) => r.status === 401 || r.status === 429,
    });
    failedLogins.add(1);
  } else {
    successLogins.add(1);
  }

  sleep(1);
}
