import { createClient } from "@libsql/client";

let clientInstance: ReturnType<typeof createClient> | null = null;

function db() {
  if (!clientInstance) {
    clientInstance = createClient({
      url: process.env.DATABASE_URL ?? "file:local-auth.db",
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
  }
  return clientInstance;
}

export async function getProductsFromDb() {
  try {
    const res = await db().execute("SELECT * FROM products WHERE active = 1 OR active IS NULL");
    return res.rows.map((r: any) => ({
      id: r.id as string,
      name: r.name as string,
      slug: (r.slug ?? r.id) as string,
      tagline: r.tagline as string | undefined,
      description: r.description as string | undefined,
      keyBenefit: (r.key_benefit ?? r.keyBenefit) as string | undefined,
      ctaText: (r.cta_text ?? r.ctaText) as string | undefined,
      active: r.active,
    }));
  } catch {
    return [];
  }
}

export type TopicCategory = 
  | "ai-workflow"
  | "developer-tools"
  | "automation"
  | "nextjs"
  | "angular"
  | "productivity"
  | "tutorial"
  | "common-mistakes"
  | "case-study"
  | "deep-dive";

export type TopicStatus = "idea" | "queued" | "generated" | "published" | "archived";

export interface Topic {
  id: string;
  title: string;
  category: TopicCategory;
  description?: string;
  keywords: string[];
  angle?: string;
  status: TopicStatus;
  priority: number;
  scheduledDate?: string;
  carouselId?: string;
  relatedProductId?: string;
  related_product_id?: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
}

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
  related_product_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
)`;

let schemaEnsured = false;

async function ensureSchema() {
  if (schemaEnsured) return;
  await db().execute(TOPICS_SCHEMA);
  try {
    await db().execute("ALTER TABLE topics ADD COLUMN related_product_id TEXT");
  } catch {
    // Column already exists or table freshly created
  }
  schemaEnsured = true;
}

function rowToTopic(row: any): Topic {
  const relatedProductId = (row.related_product_id ?? row.relatedProductId) as string | undefined;
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    category: row.category as TopicCategory,
    description: row.description as string | undefined,
    keywords: JSON.parse(row.keywords as string),
    angle: row.angle as string | undefined,
    status: row.status as TopicStatus,
    priority: row.priority as number,
    scheduledDate: row.scheduled_date as string | undefined,
    carouselId: row.carousel_id as string | undefined,
    relatedProductId,
    related_product_id: relatedProductId,
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
  };
}

export async function createTopic(data: {
  userId: string;
  title: string;
  category: TopicCategory;
  description?: string;
  keywords?: string[];
  angle?: string;
  priority?: number;
  scheduledDate?: string;
  relatedProductId?: string;
}): Promise<Topic> {
  await ensureSchema();
  const now = Date.now();
  const id = `topic_${now}_${Math.random().toString(36).substring(2, 9)}`;
  
  await db().execute({
    sql: `INSERT INTO topics (id, user_id, title, category, description, keywords, angle, status, priority, scheduled_date, related_product_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      data.userId,
      data.title,
      data.category,
      data.description || null,
      JSON.stringify(data.keywords || []),
      data.angle || null,
      "idea",
      data.priority || 0,
      data.scheduledDate || null,
      data.relatedProductId || null,
      now,
      now,
    ],
  });

  const res = await db().execute({
    sql: `SELECT * FROM topics WHERE id = ?`,
    args: [id],
  });

  if (!res.rows[0]) throw new Error("Failed to create topic");
  return rowToTopic(res.rows[0]);
}

