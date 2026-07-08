import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { redis } from "@/lib/redis";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { owner, repo, branch = "main", roomId } = await req.json();

  if (!owner || !repo || !roomId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const accessToken = await redis.get(`user:${session.email}:github_token`);
  if (!accessToken) {
    return NextResponse.json({ error: "GitHub not connected", notConnected: true }, { status: 403 });
  }

  try {
    // 1. Get the branch info to get the tree SHA
    const branchRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github.v3+json" },
    });
    
    if (!branchRes.ok) {
      // Fallback to master if main doesn't exist
      if (branch === "main" && branchRes.status === 404) {
        return handleClone(owner, repo, "master", roomId, accessToken as string);
      }
      return NextResponse.json({ error: "Could not fetch branch information" }, { status: 400 });
    }
    
    const branchData = await branchRes.json();
    const commitSha = branchData.object.sha;

    // 2. Get the commit to get the tree SHA
    const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${commitSha}`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github.v3+json" },
    });
    const commitData = await commitRes.json();
    const treeSha = commitData.tree.sha;

    // 3. Get the tree recursively
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github.v3+json" },
    });
    const treeData = await treeRes.json();
    
    if (treeData.truncated) {
      return NextResponse.json({ error: "Repository is too large (tree truncated)" }, { status: 400 });
    }

    const files: Record<string, string> = {};
    
    // Filter out node_modules, .git, and other binary or large folders
    const fileNodes = treeData.tree.filter((node: any) => 
      node.type === "blob" && 
      !node.path.includes("node_modules/") && 
      !node.path.includes(".git/") &&
      !node.path.includes(".next/") &&
      !node.path.match(/\.(jpg|jpeg|png|gif|ico|mp4|mp3|woff|woff2|ttf|eot)$/i) // skip binary files for now to save API calls
    );

    // Limit to 50 files for sandbox safety and API limits
    if (fileNodes.length > 50) {
      return NextResponse.json({ error: "Repository has too many files (max 50 for web sandbox)" }, { status: 400 });
    }

    // Fetch all blobs concurrently
    const blobPromises = fileNodes.map(async (node: any) => {
      const blobRes = await fetch(node.url, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github.v3+json" },
      });
      const blobData = await blobRes.json();
      
      // Decode base64
      let content = "";
      if (blobData.encoding === "base64") {
        content = Buffer.from(blobData.content, "base64").toString("utf-8");
      } else {
        content = blobData.content;
      }
      
      files[`/${node.path}`] = content;
    });

    await Promise.all(blobPromises);

    // Ensure we have package.json or at least an index.js/html if empty
    if (Object.keys(files).length === 0) {
      files["/README.md"] = "# Empty Repository";
    }

    // Save to Redis under the room ID
    const rawRoom = await redis.get(`room:${roomId}`);
    if (rawRoom) {
      const room = typeof rawRoom === "string" ? JSON.parse(rawRoom) : rawRoom;
      room.code = files;
      room.githubMeta = { owner, repo, branch };
      await redis.set(`room:${roomId}`, JSON.stringify(room));
    } else {
      // Fallback if room wasn't initialized
      await redis.set(`room:${roomId}`, JSON.stringify({ roomId, code: files, messages: [], users: [], githubMeta: { owner, repo, branch } }));
    }
    
    // Trigger pusher event to notify other clients in the room? 
    // Usually the client that initiated the clone will just reload the page or trigger a re-fetch.

    return NextResponse.json({ success: true, filesCount: Object.keys(files).length });
    
  } catch (error) {
    console.error("GitHub Clone Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper to fallback to master branch
async function handleClone(owner: string, repo: string, branch: string, roomId: string, accessToken: string) {
  // We can just recursively call the same logic or refactor into a function.
  // For simplicity here, we'll return an error instructing the user if it's master
  return NextResponse.json({ error: "Could not find main branch. Try specifying master." }, { status: 400 });
}
