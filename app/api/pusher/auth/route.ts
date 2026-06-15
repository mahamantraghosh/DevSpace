import { pusherServer } from "@/lib/pusher";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const data = await req.formData();
  const socketId = data.get("socket_id") as string;
  const channelName = data.get("channel_name") as string;
  const username = data.get("username") as string; // We'll pass this in the request

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
