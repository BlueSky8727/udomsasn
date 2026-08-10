CREATE TABLE "AiReview" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiReview_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiReview_mediaId_createdAt_idx" ON "AiReview"("mediaId", "createdAt");
CREATE INDEX "AiReview_actorId_createdAt_idx" ON "AiReview"("actorId", "createdAt");
ALTER TABLE "AiReview" ADD CONSTRAINT "AiReview_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiReview" ADD CONSTRAINT "AiReview_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
