import { pusherServer } from "@/lib/pusher";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let socketId: string | null = null;
  let channelName: string | null = null;
  let username: string | null = null;

  if (!pusherServer) {
    return new Response("Pusher server not initialized", { status: 500 });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const bodyText = await req.text();
      const params = new URLSearchParams(bodyText);
      socketId = params.get("socket_id");
      channelName = params.get("channel_name");
      username = params.get("username");
    } else {
      const data = await req.formData();
      socketId = data.get("socket_id") as string;
      channelName = data.get("channel_name") as string;
      username = data.get("username") as string;
    }
  } catch (err) {
    console.error("Auth Parsing Error:", err);
  }

  if (!socketId || !channelName || !username) {
    return new Response("Missing parameters", { status: 400 });
  }

  const presenceData = {
    user_id: socketId,
    user_info: {
      username: username,
    },
  };

  try {
    const authResponse = pusherServer.authorizeChannel(socketId, channelName, presenceData);
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("Pusher Auth Error:", error);
    return new Response("Auth failed", { status: 500 });
  }
}
