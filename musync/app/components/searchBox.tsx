"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

interface YouTubeVideo {
  id?: {
    videoId?: string;
  };
  snippet?: {
    title?: string;
    thumbnails?: {
      default?: { url?: string };
      medium?: { url?: string };
      high?: { url?: string };
    };
  };
}

export function YouTubeSearch({
  creatorId,
  onAdded,
}: {
  creatorId: string;
  onAdded?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [adding, setAdding] = useState<Record<string, boolean>>({});

  async function handleSearch() {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();

      const safeResults = (data?.items ?? []).filter(
        (v: YouTubeVideo) => v?.id?.videoId && v?.snippet?.title
      );

      setResults(safeResults);
    } catch {
      toast.error("Failed to search YouTube");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(video: YouTubeVideo) {
    const videoId = video.id?.videoId;
    if (!videoId) return;

    setAdding((p) => ({ ...p, [videoId]: true }));

    const thumbnails = video.snippet?.thumbnails;

    const bigImgUrl =
      thumbnails?.high?.url ??
      thumbnails?.medium?.url ??
      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    const smallImgUrl =
      thumbnails?.medium?.url ??
      thumbnails?.default?.url ??
      `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

    try {
      const res = await fetch("/api/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          title: video.snippet?.title ?? "Unknown title",
          bigImgUrl,
          smallImgUrl,
          streamOwnerId: creatorId,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success("Added to queue");
      onAdded?.();
    } catch {
      toast.error("Failed to add song");
    } finally {
      setAdding((p) => ({ ...p, [videoId]: false }));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search songs on YouTube..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={loading}>
          <Search className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {loading && (
          <p className="text-muted-foreground text-sm">Searching...</p>
        )}

        {!loading &&
          results.map((video) => {
            const videoId = video.id?.videoId;
            if (!videoId) return null;

            const thumbnails = video.snippet?.thumbnails;
            const thumb =
              thumbnails?.medium?.url ??
              thumbnails?.default?.url ??
              "/placeholder.png";

            return (
              <div
                key={videoId}
                className="flex items-center gap-3 p-3 rounded-xl border bg-background/40"
              >
                <img
                  src={thumb}
                  className="w-24 h-16 rounded object-cover"
                  alt=""
                />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {video.snippet?.title}
                  </p>
                </div>

                <Button
                  size="sm"
                  disabled={adding[videoId]}
                  onClick={() => handleAdd(video)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
      </div>
    </div>
  );
}
