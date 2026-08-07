// src/app/api/ai/review/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { screenWithTyphoon } from '@/lib/ai/typhoon';
const Body = z.object({
  title: z.string().min(1).max(300),
  metadata: z.string().max(20000),
  extractedText: z.string().min(1).max(60000),
});
export async function POST(request: Request) {
  try {
    const body = Body.parse(await request.json());
    const result = await screenWithTyphoon(body);
    return NextResponse.json({ provider: 'typhoon', result, canChangeStatus: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI review failed';
    return NextResponse.json(
      { error: message },
      { status: error instanceof z.ZodError ? 400 : 500 },
    );
  }
}
