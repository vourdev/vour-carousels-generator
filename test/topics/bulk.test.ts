import { describe, it, expect } from "vitest";
import {
  createTopic,
  getTopics,
  bulkDeleteTopics,
  bulkUpdateTopicStatus,
  deleteTopicsByStatus,
} from "@/lib/topics/bank";
import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.DATABASE_URL ?? "file:local-auth.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

describe("topic bank bulk actions", () => {
  const userId = "test_bulk_user_" + Date.now();

  it("handles bulk update and bulk delete operations", async () => {
    // Ensure test user exists
    await db.execute({
      sql: `INSERT OR IGNORE INTO user (id, name, email, emailVerified, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [userId, "Bulk User", `${userId}@example.com`, 1, new Date().toISOString(), new Date().toISOString()],
    });

    // Create 3 topics
    const t1 = await createTopic({ userId, title: "Topic 1", category: "tutorial", keywords: ["a"] });
    const t2 = await createTopic({ userId, title: "Topic 2", category: "nextjs", keywords: ["b"] });
    const t3 = await createTopic({ userId, title: "Topic 3", category: "productivity", keywords: ["c"] });

    expect(t1.id).toBeDefined();
    expect(t2.id).toBeDefined();
    expect(t3.id).toBeDefined();

    // Bulk update status to 'published' for t1 and t2
    await bulkUpdateTopicStatus([t1.id, t2.id], userId, "published");

    const topicsAfterUpdate = await getTopics(userId);
    const m1 = topicsAfterUpdate.find((t) => t.id === t1.id);
    const m2 = topicsAfterUpdate.find((t) => t.id === t2.id);
    const m3 = topicsAfterUpdate.find((t) => t.id === t3.id);

    expect(m1?.status).toBe("published");
    expect(m2?.status).toBe("published");
    expect(m3?.status).toBe("idea");

    // Delete published topics
    const deletedCount = await deleteTopicsByStatus(userId, "published");
    expect(deletedCount).toBe(2);

    const remaining = await getTopics(userId);
    expect(remaining.some((t) => t.id === t1.id)).toBe(false);
    expect(remaining.some((t) => t.id === t2.id)).toBe(false);
    expect(remaining.some((t) => t.id === t3.id)).toBe(true);

    // Bulk delete remaining
    await bulkDeleteTopics([t3.id], userId);
    const finalTopics = await getTopics(userId);
    expect(finalTopics).toHaveLength(0);
  });
});
