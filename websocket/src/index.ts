import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 4000 });

type Room = {
  sender?: WebSocket;
  receivers: Set<WebSocket>;
};

const rooms = new Map<string, Room>();

let socketCounter = 0;

// Attach an ID to each socket (for logging)
function attachSocketId(ws: WebSocket) {
  (ws as any)._id = ++socketCounter;
}

function socketId(ws: WebSocket) {
  return (ws as any)._id ?? "unknown";
}

function normalizeCreatorId(input: unknown): string | null {
  if (Array.isArray(input)) return input[0] ?? null;
  if (typeof input === "string") return input;
  return null;
}

wss.on("connection", (ws: WebSocket) => {
  attachSocketId(ws);

  console.log(`🧩 New socket connected | socketId=${socketId(ws)}`);

  ws.on("error", console.error);

  let roomId: string | null = null;
  let role: "sender" | "receiver" | null = null;

  ws.on("message", (data: Buffer) => {
    const message = JSON.parse(data.toString());

    /**
     * =====================
     * SENDER JOIN
     * =====================
     */
    if (message.type === "sender") {
      const creatorId = normalizeCreatorId(message.creatorId);
      if (!creatorId) return;

      roomId = creatorId;
      role = "sender";

      if (!rooms.has(roomId)) {
        rooms.set(roomId, { sender: undefined, receivers: new Set() });
      }

      const room = rooms.get(roomId)!;

      if (room.sender && room.sender !== ws) {
        console.warn(
          `🚫 Duplicate sender blocked | room=${roomId} | socketId=${socketId(
            ws
          )}`
        );
        ws.close();
        return;
      }

      room.sender = ws;

      console.log(
        `🟢 Sender connected | room=${roomId} | socketId=${socketId(ws)}`
      );
      console.log(
        `📊 Receivers in room: ${[...room.receivers].map(socketId).join(", ")}`
      );
      return;
    }

    /**
     * =====================
     * RECEIVER JOIN
     * =====================
     */
    if (message.type === "receiver") {
      const creatorId = normalizeCreatorId(message.creatorId);
      if (!creatorId) return;

      roomId = creatorId;
      role = "receiver";

      if (!rooms.has(roomId)) {
        rooms.set(roomId, { sender: undefined, receivers: new Set() });
      }

      const room = rooms.get(roomId)!;
      room.receivers.add(ws);

      console.log(
        `🔵 Receiver joined | room=${roomId} | socketId=${socketId(ws)}`
      );
      console.log(
        `📊 All receivers: ${[...room.receivers].map(socketId).join(", ")}`
      );
      return;
    }

    /**
     * =====================
     * PLAYBACK STATE
     * =====================
     */
    if (message.type === "PLAYBACK_STATE") {
      if (!roomId || role !== "sender") return;

      const room = rooms.get(roomId);
      if (!room) return;

      console.log(
        `📡 Broadcasting PLAYBACK_STATE | room=${roomId} | receivers=${room.receivers.size}`
      );

      for (const receiver of room.receivers) {
        if (receiver.readyState !== WebSocket.OPEN) {
          console.warn(
            `🧹 Removing CLOSED receiver | socketId=${socketId(receiver)}`
          );
          room.receivers.delete(receiver);
          continue;
        }

        console.log(
          `➡️ Sending PLAYBACK_STATE to receiver | socketId=${socketId(
            receiver
          )}`
        );

        receiver.send(
          JSON.stringify({
            type: "PLAYBACK_STATE",
            state: message.state,
          })
        );
      }
    }
  });

  ws.on("close", () => {
    console.log(
      `❌ Socket closed | socketId=${socketId(
        ws
      )} | role=${role} | room=${roomId}`
    );

    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    if (role === "sender" && room.sender === ws) {
      room.sender = undefined;
    }

    if (role === "receiver") {
      room.receivers.delete(ws);
    }

    if (!room.sender && room.receivers.size === 0) {
      rooms.delete(roomId);
      console.log(`🗑️ Room deleted | room=${roomId}`);
    }
  });

  ws.send(JSON.stringify({ type: "CONNECTED" }));
});
