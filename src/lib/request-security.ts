type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const globalForRateLimit = globalThis as typeof globalThis & {
  __udomsasnRateLimits?: Map<string, RateLimitEntry>;
};

const rateLimits =
  globalForRateLimit.__udomsasnRateLimits ??
  (globalForRateLimit.__udomsasnRateLimits = new Map<string, RateLimitEntry>());

export class RequestSecurityError extends Error {
  readonly status: 400 | 413;

  constructor(message: string, status: 400 | 413) {
    super(message);
    this.name = 'RequestSecurityError';
    this.status = status;
  }
}

/** ปฏิเสธคำขอ POST จากหน้าเว็บคนละ origin เพื่อลดความเสี่ยง CSRF */
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function requestAddress(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

/**
 * ตัวจำกัดคำขอแบบ best-effort ระหว่างที่ยังไม่มี rate-limit store ส่วนกลาง
 * เมื่อขึ้นหลาย instance ให้เปลี่ยน Map นี้เป็นบริการส่วนกลาง โดยคง API เดิมไว้
 */
export function takeRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const key = `${scope}:${requestAddress(request)}`;
  const current = rateLimits.get(key);

  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)),
    };
  }

  current.count += 1;

  if (rateLimits.size > 5_000) {
    for (const [entryKey, entry] of rateLimits) {
      if (entry.resetAt <= now) rateLimits.delete(entryKey);
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

/** อ่าน JSON แบบจำกัดจำนวนไบต์ ป้องกัน body ขนาดใหญ่กินหน่วยความจำเกินจำเป็น */
export async function readJsonBody(request: Request, maxBytes: number): Promise<unknown> {
  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new RequestSecurityError('ข้อมูลคำขอมีขนาดใหญ่เกินกำหนด', 413);
  }

  if (!request.body) throw new RequestSecurityError('ไม่พบข้อมูลคำขอ', 400);

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new RequestSecurityError('ข้อมูลคำขอมีขนาดใหญ่เกินกำหนด', 413);
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown;
  } catch {
    throw new RequestSecurityError('รูปแบบ JSON ไม่ถูกต้อง', 400);
  }
}
