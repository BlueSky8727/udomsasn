-- บัญชีที่ผู้ดูแลเปิดใช้งานไว้ก่อนมีระบบยืนยันอีเมล ถือว่ายืนยันแล้ว
-- ไม่อย่างนั้นผู้ใช้เดิมทุกคนจะเข้าระบบไม่ได้ทันทีที่ deploy
UPDATE "User"
SET "emailVerifiedAt" = COALESCE("emailVerifiedAt", "createdAt")
WHERE "accountStatus" = 'ACTIVE';
