import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;

  if (!redis) {
    return NextResponse.json({ error: "Redis connection not initialized. Check REDIS_URL." }, { status: 500 });
  }

  // Default initial state
  const defaultCode = {
    html: "<!-- Welcome to DevSpace! -->\n<div class='playground'>\n  <h1>Collaborative Playground</h1>\n  <p>Start coding together!</p>\n</div>",
    css: "body { background: #0f172a; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; }",
    js: "console.log('Hello from DevSpace!');"
  };

  try {
    const rawData = await redis.get(`room:${roomId}`);
    
    if (!rawData) {
      // Create new room state in Redis if it doesn't exist
      const initialState = {
        roomId,
        code: defaultCode,
        messages: [],
        users: []
      };
      await redis.set(`room:${roomId}`, JSON.stringify(initialState));
      return NextResponse.json(initialState);
    }

    return NextResponse.json(JSON.parse(rawData));
  } catch (error) {
    console.error("Redis Error:", error);
    return NextResponse.json({ error: "Failed to fetch room from Redis" }, { status: 500 });
  }
}
