import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { redis } from "@/lib/redis";
import crypto from "crypto";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/login?error=" + error, req.url));
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
      return NextResponse.redirect(new URL("/login?error=" + tokenData.error, req.url));
    }

    const accessToken = tokenData.access_token;

    // Fetch user profile from github
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "MantraCode-App",
      },
    });
    
    const githubUser = await userResponse.json();
    if (!userResponse.ok) {
      console.error("Failed to fetch github user:", githubUser);
      return NextResponse.redirect(new URL("/login?error=github_user_fetch_failed", req.url));
    }
    
    // Fetch user emails from github
    const emailResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "MantraCode-App",
      },
    });
    
    const emails = await emailResponse.json();
    const primaryEmailObj = Array.isArray(emails) ? emails.find(e => e.primary) : null;
    const email = primaryEmailObj ? primaryEmailObj.email : (githubUser.email || `${githubUser.login}@github.com`);
    
    const normalizedEmail = email.toLowerCase();
    
    // Check if user exists in our DB, if not create one
    const existingUserStr = await redis.get(`user:${normalizedEmail}`);
    let user;
    
    if (existingUserStr) {
      if (typeof existingUserStr === 'string') {
        user = JSON.parse(existingUserStr);
      } else {
        user = existingUserStr;
      }
    } else {
      user = {
        id: crypto.randomUUID(),
        username: githubUser.login,
        email: normalizedEmail,
        createdAt: new Date().toISOString(),
        authProvider: 'github',
        githubId: githubUser.id
      };
      await redis.set(`user:${normalizedEmail}`, JSON.stringify(user));
    }

    // Create session
    await createSession({
      id: user.id,
      username: user.username,
      email: user.email
    });

    // Store the access token and github username in Redis linked to the user's email
    await redis.set(`user:${normalizedEmail}:github_token`, accessToken);
    await redis.set(`user:${normalizedEmail}:github_username`, githubUser.login);

    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (error) {
    console.error("GitHub Auth Error:", error);
    return NextResponse.redirect(new URL("/login?error=github_auth_failed", req.url));
  }
}
