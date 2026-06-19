import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { createSession } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const userDataStr = await redis.get(`user:${email.toLowerCase()}`);
    if (!userDataStr) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    let user;
    // Handle both string and object responses from different ioredis versions
    if (typeof userDataStr === 'string') {
      user = JSON.parse(userDataStr);
    } else {
      user = userDataStr;
    }

    const passwordHash = crypto.createHash("sha256").update(password).digest("hex");
    
    if (user.passwordHash !== passwordHash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await createSession({
      id: user.id,
      username: user.username,
      email: user.email
    });

    return NextResponse.json({ success: true, user: { id: user.id, username: user.username, email: user.email } });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
