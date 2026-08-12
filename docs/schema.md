# Prisma schema

แหล่งจริงของ schema คือ [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma)

| Model | หน้าที่ |
|---|---|
| `User` | บัญชี ตำแหน่ง สถานะ กลุ่มสาระ เบอร์โทร รูปโปรไฟล์ และเวลาที่ยืนยันอีเมล |
| `Media` | ข้อมูลสื่อ สถานะ เจ้าของ ผู้ถือเรื่อง และเวอร์ชันปัจจุบัน |
| `MediaFile` | metadata และ private path ของไฟล์ |
| `MediaVersion` | snapshot ก่อนสร้างเวอร์ชันใหม่ |
| `Review` | ผลตรวจหนึ่งรอบ แยกกลุ่มสาระ/วิชาการและผูกกับ `mediaVersion` |
| `ReviewItem` | ผลและคอมเมนต์รายหัวข้อ |
| `StatusLog` | ประวัติการเปลี่ยนสถานะแบบ append-only |
| `Notification` | การแจ้งเตือนและเวลาอ่านแล้ว |
| `Download` | เหตุการณ์นำสื่อไปใช้ |
| `AiReview` | ผลคัดกรอง/แชท AI แยกจาก workflow |
| `EmailVerificationToken` | โทเคนยืนยันอีเมลตอนสมัคร เก็บเฉพาะ hash ใช้ได้ครั้งเดียว |
| `PasswordResetToken` | รหัสตั้งรหัสผ่านใหม่ แยกตารางจากรหัสยืนยันอีเมล อายุ 30 นาที |
| `RateLimitBucket` | rate limit ส่วนกลางใน PostgreSQL สำหรับ auth API ทุก instance |

ทุก transition และ `StatusLog` ถูกเขียนใน Prisma transaction เดียวกัน การลบถาวรอนุญาตเฉพาะสื่อ `DRAFT` ของเจ้าของเท่านั้น
