import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";

export async function POST(req: Request) {
  await requireSession();
  const { idea, modelId } = (await req.json()) as { idea: string; modelId: string };
  if (!idea?.trim()) {
    return NextResponse.json({ error: "Missing idea" }, { status: 400 });
  }

  const backendUrl = process.env.BACKEND_API_URL || "http://localhost:3000";
  try {
    const forwardHeaders = new Headers();
    forwardHeaders.set("Content-Type", "application/json");
    const cookie = req.headers.get("cookie");
    if (cookie) forwardHeaders.set("cookie", cookie);
    const auth = req.headers.get("authorization");
    if (auth) forwardHeaders.set("authorization", auth);

    const res = await fetch(`${backendUrl}/api/brief`, {
      method: "POST",
      headers: forwardHeaders,
      body: JSON.stringify({ idea, modelId }),
    });

    if (!res.ok) {
      const errObj = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errObj.error || `Backend returned error ${res.status}: ${res.statusText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ brief: data.brief });
  } catch (err: any) {
    console.error("Failed to generate brief on backend:", err);
    return NextResponse.json({ error: `Backend brief failed: ${err.message}` }, { status: 500 });
  }
}
