import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isSameOriginRequest,
  readJsonBody,
  RequestSecurityError,
  takeRateLimit,
} from '../src/lib/request-security.ts';

test('รับ JSON ที่อยู่ภายในขนาดกำหนด', async () => {
  const request = new Request('https://example.test/api', {
    method: 'POST',
    body: JSON.stringify({ ok: true }),
  });
  assert.deepEqual(await readJsonBody(request, 1_024), { ok: true });
});

test('ปฏิเสธ request body ที่ใหญ่เกินกำหนด', async () => {
  const request = new Request('https://example.test/api', {
    method: 'POST',
    body: JSON.stringify({ text: 'x'.repeat(200) }),
  });
  await assert.rejects(
    () => readJsonBody(request, 64),
    (error) => error instanceof RequestSecurityError && error.status === 413,
  );
});

test('ปฏิเสธ origin ที่ไม่ตรงกับระบบ', () => {
  const trusted = new Request('https://example.test/api', {
    headers: { origin: 'https://example.test' },
  });
  const untrusted = new Request('https://example.test/api', {
    headers: { origin: 'https://attacker.test' },
  });
  assert.equal(isSameOriginRequest(trusted), true);
  assert.equal(isSameOriginRequest(untrusted), false);
});

test('จำกัดจำนวนคำขอตามช่วงเวลา', () => {
  const scope = `test-${Date.now()}`;
  const request = new Request('https://example.test/api', {
    headers: { 'x-real-ip': '192.0.2.10' },
  });
  assert.equal(takeRateLimit(request, scope, 2, 60_000).allowed, true);
  assert.equal(takeRateLimit(request, scope, 2, 60_000).allowed, true);
  assert.equal(takeRateLimit(request, scope, 2, 60_000).allowed, false);
});
