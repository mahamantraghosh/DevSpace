import { NextResponse } from "next/server";
import { getSession, clearSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user: session });
}

export async function POST() {
  await clearSession();
  return NextResponse.json({ success: true });
}
