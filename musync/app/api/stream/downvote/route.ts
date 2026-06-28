import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { z } from "zod";
import { voting_ratelimit } from "@/app/lib/rateLimiter";
import { redis } from "@/app/lib/redis";

/* ============================= SCHEMA ============================= */

const DownvoteSchema = z.object({
  songId: z.string(),
});

/* ============================= POST ============================= */

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const { success } = await voting_ratelimit.limit(ip);
  if (!success) {
    return NextResponse.json({ message: "Rate Limited" }, { status: 429 });
  }

  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json(
      { message: "Unauthenticated user" },
      { status: 403 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json(
      { message: "Unauthenticated user" },
      { status: 403 }
    );
  }

  try {
    const { songId } = DownvoteSchema.parse(await req.json());

    /* ---------------- Fetch Song ---------------- */

    const song = await prisma.song.findUnique({
      where: { id: songId },
      select: { streamId: true },
    });

    if (!song) {
      return NextResponse.json({ message: "Song not found" }, { status: 404 });
    }

    /* ---------------- DB Delete ---------------- */

    await prisma.songUpVote.delete({
      where: {
        userId_songId: {
          userId: user.id,
          songId,
        },
      },
    });

    /* ---------------- Redis Writes ---------------- */

    // 1️⃣ Decrement song score in stream queue
    await redis.zincrby(`queue:stream:${song.streamId}`, -1, songId);

    // 2️⃣ Remove voter from set
    await redis.srem(`song:${songId}:upvotes`, user.id);

    return NextResponse.json({ message: "Downvoted!" });
  } catch (e: any) {
    // Vote doesn't exist
    if (e.code === "P2025") {
      return NextResponse.json(
        { message: "You haven't upvoted this song" },
        { status: 409 }
      );
    }

    console.error("DOWNVOTE ERROR:", e);

    return NextResponse.json(
      { message: "Error while downvoting" },
      { status: 500 }
    );
  }
}
