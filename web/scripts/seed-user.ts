import { auth } from "@/lib/auth";

async function main() {
  const email = process.env.APP_USERNAME;
  const password = process.env.APP_PASSWORD;
  if (!email || !password) throw new Error("APP_USERNAME and APP_PASSWORD required");

  try {
    await auth.api.signUpEmail({ body: { email, password, name: "Vour" } });
    console.log(`✅ seeded user ${email}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/exist/i.test(msg)) {
      console.log(`ℹ️  user ${email} already exists — skipping`);
      return;
    }
    throw err;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
