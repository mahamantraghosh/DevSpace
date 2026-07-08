import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { redis } from "@/lib/redis";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId, message, owner: reqOwner, repo: reqRepo, branch: reqBranch } = await req.json();

  if (!roomId || !message) {
    return NextResponse.json({ error: "Missing roomId or message" }, { status: 400 });
  }

  const accessToken = await redis.get(`user:${session.email}:github_token`);
  if (!accessToken) {
    return NextResponse.json({ error: "GitHub not connected", notConnected: true }, { status: 403 });
  }

  try {
    // 0. Get the files and github meta from Redis
    const rawRoom = await redis.get(`room:${roomId}`);
    if (!rawRoom) {
      return NextResponse.json({ error: "Room files not found" }, { status: 404 });
    }
    const room = typeof rawRoom === 'string' ? JSON.parse(rawRoom) : rawRoom;
    const files: Record<string, string> = room.code || {};
    const meta = room.githubMeta || {};

    const owner = reqOwner || meta.owner;
    const repo = reqRepo || meta.repo;
    const branch = reqBranch || meta.branch || "main";

    if (!owner || !repo) {
      return NextResponse.json({ error: "No GitHub repository linked to this room. Please clone a repository first." }, { status: 400 });
    }

    // 1. Get the current branch reference to get the latest commit SHA
    let activeBranch = branch;
    let refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${activeBranch}`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github.v3+json" },
    });
    
    if (!refRes.ok) {
      if (activeBranch === "main") {
        activeBranch = "master";
        refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${activeBranch}`, {
          headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github.v3+json" },
        });
      }
      if (!refRes.ok) {
        return NextResponse.json({ error: `Could not fetch branch ${branch} or master` }, { status: 400 });
      }
    }
    const refData = await refRes.json();
    const latestCommitSha = refData.object.sha;

    // 2. Get the commit to get the base tree SHA
    const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github.v3+json" },
    });
    const commitData = await commitRes.json();
    const baseTreeSha = commitData.tree.sha;

    // 3. Create blobs for all modified files
    // In a real implementation, we should diff against the base tree, but for a web IDE,
    // we can just upload all current files. The Git database handles unchanged files automatically (identical blobs have the same SHA).
    const treePayload = [];
    
    for (const [path, content] of Object.entries(files)) {
      // Remove leading slash
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      
      const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${accessToken}`, 
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content: content,
          encoding: "utf-8"
        })
      });
      const blobData = await blobRes.json();
      
      treePayload.push({
        path: cleanPath,
        mode: "100644",
        type: "blob",
        sha: blobData.sha
      });
    }

    // 4. Create a new tree
    const createTreeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${accessToken}`, 
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treePayload
      })
    });
    const newTreeData = await createTreeRes.json();
    const newTreeSha = newTreeData.sha;

    // 5. Create a new commit
    const createCommitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${accessToken}`, 
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: message,
        tree: newTreeSha,
        parents: [latestCommitSha]
      })
    });
    const newCommitData = await createCommitRes.json();

    if (!createCommitRes.ok) {
      if (createCommitRes.status === 422 && newCommitData.message?.includes("is the same as its parent")) {
        return NextResponse.json({ error: "No changes detected to commit" }, { status: 400 });
      }
      return NextResponse.json({ error: newCommitData.message || "Failed to create commit" }, { status: 400 });
    }

    const newCommitSha = newCommitData.sha;

    // 6. Update the branch reference
    const updateRefRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${activeBranch}`, {
      method: 'PATCH',
      headers: { 
        Authorization: `Bearer ${accessToken}`, 
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sha: newCommitSha,
        force: false
      })
    });

    if (!updateRefRes.ok) {
      return NextResponse.json({ error: "Failed to update branch reference" }, { status: 400 });
    }

    return NextResponse.json({ success: true, commitUrl: newCommitData.html_url });
    
  } catch (error) {
    console.error("GitHub Commit Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
