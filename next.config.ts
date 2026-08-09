import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // กฎเหล็กข้อ 6: ไฟล์อยู่ใน private bucket เข้าถึงผ่าน signed URL ที่ออกจากฝั่งเซิร์ฟเวอร์เท่านั้น
  // จึงไม่เปิด remotePatterns ให้ next/image ดึงจาก storage โดยตรง
  images: {
    remotePatterns: [],
  },

  // ปิดปุ่มวงกลม N ของ Next devtools ที่มุมล่างซ้ายตอน dev
  // (ขึ้นเฉพาะตอน development ไม่ได้ติดไปกับ production build อยู่แล้ว)
  devIndicators: false,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'same-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
