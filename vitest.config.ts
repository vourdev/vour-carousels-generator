import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": resolve(__dirname, ".") } },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
    setupFiles: ["./test/setup-env.ts"],
    globalSetup: ["./test/setup-db.ts"],
    // Every test file opens the same ./.vitest-auth.db, and parallel workers writing it
    // raced into "SQLITE_BUSY: database is locked" — locally never, on CI reliably.
    // The suite runs in about four seconds, so serialising costs nothing worth measuring.
    fileParallelism: false,
  },
});
