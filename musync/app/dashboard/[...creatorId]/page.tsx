"use client";

import { useParams } from "next/navigation";
import CreatorView from "@/app/components/creatorView";

export default function Dashboard() {
  const { creatorId } = useParams<{ creatorId: string }>();

  return <CreatorView creatorId={creatorId} playVideo={true} />;
}
