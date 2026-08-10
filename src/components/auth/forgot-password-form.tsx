// src/components/auth/forgot-password-form.tsx
'use client';

import { useState, type FormEvent } from 'react';
import { Icon } from '@/components/ui/icons';
import { forgotPassword, resetPassword } from '@/lib/auth-client';

/**
 * ตั้งรหัสผ่านใหม่ด้วยรหัส 6 หลักที่ส่งไปทางอีเมล
 *
 * สองขั้นตอน: กรอกอีเมลเพื่อขอรหัส แล้วกรอกรหัสพร้อมรหัสผ่านใหม่
 * ขั้นแรกตอบข้อความเดียวกันเสมอไม่ว่าอีเมลจะมีในระบบหรือไม่ (ฝั่งเซิร์ฟเวอร์เป็นคนกำหนด)
 * จะได้ไม่ถูกใช้ไล่เช็คว่ามีใครใช้ระบบนี้บ้าง
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const inputClass = (invalid: boolean) =>
  `mt-2 h-12 w-full rounded-xl border bg-panel px-4 text-sm outline-none transition focus:ring-4 disabled:opacity-60 ${
    invalid
      ? 'border-status-rejected/60 focus:border-status-rejected/60 focus:ring-status-rejected/10'
      : 'border-line focus:border-brand/45 focus:ring-brand/5'
  }`;

type Props = {
  onCancel: () => void;
  /** เรียกเมื่อตั้งรหัสผ่านใหม่สำเร็จ เพื่อกลับไปแท็บเข้าสู่ระบบพร้อมข้อความยืนยัน */
  onDone: (email: string) => void;
};

export function ForgotPasswordForm({ onCancel, onDone }: Props) {
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const requestCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const value = email.trim();
    if (!EMAIL_PATTERN.test(value)) {
      setError('รูปแบบอีเมลไม่ถูกต้อง');
      return;
    }
    setError(null);
    setBusy(true);
    const result = await forgotPassword(value);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setNotice(result.message);
    setStep('reset');
  };

  const submitReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const digits = code.replace(/[^0-9]/g, '');
    if (digits.length !== 6) {
      setError('กรอกรหัสยืนยัน 6 หลัก');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`รหัสผ่านใหม่ต้องยาวอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`);
      return;
    }
    if (password !== confirmPassword) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
      return;
    }
    setError(null);
    setBusy(true);
    const result = await resetPassword(email.trim(), digits, password);
    setBusy(false);
    if (result.ok) {
      onDone(email.trim());
      return;
    }
    setError(result.message);
  };

  const resend = async () => {
    setError(null);
    const result = await forgotPassword(email.trim());
    setNotice(result.message);
  };

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={onCancel}
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted transition hover:text-ink"
      >
        <Icon name="chevronRight" className="size-3.5 rotate-180" />
        กลับไปหน้าเข้าสู่ระบบ
      </button>

      {step === 'email' ? (
        <form onSubmit={requestCode} noValidate className="space-y-5">
          <p className="rounded-xl border border-line bg-panel p-4 text-xs leading-5 text-ink-faint">
            กรอกอีเมลที่ใช้สมัคร ระบบจะส่งรหัส 6 หลักไปให้ นำมากรอกเพื่อตั้งรหัสผ่านใหม่
          </p>
          <div>
            <label htmlFor="forgot-email" className="block text-sm font-semibold">
              อีเมล
            </label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              autoFocus
              disabled={busy}
              placeholder="name@udomsasn.ac.th"
              aria-invalid={Boolean(error)}
              className={inputClass(Boolean(error))}
            />
          </div>

          {error && (
            <p role="alert" className="text-xs text-status-rejected">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-brand text-sm font-semibold text-brand-contrast shadow-lg shadow-brand/15 transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'กำลังส่งรหัส...' : 'ส่งรหัสไปที่อีเมล'}
          </button>
        </form>
      ) : (
        <form onSubmit={submitReset} noValidate className="space-y-5">
          {notice && (
            <p
              role="status"
              className="rounded-xl border border-status-approved/30 bg-status-approved/8 p-3.5 text-xs leading-5 text-ink-muted"
            >
              {notice} รหัสมีอายุ 30 นาที
            </p>
          )}

          <div>
            <label htmlFor="reset-code" className="block text-sm font-semibold">
              รหัสยืนยัน 6 หลัก
            </label>
            <input
              id="reset-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              disabled={busy}
              autoFocus
              placeholder="000000"
              className={`mt-2 h-14 w-full rounded-xl border bg-panel text-center text-2xl font-bold tracking-[0.5em] outline-none transition focus:ring-4 disabled:opacity-60 ${
                error
                  ? 'border-status-rejected/60 focus:border-status-rejected/60 focus:ring-status-rejected/10'
                  : 'border-line focus:border-brand/45 focus:ring-brand/5'
              }`}
            />
          </div>

          <div>
            <label htmlFor="reset-password" className="block text-sm font-semibold">
              รหัสผ่านใหม่
            </label>
            <div className="relative">
              <input
                id="reset-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                disabled={busy}
                placeholder="อย่างน้อย 8 ตัวอักษร"
                className={`${inputClass(false)} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                aria-pressed={showPassword}
                className={`absolute right-2 top-2 grid size-8 place-items-center rounded-lg transition-colors hover:bg-surface ${
                  showPassword ? 'text-brand' : 'text-ink-faint'
                }`}
              >
                <Icon name="eye" className="size-4" />
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="reset-confirm" className="block text-sm font-semibold">
              ยืนยันรหัสผ่านใหม่
            </label>
            <input
              id="reset-confirm"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              disabled={busy}
              placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง"
              className={inputClass(false)}
            />
          </div>

          {error && (
            <p role="alert" className="text-xs text-status-rejected">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-brand text-sm font-semibold text-brand-contrast shadow-lg shadow-brand/15 transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'กำลังตั้งรหัสผ่านใหม่...' : 'ตั้งรหัสผ่านใหม่'}
          </button>

          <button
            type="button"
            onClick={() => void resend()}
            disabled={busy}
            className="h-11 w-full rounded-xl border border-line bg-panel text-sm font-medium text-ink-muted transition hover:bg-panel-hover disabled:opacity-60"
          >
            ไม่ได้รับอีเมล? ส่งรหัสใหม่อีกครั้ง
          </button>
        </form>
      )}
    </div>
  );
}
