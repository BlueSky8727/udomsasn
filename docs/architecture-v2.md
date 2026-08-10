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
                 ├─ Prisma transactions สำหรับ workflow และ status log
                 ├─ private upload directory + guarded download
                 ├─ document text extraction
                 └─ PostgreSQL
```

Browser input, metadata และข้อความจากไฟล์ถือเป็นข้อมูลที่ไม่น่าเชื่อถือเสมอ การตัดสินสิทธิ์อ่านจาก JWT และฐานข้อมูลฝั่ง NestJS เท่านั้น ผล AI ถูกบันทึกใน `AiReview` และไม่สามารถเปลี่ยน `Media.status` ได้
