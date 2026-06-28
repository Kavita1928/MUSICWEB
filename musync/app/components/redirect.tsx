"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function Redirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated") return;

    const email = session.user?.email;
    if (!email) return;

    async function fetchUserId() {
      try {
        const res = await fetch(`/api/user/?email=${email}`, {
          credentials: "include",
        });

        if (!res.ok) {
          console.error("Failed to fetch user ID:", res.status);
          return;
        }

        const data = await res.json();

        router.push(`/dashboard/${data.userId}`);
      } catch (error) {
        console.error("Error fetching user ID:", error);
      }
    }

    fetchUserId();
  }, [status, session, router]);

  return null;
}
