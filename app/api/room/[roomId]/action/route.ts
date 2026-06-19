import { pusherServer } from "@/lib/pusher";
import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const body = await req.json();
  const { type, payload, socket_id } = body;
  const channelName = `presence-${roomId}`;

  if (!redis || !pusherServer) {
    return NextResponse.json({ error: "Server infrastructure not initialized." }, { status: 500 });
  }

  try {
    if (type === "editor-change") {
      const rawRoom = await redis.get(`room:${roomId}`);
      if (rawRoom) {
        const room = typeof rawRoom === "string" ? JSON.parse(rawRoom) : rawRoom;
        room.code[payload.codeType] = payload.value;
        await redis.set(`room:${roomId}`, JSON.stringify(room));
      }
    } else if (type === "send-message") {
      const rawRoom = await redis.get(`room:${roomId}`);
      if (rawRoom) {
        const room = typeof rawRoom === "string" ? JSON.parse(rawRoom) : rawRoom;
        const message = {
          id: Date.now().toString(),
          sender: payload.sender,
          text: payload.text,
          timestamp: Date.now()
        };
        room.messages.push(message);
        if (room.messages.length > 100) room.messages.shift();
        await redis.set(`room:${roomId}`, JSON.stringify(room));
        
        await pusherServer.trigger(channelName, "receive-message", message, socket_id ? { socket_id } : undefined);
        return NextResponse.json(message);
      }
    }

    if (type === "editor-change") {
      await pusherServer.trigger(channelName, "editor-update", payload, socket_id ? { socket_id } : undefined);
    } else if (type === "typing-status") {
      await pusherServer.trigger(channelName, "typing-update", payload, socket_id ? { socket_id } : undefined);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pusher/Redis Error:", error);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
