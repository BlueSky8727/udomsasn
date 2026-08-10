# Udomsasn Media QA

ระบบคลังสื่อการสอนและกระบวนการตรวจสองชั้นสำหรับอาจารย์ หัวหน้ากลุ่มสาระ และหัวหน้าวิชาการ

## เทคโนโลยี

- Frontend: Next.js 16, React 19, TypeScript
- Backend: NestJS, Prisma, PostgreSQL
- AI assistant: OpenTyphoon (ปิดได้ด้วย `AI_CHECK_ENABLED=false`)
- Authentication: JWT เก็บใน HttpOnly cookie ฝั่ง Next.js

## เริ่มใช้งาน

ต้องใช้ Node.js 22+ และ PostgreSQL

1. คัดลอก `backend/.env.example` เป็น `backend/.env` แล้วตั้ง `DATABASE_URL` และ `JWT_SECRET` อย่างน้อย 32 ตัวอักษร
2. คัดลอก `.env.example` เป็น `.env.local`
3. ติดตั้งและเตรียมฐานข้อมูล:

```bash
cd backend
npm ci
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
npm run dev
```

4. เปิด terminal อีกหน้าที่โฟลเดอร์หลัก:

```bash
npm ci
npm run dev
```

Frontend อยู่ที่ `http://localhost:3000` และ Backend อยู่ที่ `http://localhost:4000/api`

บัญชีตัวอย่างใช้รหัสผ่าน `Udomsasn@2026`:

- `teacher@udomsasn.ac.th`
- `reviewer@udomsasn.ac.th`
- `admin@udomsasn.ac.th`

## ตรวจสอบคุณภาพ

```bash
npm run lint
npm run typecheck
npm test
npm run build
cd backend && npm run build
```

ไฟล์สื่ออยู่ใน private upload directory และดาวน์โหลดผ่าน API ที่ตรวจสิทธิ์ทุกครั้ง ผล AI เก็บแยกใน `AiReview` และไม่มีสิทธิ์เปลี่ยนสถานะสื่อ
