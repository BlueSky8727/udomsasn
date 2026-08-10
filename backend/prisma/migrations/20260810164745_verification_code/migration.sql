-- เพิ่มรหัสยืนยัน 6 หลักและตัวนับครั้งที่กรอกผิด
--
-- แถวเดิมที่ออกก่อนมีระบบรหัสจะได้ค่าว่าง ซึ่งไม่มีทางตรงกับ hash ของรหัสจริง
-- (hash เป็น hex 64 ตัวเสมอ) เจ้าของอีเมลยังใช้ลิงก์ในอีเมลเดิมได้
-- หรือกด "ส่งอีเมลอีกครั้ง" เพื่อรับรหัสชุดใหม่
ALTER TABLE "EmailVerificationToken" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "EmailVerificationToken" ADD COLUMN "codeHash" TEXT NOT NULL DEFAULT '';
ALTER TABLE "EmailVerificationToken" ALTER COLUMN "codeHash" DROP DEFAULT;
