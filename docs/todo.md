# Deployment checklist

ฟังก์ชันหลักเชื่อม frontend, NestJS และ PostgreSQL แล้ว งาน hardening ในโค้ดที่ทำเสร็จแล้ว:

- [x] ตรวจสถานะบัญชีและตำแหน่งล่าสุดจากฐานข้อมูลทุก authenticated request
- [x] จำกัด Reviewer ให้เห็นเฉพาะคิวที่รับได้หรืองานที่ตัวเองถืออยู่
- [x] ผูก Review/ReviewItem กับเวอร์ชันของสื่อ
- [x] ใช้ workflow rules ชุดเดียวกันทั้ง frontend และ backend
- [x] ตรวจ file signature, ล้างไฟล์เมื่อ transaction ล้มเหลว และจำกัด decompression
- [x] ใช้ PostgreSQL-backed rate limit สำหรับ auth API
- [x] เพิ่ม backend integration tests พร้อม PostgreSQL ใน CI
- [x] เพิ่ม health check แยก liveness และ database readiness
- [x] เพิ่ม browser smoke tests สำหรับ login, role access และ server-side search
- [x] เปิดทางจากการ์ดในคลังสื่อไปหน้ารายละเอียดและปุ่มดาวน์โหลด
- [x] แจ้งเตือนผู้ตรวจที่รับงานได้จริงเมื่อมีสื่อเข้าคิว ไม่ใช่แจ้งเจ้าของฝ่ายเดียว
- [x] ส่งอีเมลแจ้งผลตรวจและงานเข้าคิว แบบไม่ให้เมลล่มกระทบการเปลี่ยนสถานะ
- [x] ผูกไฟล์แนบกับเวอร์ชัน และแสดงผลตรวจย้อนหลังทุกรอบในหน้าสื่อของฉัน
- [x] คำนวณ SLA และงานเกินกำหนดจากเวลาที่เรื่องเข้าคิวจริง
- [x] นับการนำไปใช้ตามจำนวนผู้ใช้ ไม่ใช่จำนวนครั้งที่กดดาวน์โหลด

รายการต่อไปนี้เป็นงานตั้งค่าตอนนำขึ้น production:

- [ ] ตั้ง `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` และ Typhoon key ผ่าน secret manager
- [ ] ใช้ persistent encrypted volume หรือเปลี่ยน `UPLOAD_DIR` เป็น private object storage
- [ ] รัน `npm run prisma:deploy` ก่อนเปิด backend เวอร์ชันใหม่
- [ ] เปิด HTTPS ที่ reverse proxy และจำกัดขนาด request ให้ตรง `MAX_UPLOAD_BYTES`
- [ ] ตั้ง backup/retention ของ PostgreSQL และ upload directory
- [ ] ตั้ง monitoring, error reporting และแจ้งเตือนเมื่อ CI หรือ health check ล้มเหลว
- [ ] ขยาย browser end-to-end tests ให้ครอบคลุมเส้นทางเต็ม สมัคร → ส่งสื่อ → ตรวจสองชั้น (ปัจจุบันครอบคลุม login และสิทธิ์หลักแล้ว)
