-- Enforce workspace ownership checks with a compound unique key for client mutations.
CREATE UNIQUE INDEX IF NOT EXISTS "Client_id_workspaceId_key"
ON "Client"("id", "workspaceId");
