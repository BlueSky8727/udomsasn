# Architecture

```text
Browser
  └─ Next.js 16
       ├─ HttpOnly JWT cookie + proxy route protection
       ├─ Server Components อ่านข้อมูลผ่าน backendFetch()
       ├─ /api/backend/* เป็น same-origin proxy สำหรับ client actions
       └─ /api/ai/* เรียก OpenTyphoon และบันทึกผลกลับ backend
            └─ NestJS API
                 ├─ JWT guard + role/owner/assignee/department authorization
                 ├─ PostgreSQL-backed rate limit สำหรับ auth API
                 ├─ Prisma transactions สำหรับ workflow และ status log
                 ├─ private upload directory + signature validation + guarded download
                 ├─ bounded document text extraction
                 └─ PostgreSQL
```

Browser input, metadata และข้อความจากไฟล์ถือเป็นข้อมูลที่ไม่น่าเชื่อถือเสมอ JWT ใช้ยืนยันตัวตนเท่านั้น ส่วนตำแหน่งและสถานะบัญชีอ่านใหม่จากฐานข้อมูลทุกคำขอ ผล AI ถูกบันทึกใน `AiReview` และไม่สามารถเปลี่ยน `Media.status` ได้
