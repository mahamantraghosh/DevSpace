import { redis } from "./redis";
import { cookies } from "next/headers";

export interface UserSession {
  id: string;
  username: string;
  email: string;
}

export async function createSession(user: UserSession) {
  const token = crypto.randomUUID();
  const sessionData = JSON.stringify(user);
  
  // Store session in Redis for 7 days
  await redis.setex(`session:${token}`, 7 * 24 * 60 * 60, sessionData);
  
  const cookieStore = await cookies();
  cookieStore.set("mahaspace_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  
  return token;
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("mahaspace_session")?.value;
  
  if (!token) return null;
  
  const sessionData = await redis.get(`session:${token}`);
  if (!sessionData) return null;
  
  try {
    return JSON.parse(sessionData) as UserSession;
  } catch {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("mahaspace_session")?.value;
  
  if (token) {
    await redis.del(`session:${token}`);
  }
  
  cookieStore.delete("mahaspace_session");
}
