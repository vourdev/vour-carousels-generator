import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:local-auth.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const TOPICS_SCHEMA = `
CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  keywords TEXT NOT NULL,
  angle TEXT,
  status TEXT NOT NULL DEFAULT 'idea',
  priority INTEGER NOT NULL DEFAULT 0,
  scheduled_date TEXT,
  carousel_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
)`;

async function migrate() {
  console.log("Running topics table migration...");
  
  try {
    await client.execute(TOPICS_SCHEMA);
    console.log("✅ Topics table created successfully");
    
    // Create index for common queries
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_topics_user_status 
      ON topics(user_id, status)
    `);
    
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_topics_user_category 
      ON topics(user_id, category)
    `);
    
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_topics_scheduled_date 
      ON topics(scheduled_date)
    `);
    
    console.log("✅ Indexes created successfully");
    console.log("\n🎉 Migration completed!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
}

migrate();
