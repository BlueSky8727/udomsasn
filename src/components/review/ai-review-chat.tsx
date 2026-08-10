'use client';

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import type { ReviewJob } from '@/constants/enterprise-data';
import { USER_ROLE, type UserRole } from '@/constants/workflow';
import { Icon } from '@/components/ui/icons';
import { SectionCard } from '@/components/ui/enterprise';

type ReviewResult = 'PASS' | 'NEEDS_WORK' | null;

type ChatMessage = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
};

type ChatResponse = {
  provider?: 'typhoon' | 'preview';
  answer?: string;
  error?: string;
  canChangeStatus?: false;
};

export function AiReviewChat({
  job,
  role,
  results,
  comments,
  summary,
}: {
  job: ReviewJob;
  role: UserRole;
  results: Record<string, ReviewResult>;
  comments: Record<string, string>;
  summary: string;
}) {
  const isAcademic = role === USER_ROLE.ACADEMIC_HEAD;
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'assistant',
      content: isAcademic
        ? 'สวัสดีค่ะ ฉันช่วยเทียบผลรอบกลุ่มสาระ สรุปจุดเสี่ยง และร่างคอมเมนต์ก่อนตัดสินขั้นสุดท้ายได้ ต้องการให้ช่วยตรวจส่วนไหนคะ?'
        : 'สวัสดีค่ะ ฉันช่วยไล่ตรวจตามหัวข้อ สรุปจุดเสี่ยง และร่างคอมเมนต์ส่งกลับอาจารย์ได้ ต้องการเริ่มจากส่วนไหนคะ?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<'typhoon' | 'preview' | null>(null);
  const nextId = useRef(2);
  const messageEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messageEnd.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (rawMessage: string) => {
    const content = rawMessage.trim();
    if (!content || loading) return;

    const userMessage: ChatMessage = { id: nextId.current++, role: 'user', content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          messages: nextMessages
            .slice(-12)
            .map(({ role: messageRole, content: messageContent }) => ({
              role: messageRole,
              content: messageContent,
            })),
          review: { results, comments, summary },
        }),
      });
      const payload = (await response.json()) as ChatResponse;
      if (!response.ok || !payload.answer) {
        throw new Error(payload.error || 'AI chat failed');
      }

      setProvider(payload.provider ?? 'typhoon');
      setMessages((current) => [
        ...current,
        { id: nextId.current++, role: 'assistant', content: payload.answer as string },
      ]);
    } catch {
      setError('ผู้ช่วย AI ยังตอบไม่ได้ กรุณาลองส่งคำถามอีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  };

  const suggestions = isAcademic
    ? ['เทียบผลรอบแรก', 'สรุปจุดเสี่ยง', 'ช่วยร่างคอมเมนต์']
    : ['ตรวจอะไรบ้าง', 'สรุปจุดเสี่ยง', 'ช่วยร่างคอมเมนต์'];

  return (
    <SectionCard
      title="ผู้ช่วยตรวจ AI"
      description="ถามตอบเกี่ยวกับสื่อชิ้นนี้ ช่วยวิเคราะห์และร่างข้อเสนอแนะได้"
    >
      <div className="mb-3 flex items-center gap-3 rounded-xl border border-brand/15 bg-brand/5 p-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-brand-contrast shadow-sm">
          <Icon name="sparkles" className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-xs font-bold">Typhoon AI</p>
            <span className="rounded-full bg-status-approved/10 px-2 py-0.5 text-[9px] font-semibold text-status-approved">
              พร้อมช่วยตรวจ
            </span>
            {provider === 'preview' && (
              <span className="rounded-full bg-status-pending/10 px-2 py-0.5 text-[9px] font-semibold text-status-pending">
                โหมดพรีวิว
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[10px] text-ink-faint">
            บริบท: {job.id} · {isAcademic ? 'รอบวิชาการ' : 'รอบกลุ่มสาระ'}
          </p>
        </div>
      </div>

      {isAcademic && (
        <details className="group mb-3 rounded-xl border border-line bg-surface/70">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-[11px] font-semibold text-ink-muted">
            <span className="grid size-6 place-items-center rounded-lg bg-status-approved/10 text-status-approved">
              <Icon name="check" className="size-3.5" />
            </span>
            <span className="flex-1">ผลตรวจรอบกลุ่มสาระ</span>
            <span className="text-[9px] font-normal text-ink-faint group-open:hidden">กดเพื่อดู</span>
            <Icon
              name="chevronRight"
              className="size-3.5 text-ink-faint transition-transform group-open:rotate-90"
            />
          </summary>
          <div className="space-y-1.5 border-t border-line px-3 py-2.5 text-[10px] leading-5 text-ink-muted">
            <p>✓ ตรวจครบทุกหัวข้อและไม่พบจุดที่ต้องแก้</p>
            <p>• ระบุแหล่งที่มาของภาพประกอบแล้ว</p>
            <p>• เสนอให้ปรับขนาดตัวอักษรหน้า 12 เพื่อให้อ่านง่ายขึ้น</p>
          </div>
        </details>
      )}

      <div className="mb-3 rounded-xl border border-status-pending/20 bg-status-pending/5 p-3">
        <div className="flex items-start gap-2">
          <Icon name="warning" className="mt-0.5 size-3.5 shrink-0 text-status-pending" />
          <div>
            <p className="text-[11px] font-bold text-status-pending">จุดที่ AI แนะนำให้ถามต่อ</p>
            <p className="mt-1 text-[10px] leading-5 text-ink-muted">
              ภาพหน้า 18 ควรยืนยันแหล่งที่มาและสิทธิ์การใช้
            </p>
          </div>
        </div>
      </div>

      <div
        aria-live="polite"
        className="max-h-[340px] min-h-52 space-y-3 overflow-y-auto rounded-xl border border-line bg-surface/70 p-3"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                <Icon name="sparkles" className="size-3.5" />
              </span>
            )}
            <p
              className={`max-w-[88%] whitespace-pre-wrap rounded-xl px-3 py-2 text-[11px] leading-5 ${
                message.role === 'user'
                  ? 'rounded-br-sm bg-brand text-brand-contrast'
                  : 'rounded-bl-sm border border-line bg-panel text-ink-muted'
              }`}
            >
              {message.content}
            </p>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-[10px] text-ink-faint">
            <span className="grid size-6 place-items-center rounded-lg bg-brand/10 text-brand">
              <Icon name="sparkles" className="size-3.5" />
            </span>
            <span>กำลังอ่านบริบทและช่วยตรวจ...</span>
          </div>
        )}
        <div ref={messageEnd} />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={loading}
            onClick={() => void sendMessage(suggestion)}
            className="rounded-full border border-line bg-surface px-2.5 py-1.5 text-[10px] font-medium text-ink-muted transition hover:border-brand/30 hover:text-brand disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-3">
        <div className="flex items-end gap-2 rounded-xl border border-line bg-surface p-2 focus-within:border-brand/50 focus-within:ring-4 focus-within:ring-brand/5">
          <textarea
            rows={2}
            maxLength={4_000}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="ถาม AI เกี่ยวกับสื่อชิ้นนี้..."
            aria-label="ข้อความถึงผู้ช่วยตรวจ AI"
            className="min-h-10 flex-1 resize-none bg-transparent px-1 py-1.5 text-xs outline-none placeholder:text-ink-faint disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="ส่งคำถามถึง AI"
            className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand text-brand-contrast transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="arrowUpRight" className="size-4" />
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="mt-2 text-[10px] leading-5 text-status-rejected">
          {error}
        </p>
      )}
      <p className="mt-2 flex items-start gap-1.5 text-[9px] leading-4 text-ink-faint">
        <Icon name="info" className="mt-0.5 size-3 shrink-0" />
        AI ช่วยตรวจและร่างคำตอบเท่านั้น ผู้ตรวจเป็นผู้ตัดสินและกดเปลี่ยนสถานะเองเสมอ
      </p>
    </SectionCard>
  );
}
