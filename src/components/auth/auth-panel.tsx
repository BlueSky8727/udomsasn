// src/components/auth/auth-panel.tsx
'use client';

import { useState } from 'react';
import { ForgotPasswordForm } from './forgot-password-form';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';

/**
 * สลับระหว่างเข้าสู่ระบบกับสมัครสมาชิก
 *
 * หัวข้อของหน้าเปลี่ยนตามแท็บ จึงต้องอยู่ในคอมโพเนนต์เดียวกับตัวสลับแท็บ
 */

type Tab = 'login' | 'register';

const TABS: readonly { id: Tab; label: string }[] = [
  { id: 'login', label: 'เข้าสู่ระบบ' },
  { id: 'register', label: 'สมัครสมาชิก' },
];

const HEADINGS: Record<Tab | 'forgot', { eyebrow: string; title: string; description: string }> = {
  forgot: {
    eyebrow: 'Reset password',
    title: 'ลืมรหัสผ่าน',
    description: 'ขอรหัส 6 หลักทางอีเมลเพื่อตั้งรหัสผ่านใหม่',
  },
  login: {
    eyebrow: 'Welcome back',
    title: 'เข้าสู่ระบบ',
    description: 'ใช้บัญชีของหน่วยงานเพื่อเข้าใช้งานคลังสื่อการสอน',
  },
  register: {
    eyebrow: 'Create account',
    title: 'สมัครสมาชิก',
    description: 'สำหรับอาจารย์ที่ยังไม่มีบัญชี กรอกข้อมูลเพื่อขอเปิดใช้งาน',
  },
};

export function AuthPanel() {
  const [tab, setTab] = useState<Tab>('login');
  /** อีเมลที่เพิ่งยืนยันสำเร็จ ใช้เติมช่องอีเมลและขึ้นข้อความยืนยันในแท็บเข้าสู่ระบบ */
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  /** อีเมลที่เพิ่งตั้งรหัสผ่านใหม่สำเร็จ */
  const [resetEmail, setResetEmail] = useState<string | null>(null);
  /** อยู่ในขั้นตอนลืมรหัสผ่าน — เป็นโหมดย่อยของแท็บเข้าสู่ระบบ ไม่ใช่แท็บที่สาม */
  const [forgot, setForgot] = useState(false);
  const heading = forgot ? HEADINGS.forgot : HEADINGS[tab];

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
        {heading.eyebrow}
      </p>
      <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em]">{heading.title}</h2>
      <p className="mt-2 text-sm text-ink-muted">{heading.description}</p>

      <div role="tablist" aria-label="เข้าสู่ระบบหรือสมัครสมาชิก" className="mt-6 grid grid-cols-2 gap-1 rounded-xl border border-line bg-panel p-1">
        {TABS.map((item) => {
          const selected = tab === item.id && !forgot;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => {
                setTab(item.id);
                setForgot(false);
                setVerifiedEmail(null);
                setResetEmail(null);
              }}
              className={`h-10 rounded-lg text-sm font-semibold transition ${
                selected
                  ? 'bg-brand text-brand-contrast shadow-sm'
                  : 'text-ink-muted hover:bg-panel-hover'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {forgot ? (
        <ForgotPasswordForm
          onCancel={() => setForgot(false)}
          onDone={(email) => {
            setForgot(false);
            setVerifiedEmail(null);
            setResetEmail(email);
            setTab('login');
          }}
        />
      ) : tab === 'login' ? (
        <LoginForm
          verifiedEmail={verifiedEmail}
          resetEmail={resetEmail}
          onForgotPassword={() => {
            setForgot(true);
            setVerifiedEmail(null);
            setResetEmail(null);
          }}
        />
      ) : (
        <RegisterForm
          onSwitchToLogin={() => setTab('login')}
          onVerified={(email) => {
            setVerifiedEmail(email);
            setTab('login');
          }}
        />
      )}
    </>
  );
}
