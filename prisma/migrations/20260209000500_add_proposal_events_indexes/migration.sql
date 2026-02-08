-- Improve proposal listing and tracking event lookups.
CREATE INDEX IF NOT EXISTS "Proposal_workspaceId_updatedAt_idx"
ON "Proposal"("workspaceId", "updatedAt" DESC);

CREATE INDEX IF NOT EXISTS "Events_token_idx"
ON "Events"("token");

CREATE INDEX IF NOT EXISTS "Events_uid_idx"
ON "Events"("uid");
