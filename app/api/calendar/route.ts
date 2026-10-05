import { NextResponse } from "next/server";
import { hasAutomationKey } from "@/lib/api-key";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { listCarousels } from "@/lib/history/repo";

export async function GET(req: Request) {
  let userId: string | null = null;

  // n8n / automation: the automation key plus an explicit userId (see lib/api-key.ts)
  if (hasAutomationKey(req)) {
    const { searchParams } = new URL(req.url);
    userId = searchParams.get("userId");
    
    if (!userId) {
      // If no explicit userId, fallback to find a user or use default
      return NextResponse.json(
        { error: "Missing userId query parameter for API Key auth" },
        { status: 400 }
      );
    }
  }

  if (!userId) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = session.user.id;
  }

  try {
    const items = await listCarousels(userId, 100);
    return NextResponse.json({ carousels: items });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
