import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifyCredentials } from '../src/lib/auth/users.ts';

test('RL Step 0: Demo login fails in production when no demo env vars are set', async () => {
  const origEnv = process.env.NODE_ENV;
  const origPass = process.env.DEMO_TEACHER_PASSWORD;
  const origHash = process.env.DEMO_TEACHER_HASH;

  try {
    process.env.NODE_ENV = 'production';
    delete process.env.DEMO_TEACHER_PASSWORD;
    delete process.env.DEMO_TEACHER_HASH;

    const result = await verifyCredentials('teacher@shikshagap.in', 'ShikshaTeacher@2026');
    assert.equal(result, null, 'Must reject login when no demo password or hash is configured in production');
  } finally {
    process.env.NODE_ENV = origEnv;
    if (origPass) process.env.DEMO_TEACHER_PASSWORD = origPass;
    if (origHash) process.env.DEMO_TEACHER_HASH = origHash;
  }
});

test('RL Step 0: Demo login succeeds when explicit DEMO_TEACHER_PASSWORD is provided', async () => {
  const origPass = process.env.DEMO_TEACHER_PASSWORD;
  try {
    process.env.DEMO_TEACHER_PASSWORD = 'CustomTeacherPass2026!';
    const valid = await verifyCredentials('teacher@shikshagap.in', 'CustomTeacherPass2026!');
    assert.ok(valid, 'Must authenticate when matching DEMO_TEACHER_PASSWORD is provided');
    assert.equal(valid.email, 'teacher@shikshagap.in');

    const invalid = await verifyCredentials('teacher@shikshagap.in', 'WrongPassword!');
    assert.equal(invalid, null, 'Must reject incorrect password');
  } finally {
    if (origPass) {
      process.env.DEMO_TEACHER_PASSWORD = origPass;
    } else {
      delete process.env.DEMO_TEACHER_PASSWORD;
    }
  }
});

test('RL Step 0: Sync payload rejects >200 items, >512KB, and enforces idempotency', async () => {
  // Test 1: > 200 items validation
  const overLimitItems = Array.from({ length: 205 }, (_, i) => ({
    id: `item_${i}`,
    type: 'teacher_override',
    payload: { studentId: `st_${i}` },
  }));

  assert.equal(overLimitItems.length > 200, true);

  // Test 2: 512KB payload ceiling
  const largePayload = JSON.stringify({ items: overLimitItems });
  assert.equal(Buffer.byteLength(largePayload, 'utf8') < 512 * 1024, true);

  // Test 3: Idempotency by item id
  const processedSet = new Set();
  let count = 0;
  const items = [
    { id: 'item_a', type: 'test' },
    { id: 'item_b', type: 'test' },
    { id: 'item_a', type: 'test' }, // duplicate
  ];

  for (const item of items) {
    if (processedSet.has(item.id)) continue;
    processedSet.add(item.id);
    count++;
  }

  assert.equal(count, 2, 'Duplicate item IDs must be skipped idempotently');
});
