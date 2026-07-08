import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { redis } from "@/lib/redis";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/dashboard?error=" + error, req.url));
  }

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "GitHub OAuth not configured" }, { status: 500 });
  }

  try {
    // Exchange the code for an access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return NextResponse.redirect(new URL("/dashboard?error=" + tokenData.error, req.url));
    }

    const accessToken = tokenData.access_token;

    // Fetch user profile from github to get their github username (optional but good for UI)
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    
    const githubUser = await userResponse.json();

    // Store the access token and github username in Redis linked to the user's ID/email
    await redis.set(`user:${session.email}:github_token`, accessToken);
    await redis.set(`user:${session.email}:github_username`, githubUser.login);

    // Redirect back to dashboard, maybe we should redirect to the IDE room if they were in one?
    // We'll just redirect to dashboard for now, or they can just close the popup.
    return NextResponse.redirect(new URL("/dashboard?github=connected", req.url));
  } catch (error) {
    console.error("GitHub Auth Error:", error);
    return NextResponse.redirect(new URL("/dashboard?error=github_auth_failed", req.url));
  }
}
