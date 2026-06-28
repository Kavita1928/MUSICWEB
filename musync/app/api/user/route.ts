import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const userEmail = req.nextUrl.searchParams.get("email");

  const user = await prisma.user.findFirst({
    where: {
      email: userEmail ?? "",
    },
  });

  if (!user) {
    return NextResponse.json(
      {
        message: "User not found",
      },
      {
        status: 411,
      }
    );
  }

  return NextResponse.json({
    userId: user.id,
  });
}
