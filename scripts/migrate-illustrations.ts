import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:local-auth.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const ILLUSTRATIONS_SCHEMA = `
CREATE TABLE IF NOT EXISTS illustrations (
  slug TEXT NOT NULL,
  variant TEXT NOT NULL,
  svg TEXT NOT NULL,
  PRIMARY KEY (slug, variant)
)`;

async function migrate() {
  console.log("Running illustrations table migration...");

  try {
    await client.execute(ILLUSTRATIONS_SCHEMA);
    console.log("✅ illustrations table created successfully");
    console.log("\n🎉 Migration completed!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
}

migrate();
