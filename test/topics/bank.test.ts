import { describe, it, expect } from "vitest";
import { createTopic, getTopic, updateTopic, deleteTopic } from "@/lib/topics/bank";
import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.DATABASE_URL ?? "file:local-auth.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

describe("topic bank repo", () => {
  const userId = "test_user_bank_" + Date.now();

  it("creates and retrieves a topic with relatedProductId", async () => {
    // Ensure test user exists for foreign key
    await db.execute({
      sql: `INSERT OR IGNORE INTO user (id, name, email, emailVerified, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [userId, "Test User", `${userId}@example.com`, 1, new Date().toISOString(), new Date().toISOString()],
    });

    const topic = await createTopic({
      userId,
      title: "Optimasi Query Database",
      category: "tutorial",
      description: "Cara indexing yang benar di PostgreSQL",
      keywords: ["sql", "postgres"],
      angle: "fokus: Tips Kinerja",
      priority: 7,
      relatedProductId: "prod_123",
    });

    expect(topic.id).toBeDefined();
    expect(topic.title).toBe("Optimasi Query Database");
    expect(topic.relatedProductId).toBe("prod_123");
    expect(topic.related_product_id).toBe("prod_123");

    const fetched = await getTopic(topic.id, userId);
    expect(fetched).not.toBeNull();
    expect(fetched?.relatedProductId).toBe("prod_123");

    // Update relatedProductId
    await updateTopic(topic.id, userId, { relatedProductId: "prod_456" });
    const updated = await getTopic(topic.id, userId);
    expect(updated?.relatedProductId).toBe("prod_456");

    // Cleanup
    await deleteTopic(topic.id, userId);
  });
});
