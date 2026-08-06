import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:local-auth.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

// Revision memory for in-progress drafts. Keyed on draft_id (minted by the
// wizard at Gate 1), not carousel_id, which only exists after export.
// Rows are deleted when the draft is scheduled, stocked, or reset.
const MEMORY_SCHEMA = `
CREATE TABLE IF NOT EXISTS revision_memory (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  draft_id TEXT NOT NULL,
  stage TEXT NOT NULL,
  request TEXT NOT NULL,
  outcome TEXT,
  created_at INTEGER NOT NULL
)`;

async function migrate() {
  console.log("Running revision_memory table migration...");

  try {
    await client.execute(MEMORY_SCHEMA);
    console.log("✅ revision_memory table created successfully");

    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_revision_memory_draft
      ON revision_memory(user_id, draft_id, created_at)
    `);
    console.log("✅ Index created successfully");
    console.log("\n🎉 Migration completed!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
}

migrate();
