import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { redis } from "@/app/lib/redis";

/* ============================= CONSTANTS ============================= */
const AddSongSchema = z.object({
  videoId: z.string().length(11),
  title: z.string(),
  smallImgUrl: z.string().url(),
  bigImgUrl: z.string().url(),
  streamOwnerId: z.string(),
});

/* ============================= POST: ADD SONG ============================= */

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const normalizedBody = {
      ...body,
      streamOwnerId: Array.isArray(body.streamOwnerId)
        ? body.streamOwnerId[0]
        : body.streamOwnerId,
    };

    const data = AddSongSchema.parse(normalizedBody);

    /* ---------- current user ---------- */
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    /* ---------- stream ---------- */
    const stream = await prisma.stream.findUnique({
      where: { userId: data.streamOwnerId },
    });

    if (!stream) {
      return NextResponse.json(
        { message: "Stream not found" },
        { status: 404 }
      );
    }

    /* ---------- create song ---------- */
    const song = await prisma.song.create({
      data: {
        songId: data.videoId,
        url: `https://www.youtube.com/watch?v=${data.videoId}`,
        title: data.title,
        smallImgUrl: data.smallImgUrl,
        bigImgUrl: data.bigImgUrl,
        streamId: stream.id,
        addedById: user.id,
      },
    });

    /* ================= REDIS ================= */

    const TTL = 60 * 60 * 24; // 24h

    // 1️⃣ Queue
    await redis.zadd(`queue:stream:${stream.id}`, {
      score: 0,
      member: song.id,
    });

    // 2️⃣ Metadata cache
    await redis.hset(`song:${song.id}`, {
      id: song.id,
      songId: song.songId,
      title: song.title,
      bigImgUrl: song.bigImgUrl,
      addedById: song.addedById,
    });

    // 3️⃣ Upvotes
    await redis.del(`song:${song.id}:upvotes`);

    // TTLs
    await redis.expire(`queue:stream:${stream.id}`, TTL);
    await redis.expire(`song:${song.id}`, TTL);
    await redis.expire(`song:${song.id}:upvotes`, TTL);

    return NextResponse.json({ songId: song.id });
  } catch (e) {
    console.error("ADD SONG ERROR:", e);
    return NextResponse.json(
      { message: "Failed to add song" },
      { status: 400 }
    );
  }
}

/* ============================ GET: FETCH QUEUE ============================ */

export async function GET(req: NextRequest) {
  try {
    const streamOwnerId = req.nextUrl.searchParams.get("creatorId");
    const session = await getServerSession();

    if (!session?.user?.email || !streamOwnerId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const stream = await prisma.stream.findUnique({
      where: { userId: streamOwnerId },
    });

    if (!stream) {
      return NextResponse.json({ songs: [] });
    }

    const leaderboard = await redis.zrange(`queue:stream:${stream.id}`, 0, -1, {
      rev: true,
      withScores: true,
    });

    const songs = [];

    for (let i = 0; i < leaderboard.length; i += 2) {
      const songId = leaderboard[i];
      const score = leaderboard[i + 1];

      const meta = await redis.hgetall(`song:${songId}`);
      if (!meta?.id) continue;

      const haveUpvoted = await redis.sismember(
        `song:${songId}:upvotes`,
        user.id
      );

      songs.push({
        id: songId,
        songId: meta.songId,
        title: meta.title,
        bigImgUrl: meta.bigImgUrl,
        upvotes: score,
        haveUpvoted: Boolean(haveUpvoted),
        addedById: meta.addedById,
      });
    }

    return NextResponse.json({ songs });
  } catch (e) {
    console.error("FETCH QUEUE ERROR:", e);
    return NextResponse.json(
      { message: "Error fetching queue" },
      { status: 500 }
    );
  }
}
