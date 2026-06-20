import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;

  if (!redis) {
    return NextResponse.json({ error: "Redis connection not initialized. Check REDIS_URL." }, { status: 500 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { password } = body;

    // First check room metadata for password protection
    const rawMeta = await redis.get(`room_meta:${roomId}`);
    if (rawMeta) {
      const meta = typeof rawMeta === "string" ? JSON.parse(rawMeta) : rawMeta;
      if (meta.visibility === "private" && meta.password) {
        if (password !== meta.password) {
          return NextResponse.json(
            { error: "Password Required", requiresPassword: true },
            { status: 401 }
          );
        }
      }
    }

    // Default initial state
    const defaultCode = {
      html: "<!-- welcomeee to Mahamantra's DevSpace! -->\n<div class='playground'>\n  <h1>We can write codes here together dosto! lessgooog</h1>\n  <p>Ar ki bola jay??</p>\n <p>KRISHNAAAA!!</p>\n</div>",
      css: "body { background: #0f172a; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; }",
      js: "console.log('Hello from Krishna Kanhaiyaa');"
    };

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

    return NextResponse.json(typeof rawData === "string" ? JSON.parse(rawData) : rawData);
  } catch (error) {
    console.error("Redis Error:", error);
    return NextResponse.json({ error: "Failed to fetch room from Redis" }, { status: 500 });
  }
}
