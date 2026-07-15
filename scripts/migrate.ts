import { getMigrations } from "better-auth/db/migration";
import { auth } from "@/lib/auth";

async function main() {
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();
  console.log("✅ migrations applied");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
