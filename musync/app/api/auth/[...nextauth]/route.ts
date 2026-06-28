import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "../../../../app/lib/prisma";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async signIn({ user }) {
      const email = user.email ?? undefined;

      if (!email) {
        return false;
      }

      try {
        await prisma.$transaction(async (tx) => {
          const dbUser = await tx.user.upsert({
            where: { email },
            update: {},
            create: {
              email,
              provider: "Google",
            },
          });

          await tx.stream.upsert({
            where: { userId: dbUser.id },
            update: {},
            create: {
              userId: dbUser.id,
              active: true,
            },
          });
        });

        return true;
      } catch (error) {
        console.error("Sign-in failed:", error);
        return false;
      }
    },
  },
});

export { handler as GET, handler as POST };
