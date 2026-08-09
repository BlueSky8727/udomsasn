# Udomsasn — Prisma Backend

Frontend เดิมใช้ Next.js 16 และเคยเตรียม Supabase ไว้ แต่ auth/data หลักยังเป็น preview/mock. ชุดนี้เพิ่ม `backend/` เป็น NestJS + Prisma + PostgreSQL และเปลี่ยน auth กับหน้าคลัง/คิวตรวจให้เรียก backend จริง

## 1) สร้างฐานข้อมูล PostgreSQL
สร้าง DB ชื่อ `udomsasn` แล้วคัดลอก `backend/.env.example` เป็น `backend/.env` และแก้ `DATABASE_URL`

## 2) Backend
```bash
cd backend
npm install
npm run db:setup
npm run dev
```
API: `http://localhost:4000/api`

บัญชี seed (รหัสผ่านเดียวกัน `Udomsasn@2026`):
- teacher@udomsasn.ac.th
- reviewer@udomsasn.ac.th
- admin@udomsasn.ac.th

## 3) Frontend
ที่ root:
```bash
cp .env.example .env.local
npm install
npm run dev
```
เปิด `http://localhost:3000`

## API สำคัญ
- POST `/api/auth/login`, GET `/api/auth/me`
- GET/PATCH `/api/users`
- POST `/api/media` (multipart), GET `/api/media/mine`, `/public`, `/queue`, `/:id`
- POST `/api/media/:id/transition`
- POST `/api/reviews/:mediaId/draft`, `/decision`
- GET `/api/analytics/summary`

สถานะทั้งหมดถูก enforce ที่ backend และมี `StatusLog`, `Review`, `ReviewItem`, `MediaVersion`, `Notification`, `Download` ใน Prisma schema.
