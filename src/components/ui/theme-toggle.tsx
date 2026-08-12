'use client';

import { useSyncExternalStore } from 'react';
import { DEFAULT_THEME, THEME_STORAGE_KEY, type Theme } from '@/constants/theme';

/**
 * ปุ่มสลับธีมสว่าง/มืด
 *
 * แหล่งความจริงของธีมคือแอตทริบิวต์ data-theme บน <html> ไม่ใช่ state ในคอมโพเนนต์
 * จึงอ่านด้วย useSyncExternalStore เพื่อให้ทุกที่ในหน้าเห็นค่าตรงกันเสมอ
 *
 * ค่าที่ผู้ใช้เลือกเก็บใน localStorage ถ้ายังไม่เคยเลือกจะตามการตั้งค่าของเครื่อง
 * การกำหนดธีมครั้งแรกทำโดยสคริปต์ใน layout ก่อนหน้าจอวาด เพื่อไม่ให้จอกะพริบ
 */

const applyTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;
};

const readStoredTheme = (): Theme | null => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'dark' || saved === 'light' ? saved : null;
  } catch {
    return null;
  }
};

function subscribe(onStoreChange: () => void): () => void {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  // ถ้าผู้ใช้ยังไม่เคยเลือกเอง ให้ตามการตั้งค่าของเครื่องที่เปลี่ยนระหว่างใช้งาน
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const onMediaChange = (e: MediaQueryListEvent) => {
    if (readStoredTheme()) return;
    applyTheme(e.matches ? 'dark' : 'light');
  };
  media.addEventListener('change', onMediaChange);

  return () => {
    observer.disconnect();
    media.removeEventListener('change', onMediaChange);
  };
}

const getSnapshot = (): Theme =>
  document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

/** ตอนเรนเดอร์ฝั่งเซิร์ฟเวอร์ยังไม่รู้ธีมจริง ใช้ค่าเริ่มต้นไปก่อนแล้วค่อยอ่านของจริงหลัง hydrate */
const getServerSnapshot = (): Theme => DEFAULT_THEME;

export function ThemeToggle({ variant = 'default' }: { variant?: 'default' | 'sidebar' }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const goingDark = theme === 'light';
  const label = goingDark ? 'ธีมมืด' : 'ธีมสว่าง';

  const toggle = () => {
    const next: Theme = goingDark ? 'dark' : 'light';
    applyTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // โหมดส่วนตัวบางเบราว์เซอร์เขียนไม่ได้ ธีมยังเปลี่ยนได้ในรอบนี้ก็พอ
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`เปลี่ยนเป็น${label}`}
      title={`เปลี่ยนเป็น${label}`}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
        variant === 'sidebar'
          ? 'text-white/70 hover:bg-white/10 hover:text-white'
          : 'text-ink-muted hover:bg-panel hover:text-ink'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-[18px] shrink-0"
        aria-hidden
      >
        {goingDark ? (
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
          </>
        )}
      </svg>
      <span suppressHydrationWarning>{label}</span>
    </button>
  );
}
