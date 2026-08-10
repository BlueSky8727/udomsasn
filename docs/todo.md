# Deployment checklist

ฟังก์ชันหลักเชื่อม frontend, NestJS และ PostgreSQL แล้ว รายการต่อไปนี้เป็นงานตั้งค่าตอนนำขึ้น production ไม่ใช่ฟีเจอร์ที่ขาดในโค้ด

- [ ] ตั้ง `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` และ Typhoon key ผ่าน secret manager
- [ ] ใช้ persistent encrypted volume หรือเปลี่ยน `UPLOAD_DIR` เป็น private object storage
- [ ] รัน `npm run prisma:deploy` ก่อนเปิด backend เวอร์ชันใหม่
- [ ] เปิด HTTPS ที่ reverse proxy และจำกัดขนาด request ให้ตรง `MAX_UPLOAD_BYTES`
- [ ] ตั้ง backup/retention ของ PostgreSQL และ upload directory
- [ ] ตั้ง monitoring, error reporting และแจ้งเตือนเมื่อ CI หรือ health check ล้มเหลว
- [ ] เพิ่ม browser end-to-end tests ใน environment ที่มี PostgreSQL แยกสำหรับทดสอบ
