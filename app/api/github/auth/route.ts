import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "GitHub Client ID not configured" }, { status: 500 });
  }

  // The scopes needed for cloning, committing, and auth
  const scope = "repo user user:email";
  
  // We can pass a state parameter to prevent CSRF, or just to pass back where we should redirect
  const url = new URL(req.url);
  const redirectUri = `${url.protocol}//${url.host}/api/github/callback`;
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;

  return NextResponse.redirect(githubAuthUrl);
}
