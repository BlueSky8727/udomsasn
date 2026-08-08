// src/components/auth/login-form.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Icon } from '@/components/ui/icons';
import { DEV_LOGIN_ENABLED, signIn, type Credentials } from '@/lib/auth-client';
import { ROLE_LABELS, USER_ROLE, type UserRole } from '@/constants/workflow';

/**
 * ฟอร์มเข้าสู่ระบบ
 *
 * ฟอร์มตรวจข้อมูลครบทุกอย่างตามปกติแล้วส่งต่อให้ signIn() ตัดสิน
 * ตัวฟอร์มไม่รู้และไม่ควรรู้ว่าเบื้องหลังเป็นของจริงหรือทางลัดระหว่างพัฒนา
 *
 * ระหว่างที่ยังเปิดโหมดชั่วคราวอยู่ ต้องขึ้นป้ายเตือนให้เห็นชัดเสมอ
 * เพราะหน้าตาเหมือนล็อกอินจริงทุกอย่าง แต่ไม่ได้ตรวจรหัสผ่านเลย
 */

type FieldErrors = { email?: string; password?: string };

/** พอเป็นรูปแบบอีเมลก็พอ ความถูกต้องจริงตัดสินที่ฝั่งเซิร์ฟเวอร์ตอนล็อกอิน */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LOGIN_ROLES: readonly {
  role: UserRole;
  description: string;
  icon: 'book' | 'layers' | 'shield';
}[] = [
  {
    role: USER_ROLE.TEACHER,
    description: 'สร้าง ส่ง และติดตามสื่อ',
    icon: 'book',
  },
  {
    role: USER_ROLE.REVIEWER,
    description: 'ตรวจสื่อของกลุ่มสาระ',
    icon: 'layers',
  },
  {
    role: USER_ROLE.ADMIN,
    description: 'ตรวจขั้นสุดท้ายและจัดการบทบาท',
    icon: 'shield',
  },
];

