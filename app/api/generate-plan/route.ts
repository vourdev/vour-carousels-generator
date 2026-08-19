import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";

export async function POST(req: Request) {
  await requireSession();
  const body = await req.json();

  const backendUrl = process.env.BACKEND_API_URL || "http://localhost:3000";
  try {
    const forwardHeaders = new Headers();
    forwardHeaders.set("Content-Type", "application/json");
    const cookie = req.headers.get("cookie");
    if (cookie) forwardHeaders.set("cookie", cookie);
    const auth = req.headers.get("authorization");
    if (auth) forwardHeaders.set("authorization", auth);

    // Dynamic routing depending on body type
    const endpoint = body.type === "plan" ? "/api/plan" : "/api/plan/revise";

    const res = await fetch(`${backendUrl}${endpoint}`, {
      method: "POST",
      headers: forwardHeaders,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errObj = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errObj.error || `Backend returned error ${res.status}: ${res.statusText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Failed to proxy plan endpoint to backend:", err);
    return NextResponse.json({ error: `Backend plan dispatch failed: ${err.message}` }, { status: 500 });
  }
}
