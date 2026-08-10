# Backend setup

ดูขั้นตอนหลักใน `README.md`

## Environment ที่จำเป็น

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: ค่าสุ่มยาวอย่างน้อย 32 ตัวอักษร ห้ามใช้ค่าเริ่มต้นใน production
- `JWT_EXPIRES_IN`: ค่าเริ่มต้น `7d`
- `CORS_ORIGIN`: origin ของ frontend
- `UPLOAD_DIR`: private directory สำหรับไฟล์อัปโหลด
- `MAX_UPLOAD_BYTES`: ขนาดสูงสุดต่อไฟล์
- `MAX_AVATAR_BYTES`: ขนาดสูงสุดของรูปโปรไฟล์ ค่าเริ่มต้น 2MB
- `APP_URL`: URL ของ frontend ใช้ประกอบลิงก์ยืนยันอีเมล
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `MAIL_FROM`: อีเมลขาออก

> ถ้าไม่ตั้ง `SMTP_HOST` ระบบจะ**ไม่ส่งอีเมลจริง** แต่พิมพ์ลิงก์ยืนยันลง log ของเซิร์ฟเวอร์แทน
> ใช้ได้เฉพาะตอนพัฒนา ก่อนขึ้นใช้งานจริงต้องตั้งค่า SMTP ให้ครบ

## การสมัครสมาชิก

ผู้สมัครกรอกชื่อ-นามสกุล อีเมล เบอร์โทร รูปโปรไฟล์ และรหัสผ่าน ที่หน้า `/login` แท็บ "สมัครสมาชิก"
แล้วผ่าน 2 ด่านก่อนเข้าใช้งานได้:

1. **ยืนยันอีเมล** — ระบบส่ง**รหัส 6 หลัก**พร้อมลิงก์สำรองไปทางอีเมล ผู้สมัครกรอกรหัสในหน้าสมัครได้เลย
   พอรหัสถูกจะเด้งไปแท็บเข้าสู่ระบบทันที · อายุ 24 ชั่วโมง ใช้ได้ครั้งเดียว
   เก็บเฉพาะ hash ของรหัสและโทเคน · กรอกผิดเกิน 5 ครั้งต้องขอรหัสใหม่ · ขอรหัสใหม่ = รหัสเก่าใช้ไม่ได้ทันที
2. **ผู้ดูแลระบบแต่งตั้ง** — บัญชีใหม่เป็น `TEACHER` + `PENDING` เสมอ ผู้สมัครเลือกตำแหน่งเองไม่ได้
   `ADMIN` กำหนดตำแหน่ง/กลุ่มสาระแล้วเปลี่ยนเป็น `ACTIVE` ที่หน้า `/admin`

หน้าเข้าสู่ระบบไม่มีให้เลือกตำแหน่ง ระบบอ่านตำแหน่งจากฐานข้อมูลเองหลังตรวจรหัสผ่านผ่าน

## ตำแหน่ง

| ตำแหน่ง | ตรวจสื่อ | ดูรายชื่อสมาชิก | ตั้งตำแหน่ง |
|---|---|---|---|
| `TEACHER` อาจารย์ | – | – | – |
| `REVIEWER` หัวหน้ากลุ่มสาระ | รอบกลุ่มสาระ | – | – |
| `ACADEMIC_HEAD` หัวหน้าวิชาการ | ขั้นสุดท้าย | ได้ (อ่านอย่างเดียว) | – |
| `ADMIN` ผู้ดูแลระบบ | – | ได้ | ได้ |

## API หลัก

- `POST /api/auth/login`, `GET /api/auth/me`
- `POST /api/auth/register` (multipart พร้อมรูปโปรไฟล์)
- `POST /api/auth/verify-code` (อีเมล + รหัส 6 หลัก), `POST /api/auth/verify-email` (ลิงก์)
- `POST /api/auth/resend-verification`
- `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` (รหัส 6 หลัก อายุ 30 นาที)
- `GET /api/auth/avatar/:userId` (ต้องล็อกอิน)
- `GET/PATCH /api/users`
- `POST/PATCH/GET/DELETE /api/media`
- `POST /api/media/:id/transition`
- `GET /api/media/:id/files/:fileId/download`
- `GET /api/media/:id/extracted-text`
- `POST /api/reviews/:mediaId/draft`, `/decision`
- `GET/PATCH/POST /api/notifications`
- `GET /api/analytics/summary`

ทุกการเปลี่ยนสถานะเขียน `StatusLog` ใน transaction เดียวกันกับการเปลี่ยนข้อมูล และผล AI เก็บใน `AiReview` เท่านั้น
