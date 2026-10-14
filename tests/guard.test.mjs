import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  guardRequest,
  recordIdempotentResponse,
  applyTemporaryBlock,
  resetGuardStore,
} from '../src/lib/server/guard.ts';

test('RL Step 2 Guard: Allows requests up to burst capacity and decrements remaining tokens', async () => {
  resetGuardStore();

  const req = new Request('https://shikshagap.in/api/assessment/agent', {
    method: 'POST',
    headers: {
      'x-session-id': 'sess_learner_burst_test_1',
    },
  });

  // First request should pass and show capacity
  const res1 = await guardRequest(req, { route: '/api/assessment/agent' });
  assert.equal(res1.ok, true);
  assert.equal(res1.headers['RateLimit-Limit'], '40');
  assert.equal(res1.headers['RateLimit-Remaining'], '39');

  // Second request decrements
  const res2 = await guardRequest(req, { route: '/api/assessment/agent' });
  assert.equal(res2.ok, true);
  assert.equal(res2.headers['RateLimit-Remaining'], '38');
});

test('RL Step 2 Guard: Returns 429 and standard RFC 6585 headers when capacity is exhausted', async () => {
  resetGuardStore();

  const req = new Request('https://shikshagap.in/api/pilot-register', {
    method: 'POST',
    headers: {
      'x-session-id': 'sess_pilot_burst_test',
    },
  });

  // /api/pilot-register has burst capacity of 3
  const r1 = await guardRequest(req, { route: '/api/pilot-register' });
  const r2 = await guardRequest(req, { route: '/api/pilot-register' });
  const r3 = await guardRequest(req, { route: '/api/pilot-register' });
  assert.equal(r1.ok, true);
  assert.equal(r2.ok, true);
  assert.equal(r3.ok, true);

  // 4th request must fail with 429
  const r4 = await guardRequest(req, { route: '/api/pilot-register' });
  assert.equal(r4.ok, false);
  if (!r4.ok) {
    assert.equal(r4.status, 429);
    assert.ok(r4.headers['Retry-After']);
    assert.equal(r4.headers['RateLimit-Remaining'], '0');
    assert.ok(r4.body.error);
    assert.ok(r4.body.retryAfterSeconds >= 1);
  }
});

test('RL Step 2 Guard: School-Safe isolation - multiple student sessions on shared IP have independent buckets', async () => {
  resetGuardStore();

  // Student A in classroom lab
  const reqStudentA = new Request('https://shikshagap.in/api/assessment/finish', {
    method: 'POST',
    headers: { 'x-session-id': 'student_session_desk_01' },
  });

  // Student B on the same lab network (same IP fallback)
  const reqStudentB = new Request('https://shikshagap.in/api/assessment/finish', {
    method: 'POST',
    headers: { 'x-session-id': 'student_session_desk_02' },
  });

  // Exhaust Student A's finish capacity (capacity 10)
  for (let i = 0; i < 10; i++) {
    const res = await guardRequest(reqStudentA, { route: '/api/assessment/finish' });
    assert.equal(res.ok, true);
  }
  const overA = await guardRequest(reqStudentA, { route: '/api/assessment/finish' });
  assert.equal(overA.ok, false, 'Student A should be rate limited after exceeding their session quota');

  // Student B on the same IP MUST NOT be locked out
  const resB = await guardRequest(reqStudentB, { route: '/api/assessment/finish' });
  assert.equal(resB.ok, true, 'Student B on the same school IP must have their own independent quota');
});

test('RL Step 2 Guard: Idempotency-Key returns cached response with replay header', async () => {
  resetGuardStore();

  const idempotencyKey = 'idem_key_' + Date.now();
  recordIdempotentResponse(idempotencyKey, {
    status: 200,
    body: { success: true, processedCount: 5 },
    headers: { 'X-Custom-Test': 'sample' },
  });

  const req = new Request('https://shikshagap.in/api/sync', {
    method: 'POST',
    headers: {
      'idempotency-key': idempotencyKey,
    },
  });

  const result = await guardRequest(req, {
    route: '/api/sync',
    idempotencyKey,
  });

  assert.equal(result.ok, true);
  assert.equal(result.headers['X-Idempotent-Replay'], 'true');
  assert.equal(result.headers['X-Custom-Test'], 'sample');
});

test('RL Step 2 Guard: Active temporary blocks return 403 with policy explanation', async () => {
  resetGuardStore();

  const attackerKey = 'attacker_token_suspicious_123';
  applyTemporaryBlock(`/api/auth/login:sess:${attackerKey}`, 300, 'credential_stuffing_attempt');

  const req = new Request('https://shikshagap.in/api/auth/login', {
    method: 'POST',
    headers: {
      'x-session-id': attackerKey,
    },
  });

  const result = await guardRequest(req, { route: '/api/auth/login' });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 403);
    assert.equal(result.body.messageKey, 'rateLimit.temporaryBlock');
    assert.ok(result.body.retryAfterSeconds > 0);
  }
});
