"use client";

import ParticipantView from "@/app/components/participantView";
import { useParams } from "next/navigation";

export default function () {
  const { creatorId } = useParams<{ creatorId: string }>();

  return (
    <div>
      <ParticipantView creatorId={creatorId} playVideo={false} />
    </div>
  );
}
