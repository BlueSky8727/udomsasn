-- ผูกไฟล์แนบกับเวอร์ชันของสื่อ เพื่อให้รู้ว่าไฟล์แต่ละอันมาจากรอบส่งไหน
-- ไฟล์เดิมทั้งหมดถือเป็นรอบที่ 1 เพราะยังไม่มีข้อมูลแยกรอบก่อนหน้านี้
ALTER TABLE "MediaFile" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

DROP INDEX IF EXISTS "MediaFile_mediaId_idx";
CREATE INDEX "MediaFile_mediaId_version_idx" ON "MediaFile"("mediaId", "version");
