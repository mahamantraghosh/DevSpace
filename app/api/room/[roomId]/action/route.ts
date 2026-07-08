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
    if (type === "editor-change" || type === "file-create") {
      const rawRoom = await redis.get(`room:${roomId}`);
      if (rawRoom) {
        const room = typeof rawRoom === "string" ? JSON.parse(rawRoom) : rawRoom;
        
        // MIGRATION: Convert old code object to files object if needed
        if (room.code && room.code.html !== undefined && !room.code['/index.html']) {
          room.code['/index.html'] = room.code.html || "";
          room.code['/styles.css'] = room.code.css || "";
          room.code['/script.js'] = room.code.js || "";
          delete room.code.html;
          delete room.code.css;
          delete room.code.js;
        }

        room.code[payload.filename] = payload.value || "";
        await redis.set(`room:${roomId}`, JSON.stringify(room));
      }
    } else if (type === "file-delete") {
      const rawRoom = await redis.get(`room:${roomId}`);
      if (rawRoom) {
        const room = typeof rawRoom === "string" ? JSON.parse(rawRoom) : rawRoom;
        if (room.code && room.code[payload.filename] !== undefined) {
          delete room.code[payload.filename];
          await redis.set(`room:${roomId}`, JSON.stringify(room));
        }
      }
    } else if (type === "file-rename") {
      const rawRoom = await redis.get(`room:${roomId}`);
      if (rawRoom) {
        const room = typeof rawRoom === "string" ? JSON.parse(rawRoom) : rawRoom;
        if (room.code) {
          if (payload.isFolder) {
            Object.keys(room.code).forEach(key => {
              if (key.startsWith(payload.oldPath + "/")) {
                const newKey = payload.newPath + key.slice(payload.oldPath.length);
                room.code[newKey] = room.code[key];
                delete room.code[key];
              }
            });
          } else {
            if (room.code[payload.oldPath] !== undefined) {
              room.code[payload.newPath] = room.code[payload.oldPath];
              delete room.code[payload.oldPath];
            }
          }
          await redis.set(`room:${roomId}`, JSON.stringify(room));
        }
      }
    } else if (type === "files-import") {
      const rawRoom = await redis.get(`room:${roomId}`);
      if (rawRoom) {
        const room = typeof rawRoom === "string" ? JSON.parse(rawRoom) : rawRoom;
        if (room.code) {
          room.code = { ...room.code, ...payload.files };
          await redis.set(`room:${roomId}`, JSON.stringify(room));
        }
      }
    } else if (type === "send-message") {
async function generateAIResponse(roomId: string, userText: string, pusherServer: any, redis: any) {
  try {
    const channelName = `presence-${roomId}`;
    await pusherServer.trigger(channelName, "typing-update", { username: "Mantra AI", isTyping: true });
    
    let aiText = "I'm sorry, I couldn't process that.";
    const currentRawRoom = await redis.get(`room:${roomId}`);
    
    if (currentRawRoom) {
      const room = typeof currentRawRoom === "string" ? JSON.parse(currentRawRoom) : currentRawRoom;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        aiText = "Mantra AI is currently offline (Missing API Key).";
      } else {
        const filesContext = room.code 
          ? "Current workspace files:\n" + Object.entries(room.code).map(([name, content]) => `--- ${name} ---\n${content}\n`).join("\n") 
          : "Workspace is empty.";
          
        const prompt = `You are Mantra AI, an expert pair programmer inside the DevSpace IDE. 
Here is the context of the user's workspace:
${filesContext}

The user sent this message in the chat: "${userText}"
Please provide a helpful, concise response. Use Markdown for code formatting.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });
        
        const data = await response.json();
        if (data.candidates && data.candidates[0].content.parts[0].text) {
          aiText = data.candidates[0].content.parts[0].text;
        } else {
          console.error("Gemini Response Error:", data);
          aiText = "Oops! My brain experienced an error. Check the server logs.";
        }
      }

      const aiMessage = {
        id: crypto.randomUUID(),
        sender: "Mantra AI",
        text: aiText,
        timestamp: Date.now()
      };
      
      room.messages.push(aiMessage);
      if (room.messages.length > 100) room.messages.shift();
      await redis.set(`room:${roomId}`, JSON.stringify(room));
      
      await pusherServer.trigger(channelName, "typing-update", { username: "Mantra AI", isTyping: false });
      await pusherServer.trigger(channelName, "receive-message", aiMessage);
    }
  } catch (err) {
    console.error("AI Error:", err);
    try {
      await pusherServer.trigger(`presence-${roomId}`, "typing-update", { username: "Mantra AI", isTyping: false });
    } catch(e) {}
  }
}

      const rawRoom = await redis.get(`room:${roomId}`);
      if (rawRoom) {
        const room = typeof rawRoom === "string" ? JSON.parse(rawRoom) : rawRoom;
        const message = {
          id: crypto.randomUUID(),
          sender: payload.sender,
          text: payload.text,
          timestamp: Date.now()
        };
        room.messages.push(message);
        if (room.messages.length > 100) room.messages.shift();
        await redis.set(`room:${roomId}`, JSON.stringify(room));
        
        await pusherServer.trigger(channelName, "receive-message", message, socket_id ? { socket_id } : undefined);
        
        if (payload.text.includes("@MantraAI")) {
          // Await the AI response so Vercel doesn't kill the serverless function before it finishes
          await generateAIResponse(roomId, payload.text, pusherServer, redis);
        }
        
        return NextResponse.json(message);
      }
    }

    if (type === "editor-change") {
      await pusherServer.trigger(channelName, "editor-update", payload, socket_id ? { socket_id } : undefined);
    } else if (type === "file-create") {
      await pusherServer.trigger(channelName, "file-create", payload, socket_id ? { socket_id } : undefined);
    } else if (type === "file-delete") {
      await pusherServer.trigger(channelName, "file-delete", payload, socket_id ? { socket_id } : undefined);
    } else if (type === "typing-status") {
      await pusherServer.trigger(channelName, "typing-update", payload, socket_id ? { socket_id } : undefined);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pusher/Redis Error:", error);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
