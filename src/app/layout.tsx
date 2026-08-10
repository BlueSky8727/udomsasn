import type { Metadata } from 'next';
import './globals.css';
import { DEFAULT_THEME, THEME_STORAGE_KEY } from '@/constants/theme';

export const metadata: Metadata = {
  title: 'คลังสื่อการสอน',
  description: 'คลังสื่อการสอนที่ผ่านการตรวจอนุมัติ สำหรับอาจารย์นำไปใช้สอนต่อได้',
  robots: {
    // คลังภายใน ไม่ต้องให้ search engine เข้ามาเก็บ
    index: false,
    follow: false,
  },
};

/**
 * กำหนดธีมก่อนหน้าจอวาดครั้งแรก ไม่งั้นจะเห็นจอขาวแวบหนึ่งก่อนเปลี่ยนเป็นมืด
 * ต้องเป็นสคริปต์ซิงโครนัสที่รันก่อนเนื้อหา จึงใช้ dangerouslySetInnerHTML
 * เนื้อหาสคริปต์เป็นข้อความคงที่ที่เราเขียนเอง ไม่มีค่าจากผู้ใช้ปนเข้ามา
 */
const themeScript = `
(function () {
  try {
    var saved = localStorage.getItem('${THEME_STORAGE_KEY}');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme =
      saved === 'dark' || saved === 'light' ? saved : prefersDark ? 'dark' : 'light';
  } catch (e) {
    document.documentElement.dataset.theme = '${DEFAULT_THEME}';
  }
})();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className="min-h-screen bg-surface font-sans text-ink">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}
