import { rmSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const TEST_DB = "file:./.vitest-auth.db";

export async function setup() {
  process.env.DATABASE_URL = TEST_DB;
  process.env.BETTER_AUTH_SECRET ??= "test-secret-test-secret-test-secret";
  // Set before importing @/lib/auth below so better-auth doesn't warn about a
  // missing base URL during global setup. Test-only; runtime is unaffected.
  process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
  // Deliberately NOT setting ALLOW_SIGNUP here: it's read once, at module-load
  // time, by lib/auth.ts to gate `disableSignUp`. Setting it globally would
  // leak into every test file's `auth` singleton (including
  // auth-config.test.ts's "disables public signup by default" assertion from
  // Task 3), since Vitest resolves all static top-level imports across test
  // files before running any test body. Migrations don't need it either —
  // schema generation never reads `disableSignUp`. Tests that need signup
  // enabled (auth-signin.test.ts) set ALLOW_SIGNUP themselves, scoped to a
  // dynamic import inside their own beforeAll.
  const { getMigrations } = await import("better-auth/db/migration");
  const { auth } = await import("@/lib/auth");
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();

  // Create illustrations table and seed it
  const { createClient } = await import("@libsql/client");
  const db = createClient({ url: TEST_DB });

  // WAL, set once and persisted in the file: the default rollback journal takes a lock
  // over the whole database for any write, which is what turned overlapping test files
  // into "database is locked".
  await db.execute("PRAGMA journal_mode = WAL");
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS illustrations (
      slug TEXT NOT NULL,
      variant TEXT NOT NULL,
      svg TEXT NOT NULL,
      PRIMARY KEY (slug, variant)
    )
  `);

  const manifestPath = join(process.cwd(), "lib", "ds", "illustrations.manifest.json");
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    const slugs = Array.from(new Set(Object.values(manifest).flat() as string[]));
    const assetsDir = join(process.cwd(), "lib", "ds", "assets", "illustrations");
    
    const tx = await db.transaction("write");
    try {
      for (const slug of slugs) {
        for (const variant of ["onLight", "onDark"]) {
          const filePath = join(assetsDir, `${slug}.${variant}.svg`);
          if (existsSync(filePath)) {
            const svg = readFileSync(filePath, "utf-8");
            await tx.execute({
              sql: `INSERT OR REPLACE INTO illustrations (slug, variant, svg) VALUES (?, ?, ?)`,
              args: [slug, variant, svg],
            });
          }
        }
      }
      await tx.commit();
    } catch (err) {
      await tx.rollback();
      throw err;
    } finally {
      db.close();
    }
  }
}

export async function teardown() {
  try { rmSync("./.vitest-auth.db"); } catch {}
}
