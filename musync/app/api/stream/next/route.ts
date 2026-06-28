import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/app/lib/redis";

export async function GET(req: NextRequest) {
  try {
    const creatorId = req.nextUrl.searchParams.get("creatorId");

    if (!creatorId) {
      return NextResponse.json(
        { message: "creatorId is missing in query params" },
        { status: 400 }
      );
    }

    /* ---------------- Fetch Stream ---------------- */

    const stream = await prisma.stream.findUnique({
      where: { userId: creatorId },
      select: { id: true },
    });

    if (!stream) {
      return NextResponse.json(
        { message: "Stream not found for user", creatorId },
        { status: 404 }
      );
    }

    /* ---------------- Fetch Top Song from Redis ---------------- */

    // IMPORTANT: no withScores, no objects, pure members only
    const top = await redis.zrange(`queue:stream:${stream.id}`, 0, 0, {
      rev: true,
    });

    if (!top || top.length === 0) {
      return NextResponse.json(
        { message: "No songs in queue" },
        { status: 404 }
      );
    }

    // ✅ GUARANTEED string
    const songId =
      typeof top[0] === "string"
        ? top[0]
        : Buffer.isBuffer(top[0])
        ? top[0].toString()
        : String(top[0]);

    /* ---------------- Fetch Song from DB ---------------- */

    const song = await prisma.song.findUnique({
      where: { id: songId },
    });

    if (!song) {
      // defensive cleanup
      await redis.zrem(`queue:stream:${stream.id}`, songId);

      return NextResponse.json(
        {
          message: "Song not found in DB, cleaned dangling Redis entry",
        },
        { status: 404 }
      );
    }

    /* ---------------- DB + Redis Updates ---------------- */

    // Execute sequentially for safety + easier debugging
    await prisma.song.delete({
      where: { id: songId },
    });

    const removed = await redis.zrem(`queue:stream:${stream.id}`, songId);

    // 🔴 If this happens, something is VERY wrong
    if (removed === 0) {
      console.error("REDIS ZREM FAILED:", {
        streamId: stream.id,
        songId,
        currentQueue: await redis.zrange(`queue:stream:${stream.id}`, 0, -1),
      });
    }

    await redis.del(`song:${songId}`);
    await redis.del(`song:${songId}:upvotes`);

    /* ---------------- Success ---------------- */

    return NextResponse.json({
      message: "Next song",
      song,
    });
  } catch (err: any) {
    console.error("PLAY NEXT ERROR:", err);

    return NextResponse.json(
      {
        message: "Failed to fetch next song",
        error: err?.message,
      },
      { status: 500 }
    );
  }
}