const validate = ({ email, password }: Credentials): FieldErrors => {
  const errors: FieldErrors = {};
  if (!email) errors.email = 'กรอกอีเมล';
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
  if (!password) errors.password = 'กรอกรหัสผ่าน';
  return errors;
};

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(USER_ROLE.TEACHER);
  const [showPassword, setShowPassword] = useState(false);
  /** ตอนเชื่อมจริงค่านี้จะไปกำหนดว่า session อยู่ถาวรหรือหมดอายุเมื่อปิดเบราว์เซอร์ */
  const [remember, setRemember] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    const credentials: Credentials = { email: email.trim(), password };
    const errors = validate(credentials);
    setFieldErrors(errors);
    if (errors.email || errors.password) return;

    setSubmitting(true);
    const result = await signIn(credentials, { role: selectedRole, remember });
    setSubmitting(false);

    if (result.ok) {
      // ต้อง refresh ก่อน เพื่อให้ server component อ่าน session ใหม่แทนของที่ cache ไว้
      router.refresh();
      router.push('/');
      return;
    }
    setNotice(result.message);
  };

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        <fieldset disabled={submitting}>
          <legend className="text-sm font-semibold">เลือกหน้าที่ต้องการเข้า</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {LOGIN_ROLES.map((item) => {
              const selected = selectedRole === item.role;
              return (
                <label
                  key={item.role}
                  className={`relative flex cursor-pointer gap-3 rounded-xl border p-3 transition sm:min-h-32 sm:flex-col ${
                    selected
                      ? 'border-brand bg-brand/8 text-brand shadow-sm'
                      : 'border-line bg-panel text-ink-muted hover:border-brand/30 hover:bg-panel-hover'
                  } ${submitting ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  <input
                    type="radio"
                    name="login-role"
                    value={item.role}
                    checked={selected}
                    onChange={() => setSelectedRole(item.role)}
                    className="sr-only"
                  />
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-lg ${
                      selected ? 'bg-brand text-brand-contrast' : 'bg-surface text-ink-faint'
                    }`}
                  >
                    <Icon name={item.icon} className="size-[18px]" />
                  </span>
                  <span>
                    <strong className={`block text-xs font-semibold ${selected ? 'text-brand' : 'text-ink'}`}>
                      {ROLE_LABELS[item.role]}
                    </strong>
                    <span className="mt-1 block text-[11px] leading-4 text-ink-faint">
                      {item.description}
                    </span>
                  </span>
                  {selected && (
                    <span className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-brand text-brand-contrast">
                      <Icon name="check" className="size-3" />
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold">
            อีเมล
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            autoFocus
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            placeholder="name@udomsasn.ac.th"
            className={`mt-2 h-12 w-full rounded-xl border bg-panel px-4 text-sm outline-none transition focus:ring-4 disabled:opacity-60 ${
              fieldErrors.email
                ? 'border-status-rejected/60 focus:border-status-rejected/60 focus:ring-status-rejected/10'
                : 'border-line focus:border-brand/45 focus:ring-brand/5'
            }`}
          />
          {fieldErrors.email && (
            <p id="email-error" className="mt-1.5 text-xs text-status-rejected">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-semibold">
              รหัสผ่าน
            </label>
            <button
              type="button"
              onClick={() =>
                setNotice(
                  'ระบบตั้งรหัสผ่านใหม่จะเปิดใช้พร้อมกับการเชื่อมระบบยืนยันตัวตน ระหว่างนี้ติดต่อผู้ดูแลระบบ',
                )
              }
              className="text-xs font-medium text-brand transition-opacity hover:opacity-80"
            >
              ลืมรหัสผ่าน?
            </button>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              placeholder="••••••••"
              className={`mt-2 h-12 w-full rounded-xl border bg-panel pl-4 pr-12 text-sm outline-none transition focus:ring-4 disabled:opacity-60 ${
                fieldErrors.password
                  ? 'border-status-rejected/60 focus:border-status-rejected/60 focus:ring-status-rejected/10'
                  : 'border-line focus:border-brand/45 focus:ring-brand/5'
              }`}
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
          {fieldErrors.password && (
            <p id="password-error" className="mt-1.5 text-xs text-status-rejected">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <label className="flex items-center gap-2 text-xs text-ink-muted">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            disabled={submitting}
            className="size-4 accent-[var(--brand)]"
          />
          จดจำการเข้าสู่ระบบบนอุปกรณ์นี้
        </label>

        {notice && (
          <div
            role="alert"
            className="flex gap-2.5 rounded-xl border border-status-pending/30 bg-status-pending/10 p-3.5 text-xs leading-5 text-ink-muted"
          >
            <Icon name="warning" className="mt-0.5 size-4 shrink-0 text-status-pending" />
            <span>{notice}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-brand-contrast shadow-lg shadow-brand/15 transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'กำลังตรวจสอบ...' : `เข้าสู่ระบบเป็น${ROLE_LABELS[selectedRole]}`}
        </button>
      </form>

      {DEV_LOGIN_ENABLED ? (
        <div className="mt-7 flex gap-2.5 rounded-xl border border-status-rejected/30 bg-status-rejected/8 p-4">
          <Icon name="warning" className="mt-0.5 size-4 shrink-0 text-status-rejected" />
          <p className="text-xs leading-5 text-ink-muted">
            <strong className="font-semibold text-ink">โหมดชั่วคราวระหว่างพัฒนา</strong> — กรอกอีเมล
            กับรหัสผ่านอะไรก็เข้าได้ ยังไม่มีการยืนยันตัวตนจริง ห้ามใช้กับข้อมูลจริง
            ต้องปิดก่อนเปิดใช้งานจริงเสมอ
          </p>
        </div>
      ) : (
        <div className="mt-7 rounded-xl border border-line bg-panel p-4">
          <p className="text-xs leading-5 text-ink-faint">
            หน้านี้พร้อมใช้งานแล้วแต่ยังไม่ได้ต่อกับระบบยืนยันตัวตน เมื่อเชื่อม Supabase Auth แล้ว
            จะตรวจบทบาทจากตาราง profiles ฝั่งเซิร์ฟเวอร์ทุกครั้ง
          </p>
        </div>
      )}
    </>
  );
}
