import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { redis } from "@/lib/redis";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = await redis.get(`user:${session.email}:github_token`);
  
  if (!accessToken) {
    return NextResponse.json({ error: "GitHub not connected", notConnected: true }, { status: 403 });
  }

  try {
    const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=50", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json({ error: err.message || "Failed to fetch repositories" }, { status: response.status });
    }

    const repos = await response.json();
    return NextResponse.json({ success: true, repos });
  } catch (error) {
    console.error("GitHub Repos Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
