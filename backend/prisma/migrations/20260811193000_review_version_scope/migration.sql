-- ผูกผลตรวจและคอมเมนต์กับเวอร์ชันของสื่อ ป้องกันผลรอบเก่าถูกนำมาใช้กับฉบับแก้ไข
ALTER TABLE "Review" ADD COLUMN "mediaVersion" INTEGER;

UPDATE "Review" AS review
SET "mediaVersion" = media."version"
FROM "Media" AS media
WHERE review."mediaId" = media."id";

ALTER TABLE "Review" ALTER COLUMN "mediaVersion" SET NOT NULL;

CREATE UNIQUE INDEX "Review_mediaId_mediaVersion_reviewerId_stage_key"
ON "Review"("mediaId", "mediaVersion", "reviewerId", "stage");

DROP INDEX IF EXISTS "Review_mediaId_stage_idx";
CREATE INDEX "Review_mediaId_mediaVersion_stage_idx"
ON "Review"("mediaId", "mediaVersion", "stage");
