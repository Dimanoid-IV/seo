-- Prompt 11.55: per-website scoped live publish rollout flag

ALTER TABLE "websites"
  ADD COLUMN "livePublishRolloutEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "websites_livePublishRolloutEnabled_idx"
  ON "websites"("livePublishRolloutEnabled");
