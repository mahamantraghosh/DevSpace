import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { createSession } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await redis.get(`user:${email.toLowerCase()}`);
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    // Hash password (simple SHA-256 for demo purposes, bcrypt/argon2 in real production)
    const passwordHash = crypto.createHash("sha256").update(password).digest("hex");
    
    const userId = crypto.randomUUID();
    const user = {
      id: userId,
      username,
      email: email.toLowerCase(),
      passwordHash,
      createdAt: new Date().toISOString()
    };

    // Store user data
    await redis.set(`user:${email.toLowerCase()}`, JSON.stringify(user));
    
    // Create session
    await createSession({
      id: user.id,
      username: user.username,
      email: user.email
    });

    return NextResponse.json({ success: true, user: { id: user.id, username, email } });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
