import type { Metadata } from 'next';
import './globals.css';
import { ViewerProvider } from '@/components/ui/viewer-context';
import { DEFAULT_THEME, THEME_STORAGE_KEY } from '@/constants/theme';
import { getViewer } from '@/lib/auth';

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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // อ่านครั้งเดียวที่นี่ (getViewer ถูก cache ต่อหนึ่ง request) แล้วส่งให้แถบบนใช้แสดงรูปโปรไฟล์
  const viewer = await getViewer();

  return (
    <html lang="th" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-screen bg-surface font-sans text-ink">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ViewerProvider
          viewer={
            viewer
              ? {
                  id: viewer.id,
                  name: viewer.name,
                  hasAvatar: Boolean(viewer.hasAvatar),
                  avatarVersion: viewer.updatedAt ?? '',
                }
              : null
          }
        >
          {children}
        </ViewerProvider>
      </body>
    </html>
  );
}
