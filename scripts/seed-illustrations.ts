import { createClient } from "@libsql/client";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:local-auth.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function seed() {
  console.log("Seeding illustrations into database...");
  
  const manifestPath = join(process.cwd(), "lib", "ds", "illustrations.manifest.json");
  if (!existsSync(manifestPath)) {
    console.error("❌ Manifest file not found:", manifestPath);
    process.exit(1);
  }
  
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const slugs = Array.from(new Set(Object.values(manifest).flat() as string[]));
  
  const assetsDir = join(process.cwd(), "lib", "ds", "assets", "illustrations");
  
  let count = 0;
  for (const slug of slugs) {
    for (const variant of ["onLight", "onDark"]) {
      const fileName = `${slug}.${variant}.svg`;
      const filePath = join(assetsDir, fileName);
      if (!existsSync(filePath)) {
        console.warn(`⚠️ Warning: SVG file not found for ${slug} (${variant})`);
        continue;
      }
      
      const svg = readFileSync(filePath, "utf-8");
      
      await client.execute({
        sql: `INSERT OR REPLACE INTO illustrations (slug, variant, svg) VALUES (?, ?, ?)`,
        args: [slug, variant, svg],
      });
      count++;
    }
  }
  
  console.log(`✅ Seeded ${count} illustrations successfully!`);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
