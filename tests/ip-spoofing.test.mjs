import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getClientIp, checkRateLimit } from '../src/lib/server/security.ts';

test('RL Step 1: Off Vercel, spoofed x-forwarded-for headers cannot bypass rate limits', () => {
  const origVercel = process.env.VERCEL;
  const origProxy = process.env.TRUSTED_PROXY;

  try {
    delete process.env.VERCEL;
    delete process.env.TRUSTED_PROXY;

    // Simulate 3 requests from an attacker rotating x-forwarded-for headers
    const req1 = { headers: new Headers({ 'x-forwarded-for': '198.51.100.1' }) };
    const req2 = { headers: new Headers({ 'x-forwarded-for': '198.51.100.2' }) };
    const req3 = { headers: new Headers({ 'x-forwarded-for': '198.51.100.3' }) };

    // Off Vercel, getClientIp must ignore spoofed headers and fall back to safe default
    const ip1 = getClientIp(req1);
    const ip2 = getClientIp(req2);
    const ip3 = getClientIp(req3);

    assert.equal(ip1, '127.0.0.1');
    assert.equal(ip2, '127.0.0.1');
    assert.equal(ip3, '127.0.0.1');

    // Verify rate limit enforcement collapses all spoofed attempts into the single bucket
    const keyPrefix = 'test_spoof_attempt_' + Date.now();
    const limit = 2;

    const res1 = checkRateLimit(`${keyPrefix}:${ip1}`, limit, 60000);
    assert.equal(res1.allowed, true, 'First attempt allowed');

    const res2 = checkRateLimit(`${keyPrefix}:${ip2}`, limit, 60000);
    assert.equal(res2.allowed, true, 'Second attempt allowed');

    // Third attempt with different spoofed header MUST BE BLOCKED because both mapped to 127.0.0.1
    const res3 = checkRateLimit(`${keyPrefix}:${ip3}`, limit, 60000);
    assert.equal(res3.allowed, false, 'Third attempt with rotated header must be blocked');
    assert.equal(res3.remaining, 0);
  } finally {
    if (origVercel !== undefined) process.env.VERCEL = origVercel;
    if (origProxy !== undefined) process.env.TRUSTED_PROXY = origProxy;
  }
});

test('RL Step 1: On Vercel, first entry of x-forwarded-for is trusted', () => {
  const origVercel = process.env.VERCEL;

  try {
    process.env.VERCEL = '1';

    const reqWithMultiHop = {
      headers: new Headers({
        'x-forwarded-for': '203.0.113.42, 10.0.0.1, 172.16.0.2',
      }),
    };

    const ip = getClientIp(reqWithMultiHop);
    assert.equal(ip, '203.0.113.42', 'Must extract first entry on trusted Vercel proxy');

    const reqWithSingle = {
      headers: new Headers({
        'x-forwarded-for': '198.51.100.88',
      }),
    };

    const ipSingle = getClientIp(reqWithSingle);
    assert.equal(ipSingle, '198.51.100.88', 'Must extract single IP on Vercel');
  } finally {
    if (origVercel !== undefined) {
      process.env.VERCEL = origVercel;
    } else {
      delete process.env.VERCEL;
    }
  }
});
