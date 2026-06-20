import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getSession } from "@/lib/auth";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { roomId } = await params;
    const { name, visibility, password } = await req.json();

    if (!name || !visibility) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const rawMeta = await redis.get(`room_meta:${roomId}`);
    if (!rawMeta) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const meta = typeof rawMeta === "string" ? JSON.parse(rawMeta) : rawMeta;

    if (meta.creatorId !== session.id) {
      return NextResponse.json({ error: "Forbidden: You are not the creator of this room" }, { status: 403 });
    }

    const updatedRoom = {
      ...meta,
      name,
      visibility,
      password: visibility === "private" ? (password || null) : null
    };

    await redis.set(`room_meta:${roomId}`, JSON.stringify(updatedRoom));

    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error("Error updating room:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { roomId } = await params;

    const rawMeta = await redis.get(`room_meta:${roomId}`);
    if (!rawMeta) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const meta = typeof rawMeta === "string" ? JSON.parse(rawMeta) : rawMeta;

    if (meta.creatorId !== session.id) {
      return NextResponse.json({ error: "Forbidden: You are not the creator of this room" }, { status: 403 });
    }

    // Delete room state and metadata
    await redis.del(`room_meta:${roomId}`);
    await redis.del(`room:${roomId}`);
    
    // Remove from user's list
    await redis.srem(`user_rooms:${session.id}`, roomId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting room:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