export async function updateTopic(
  id: string,
  userId: string,
  data: {
    title?: string;
    category?: TopicCategory;
    description?: string;
    keywords?: string[];
    angle?: string;
    status?: TopicStatus;
    priority?: number;
    scheduledDate?: string;
    carouselId?: string;
    relatedProductId?: string;
  }
): Promise<void> {
  await ensureSchema();
  const updates: string[] = [];
  const args: any[] = [];

  if (data.title !== undefined) {
    updates.push("title = ?");
    args.push(data.title);
  }
  if (data.category !== undefined) {
    updates.push("category = ?");
    args.push(data.category);
  }
  if (data.description !== undefined) {
    updates.push("description = ?");
    args.push(data.description);
  }
  if (data.keywords !== undefined) {
    updates.push("keywords = ?");
    args.push(JSON.stringify(data.keywords));
  }
  if (data.angle !== undefined) {
    updates.push("angle = ?");
    args.push(data.angle);
  }
  if (data.status !== undefined) {
    updates.push("status = ?");
    args.push(data.status);
  }
  if (data.priority !== undefined) {
    updates.push("priority = ?");
    args.push(data.priority);
  }
  if (data.scheduledDate !== undefined) {
    updates.push("scheduled_date = ?");
    args.push(data.scheduledDate);
  }
  if (data.carouselId !== undefined) {
    updates.push("carousel_id = ?");
    args.push(data.carouselId);
  }
  if (data.relatedProductId !== undefined) {
    updates.push("related_product_id = ?");
    args.push(data.relatedProductId);
  }

  updates.push("updated_at = ?");
  args.push(Date.now());

  args.push(id, userId);

  await db().execute({
    sql: `UPDATE topics SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`,
    args,
  });
}

export async function getTopics(
  userId: string,
  filters?: {
    status?: TopicStatus;
    category?: TopicCategory;
    limit?: number;
  }
): Promise<Topic[]> {
  await ensureSchema();
  
  let sql = `SELECT * FROM topics WHERE user_id = ?`;
  const args: any[] = [userId];

  if (filters?.status) {
    sql += ` AND status = ?`;
    args.push(filters.status);
  }

  if (filters?.category) {
    sql += ` AND category = ?`;
    args.push(filters.category);
  }

  sql += ` ORDER BY priority DESC, created_at DESC`;

  if (filters?.limit) {
    sql += ` LIMIT ?`;
    args.push(filters.limit);
  }

  const res = await db().execute({ sql, args });
  return res.rows.map(rowToTopic);
}

export async function getTopic(id: string, userId: string): Promise<Topic | null> {
  await ensureSchema();
  const res = await db().execute({
    sql: `SELECT * FROM topics WHERE id = ? AND user_id = ?`,
    args: [id, userId],
  });
  return res.rows[0] ? rowToTopic(res.rows[0]) : null;
}

export async function deleteTopic(id: string, userId: string): Promise<void> {
  await ensureSchema();
  await db().execute({
    sql: `DELETE FROM topics WHERE id = ? AND user_id = ?`,
    args: [id, userId],
  });
}

export async function bulkDeleteTopics(ids: string[], userId: string): Promise<void> {
  if (ids.length === 0) return;
  await ensureSchema();
  const placeholders = ids.map(() => "?").join(", ");
  await db().execute({
    sql: `DELETE FROM topics WHERE user_id = ? AND id IN (${placeholders})`,
    args: [userId, ...ids],
  });
}

export async function bulkUpdateTopicStatus(
  ids: string[],
  userId: string,
  status: TopicStatus
): Promise<void> {
  if (ids.length === 0) return;
  await ensureSchema();
  const placeholders = ids.map(() => "?").join(", ");
  await db().execute({
    sql: `UPDATE topics SET status = ?, updated_at = ? WHERE user_id = ? AND id IN (${placeholders})`,
    args: [status, Date.now(), userId, ...ids],
  });
}

export async function deleteTopicsByStatus(userId: string, status: TopicStatus): Promise<number> {
  await ensureSchema();
  const res = await db().execute({
    sql: `DELETE FROM topics WHERE user_id = ? AND status = ?`,
    args: [userId, status],
  });
  return Number(res.rowsAffected ?? 0);
}

export async function getTopicsForWeek(userId: string, startDate: Date): Promise<Topic[]> {
  await ensureSchema();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);

  const res = await db().execute({
    sql: `SELECT * FROM topics 
          WHERE user_id = ? 
          AND scheduled_date >= ? 
          AND scheduled_date < ?
          ORDER BY scheduled_date ASC`,
    args: [userId, startDate.toISOString(), endDate.toISOString()],
  });

  return res.rows.map(rowToTopic);
}
