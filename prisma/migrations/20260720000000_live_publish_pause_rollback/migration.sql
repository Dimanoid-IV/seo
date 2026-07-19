-- Prompt 11.53: per-website live publish pause + article rollback metadata

ALTER TABLE "websites"
  ADD COLUMN "autopilotLivePublishPaused" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "autopilotLivePublishPausedAt" TIMESTAMP(3),
  ADD COLUMN "autopilotLivePublishPausedByUserId" UUID,
  ADD COLUMN "autopilotLivePublishPauseReason" TEXT;

ALTER TABLE "websites"
  ADD CONSTRAINT "websites_autopilotLivePublishPausedByUserId_fkey"
  FOREIGN KEY ("autopilotLivePublishPausedByUserId")
  REFERENCES "users"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

CREATE INDEX "websites_autopilotLivePublishPaused_idx"
  ON "websites"("autopilotLivePublishPaused");

ALTER TABLE "articles"
  ADD COLUMN "wordpressPublishedUrl" TEXT,
  ADD COLUMN "wordpressRolledBackAt" TIMESTAMP(3);
