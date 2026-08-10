// src/components/auth/register-form.tsx
'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Icon } from '@/components/ui/icons';
import { register, resendVerification, verifyCode } from '@/lib/auth-client';

/**
 * ฟอร์มสมัครสมาชิกสำหรับผู้ที่ยังไม่มีบัญชี
 *
 * สมัครแล้วยังเข้าใช้งานไม่ได้ทันที ต้องยืนยันอีเมลก่อน แล้วรอหัวหน้าวิชาการอนุมัติอีกชั้น
 * ผู้สมัครเลือกตำแหน่งเองไม่ได้ ทุกคนเริ่มที่ "อาจารย์" และฝั่งเซิร์ฟเวอร์เป็นผู้กำหนดจริง (กฎเหล็กข้อ 2)
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const MIN_PASSWORD_LENGTH = 8;

type FieldErrors = Partial<
  Record<'name' | 'email' | 'phone' | 'password' | 'confirmPassword' | 'avatar', string>
>;

const inputClass = (invalid: boolean) =>
  `mt-2 h-12 w-full rounded-xl border bg-panel px-4 text-sm outline-none transition focus:ring-4 disabled:opacity-60 ${
    invalid
      ? 'border-status-rejected/60 focus:border-status-rejected/60 focus:ring-status-rejected/10'
      : 'border-line focus:border-brand/45 focus:ring-brand/5'
  }`;

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-xs text-status-rejected">
      {message}
    </p>
  );
}

type RegisterFormProps = {
  onSwitchToLogin: () => void;
  /** เรียกเมื่อยืนยันอีเมลผ่านแล้ว เพื่อให้หน้าแม่สลับไปแท็บเข้าสู่ระบบพร้อมข้อความยืนยัน */
  onVerified: (email: string) => void;
};

