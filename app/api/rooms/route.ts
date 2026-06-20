import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const roomIdsStr = await redis.smembers(`user_rooms:${session.id}`);
    const rooms = [];
    
    for (const roomId of roomIdsStr) {
      const roomDataStr = await redis.get(`room_meta:${roomId}`);
      if (roomDataStr) {
        let parsed;
        if (typeof roomDataStr === 'string') {
          parsed = JSON.parse(roomDataStr);
        } else {
          parsed = roomDataStr;
        }
        rooms.push(parsed);
      }
    }
    
    // Sort by created at desc
    rooms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return NextResponse.json(rooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { roomId, name, visibility = "public", password = null } = await req.json();
    
    if (!roomId || !name) {
      return NextResponse.json({ error: "Missing roomId or name" }, { status: 400 });
    }

    const newRoom = {
      roomId,
      name,
      visibility,
      password: visibility === "private" ? password : null,
      creatorId: session.id,
      createdAt: new Date().toISOString()
    };

    // Store room metadata
    await redis.set(`room_meta:${roomId}`, JSON.stringify(newRoom));
    
    // Add to user's list of rooms
    await redis.sadd(`user_rooms:${session.id}`, roomId);
    
    return NextResponse.json(newRoom);
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
