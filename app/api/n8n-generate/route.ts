import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // 1. Authenticate with x-api-key matching BETTER_AUTH_SECRET
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.BETTER_AUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse request body for topic
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const topic = body.topic || body.title;
  if (!topic || !topic.trim()) {
    return NextResponse.json({ error: "Missing topic or title in request body" }, { status: 400 });
  }

  // Forward to Hono backend automation endpoint (port 3001)
  const backendUrl = process.env.BACKEND_AUTOMATION_URL || "http://localhost:3001";
  const automationSecret = process.env.AUTOMATION_SECRET || process.env.BETTER_AUTH_SECRET;

  try {
    const res = await fetch(`${backendUrl}/automation/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": automationSecret || "",
      },
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
    console.error("Failed to forward automation call to backend:", err);
    return NextResponse.json({ error: `Backend automation dispatch failed: ${err.message}` }, { status: 500 });
  }
}