export function RegisterForm({ onSwitchToLogin, onVerified }: RegisterFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatar, setAvatar] = useState<{ file: File; previewUrl: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(true);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  // เก็บ blob URL ล่าสุดไว้คืนหน่วยความจำตอนเปลี่ยนรูปหรือออกจากหน้า
  const previewUrlRef = useRef<string | null>(null);
  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  const pickAvatar = (file: File | undefined) => {
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) {
      setFieldErrors((prev) => ({ ...prev, avatar: 'รูปโปรไฟล์ต้องเป็น PNG, JPG หรือ WebP' }));
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setFieldErrors((prev) => ({ ...prev, avatar: 'รูปโปรไฟล์ต้องมีขนาดไม่เกิน 2MB' }));
      return;
    }
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setFieldErrors((prev) => ({ ...prev, avatar: undefined }));
    setAvatar({ file, previewUrl });
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (name.trim().length < 3) errors.name = 'กรอกชื่อ-นามสกุลให้ครบ';
    if (!email.trim()) errors.email = 'กรอกอีเมล';
    else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    const digits = phone.replace(/[^0-9]/g, '');
    if (!digits) errors.phone = 'กรอกเบอร์โทร';
    else if (digits.length < 9 || digits.length > 10) errors.phone = 'เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก';
    if (password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `รหัสผ่านต้องยาวอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`;
    }
    if (confirmPassword !== password) errors.confirmPassword = 'รหัสผ่านทั้งสองช่องไม่ตรงกัน';
    if (!avatar) errors.avatar = 'กรุณาเลือกรูปโปรไฟล์';
    return errors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    const errors = validate();
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean) || !avatar) return;

    setSubmitting(true);
    const result = await register({
      name: name.trim(),
      email: email.trim(),
      phone: phone.replace(/[^0-9]/g, ''),
      password,
      avatar: avatar.file,
    });
    setSubmitting(false);

    if (result.ok) {
      setRegisteredEmail(result.email);
      setEmailSent(result.emailSent);
      return;
    }
    setNotice(result.message);
  };

  const handleResend = async () => {
    if (!registeredEmail) return;
    setResendNotice(null);
    setCodeError(null);
    const result = await resendVerification(registeredEmail);
    setResendNotice(result.message);
    if (result.ok) setEmailSent(true);
  };

  const handleVerifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!registeredEmail || verifying) return;
    const digits = code.replace(/[^0-9]/g, '');
    if (digits.length !== 6) {
      setCodeError('กรอกรหัสยืนยัน 6 หลัก');
      return;
    }
    setCodeError(null);
    setVerifying(true);
    const result = await verifyCode(registeredEmail, digits);
    setVerifying(false);
    if (result.ok) {
      // ยืนยันผ่านแล้วพากลับไปฝั่งล็อกอินทันที จะได้ลองเข้าระบบต่อได้เลย
      onVerified(registeredEmail);
      return;
    }
    setCodeError(result.message);
  };

  if (registeredEmail) {
    return (
      <div className="mt-8">
        <div
          className={`rounded-2xl border p-6 text-center ${
            emailSent
              ? 'border-status-approved/30 bg-status-approved/8'
              : 'border-status-pending/30 bg-status-pending/10'
          }`}
        >
          <span
            className={`mx-auto grid size-14 place-items-center rounded-2xl ${
              emailSent
                ? 'bg-status-approved/15 text-status-approved'
                : 'bg-status-pending/15 text-status-pending'
            }`}
          >
            <Icon name={emailSent ? 'inbox' : 'warning'} className="size-6" />
          </span>
          <h3 className="mt-4 text-lg font-bold">
            {emailSent ? 'กรอกรหัสยืนยันจากอีเมล' : 'ส่งอีเมลยืนยันไม่สำเร็จ'}
          </h3>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            {emailSent ? (
              <>
                ระบบส่งรหัสยืนยัน 6 หลักไปที่ <strong className="text-ink">{registeredEmail}</strong> แล้ว
                รหัสมีอายุ 24 ชั่วโมง
              </>
            ) : (
              <>
                สมัครสมาชิกเรียบร้อยแล้ว แต่ส่งรหัสไปที่{' '}
                <strong className="text-ink">{registeredEmail}</strong> ไม่สำเร็จ
                กรุณากดส่งรหัสอีกครั้ง
              </>
            )}
          </p>
        </div>

        <form onSubmit={handleVerifyCode} noValidate className="mt-5">
          <label htmlFor="verify-code" className="block text-sm font-semibold">
            รหัสยืนยัน 6 หลัก
          </label>
          <input
            id="verify-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={7}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            disabled={verifying}
            autoFocus
            placeholder="000000"
            aria-invalid={Boolean(codeError)}
            aria-describedby={codeError ? 'verify-code-error' : undefined}
            className={`mt-2 h-14 w-full rounded-xl border bg-panel text-center text-2xl font-bold tracking-[0.5em] outline-none transition focus:ring-4 disabled:opacity-60 ${
              codeError
                ? 'border-status-rejected/60 focus:border-status-rejected/60 focus:ring-status-rejected/10'
                : 'border-line focus:border-brand/45 focus:ring-brand/5'
            }`}
          />
          <FieldError id="verify-code-error" message={codeError ?? undefined} />

          <button
            type="submit"
            disabled={verifying || code.length !== 6}
            className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-brand text-sm font-semibold text-brand-contrast shadow-lg shadow-brand/15 transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-45"
          >
            {verifying ? 'กำลังตรวจสอบรหัส...' : 'ยืนยันอีเมล'}
          </button>
        </form>

        {resendNotice && (
          <p role="status" className="mt-4 text-center text-xs leading-5 text-ink-muted">
            {resendNotice}
          </p>
        )}

        <button
          type="button"
          onClick={() => void handleResend()}
          className="mt-3 h-11 w-full rounded-xl border border-line bg-panel text-sm font-medium text-ink-muted transition hover:bg-panel-hover"
        >
          ไม่ได้รับอีเมล? ส่งรหัสใหม่อีกครั้ง
        </button>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="mt-2 h-11 w-full rounded-xl text-sm font-semibold text-brand transition hover:opacity-80"
        >
          กลับไปหน้าเข้าสู่ระบบ
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
      <fieldset disabled={submitting} className="space-y-5">
        <div>
          <span className="block text-sm font-semibold">รูปโปรไฟล์</span>
          <div className="mt-2 flex items-center gap-4">
            <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-panel text-ink-faint">
              {avatar ? (
                // ไฟล์อยู่ในเครื่องผู้ใช้ ยังไม่มี URL จากเซิร์ฟเวอร์ จึงใช้ img ตรง ๆ
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar.previewUrl} alt="ตัวอย่างรูปโปรไฟล์" className="size-full object-cover" />
              ) : (
                <Icon name="image" className="size-6" />
              )}
            </span>
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-panel px-4 text-xs font-semibold transition hover:bg-panel-hover"
              >
                <Icon name="cloudUpload" className="size-4" />
                {avatar ? 'เปลี่ยนรูป' : 'เลือกรูป'}
              </button>
              <p className="mt-1.5 truncate text-[11px] text-ink-faint">
                {avatar ? avatar.file.name : 'PNG, JPG หรือ WebP ขนาดไม่เกิน 2MB'}
              </p>
            </div>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => pickAvatar(event.target.files?.[0])}
            className="sr-only"
            aria-invalid={Boolean(fieldErrors.avatar)}
            aria-describedby={fieldErrors.avatar ? 'avatar-error' : undefined}
          />
          <FieldError id="avatar-error" message={fieldErrors.avatar} />
        </div>

        <div>
          <label htmlFor="register-name" className="block text-sm font-semibold">
            ชื่อ-นามสกุล
          </label>
          <input
            id="register-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            placeholder="เช่น อ.สมชาย ใจดี"
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? 'register-name-error' : undefined}
            className={inputClass(Boolean(fieldErrors.name))}
          />
          <FieldError id="register-name-error" message={fieldErrors.name} />
        </div>

        <div>
          <label htmlFor="register-email" className="block text-sm font-semibold">
            อีเมล
          </label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="name@udomsasn.ac.th"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
            className={inputClass(Boolean(fieldErrors.email))}
          />
          <FieldError id="register-email-error" message={fieldErrors.email} />
        </div>

        <div>
          <label htmlFor="register-phone" className="block text-sm font-semibold">
            เบอร์โทร
          </label>
          <input
            id="register-phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            autoComplete="tel"
            placeholder="0812345678"
            aria-invalid={Boolean(fieldErrors.phone)}
            aria-describedby={fieldErrors.phone ? 'register-phone-error' : undefined}
            className={inputClass(Boolean(fieldErrors.phone))}
          />
          <FieldError id="register-phone-error" message={fieldErrors.phone} />
        </div>

        <div>
          <label htmlFor="register-password" className="block text-sm font-semibold">
            รหัสผ่าน
          </label>
          <div className="relative">
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="อย่างน้อย 8 ตัวอักษร"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'register-password-error' : undefined}
              className={`${inputClass(Boolean(fieldErrors.password))} pr-12`}
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
          <FieldError id="register-password-error" message={fieldErrors.password} />
        </div>

        <div>
          <label htmlFor="register-confirm" className="block text-sm font-semibold">
            ยืนยันรหัสผ่าน
          </label>
          <input
            id="register-confirm"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="พิมพ์รหัสผ่านอีกครั้ง"
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
            aria-describedby={fieldErrors.confirmPassword ? 'register-confirm-error' : undefined}
            className={inputClass(Boolean(fieldErrors.confirmPassword))}
          />
          <FieldError id="register-confirm-error" message={fieldErrors.confirmPassword} />
        </div>
      </fieldset>

      {notice && (
        <div
          role="alert"
          className="flex gap-2.5 rounded-xl border border-status-rejected/30 bg-status-rejected/8 p-3.5 text-xs leading-5 text-ink-muted"
        >
          <Icon name="warning" className="mt-0.5 size-4 shrink-0 text-status-rejected" />
          <span>{notice}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-brand-contrast shadow-lg shadow-brand/15 transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
      </button>

      <p className="rounded-xl border border-line bg-panel p-4 text-xs leading-5 text-ink-faint">
        เมื่อสมัครแล้วระบบจะส่งลิงก์ยืนยันไปที่อีเมลของคุณ หลังยืนยันอีเมลแล้ว
        หัวหน้าวิชาการจะเป็นผู้กำหนดตำแหน่งและเปิดใช้งานบัญชีให้อีกครั้ง
      </p>
    </form>
  );
}
