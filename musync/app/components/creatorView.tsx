"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/app/components/ui/card";
import { ArrowUp, ArrowDown, Share2 } from "lucide-react";
import { Navigation } from "../components/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import YouTubePlayer from "youtube-player";
import { YouTubeSearch } from "./searchBox";

/* ===================== TYPES ===================== */
interface Video {
  id: string;
  youtubeId: string;
  title: string;
  bigImageUrl: string;
  upvotes: number;
  haveUpvoted: boolean;
  userId: string;
}

interface PlaybackState {
  currentVideo?: Video;
  currentVideoId?: string;
  youtubeId: string;
  isPlaying: boolean;
  currentTime: number; // seconds
  timestamp: number; // server or sender time (ms)
}

const REFRESH_INTERVAL_MS = 10_000;

export default function CreatorView({
  creatorId,
  playVideo = false,
}: {
  creatorId: string;
  playVideo: boolean;
}) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoPreview, setVideoPreview] = useState<{
    title: string;
    thumbnail: string;
  } | null>(null);
  const [currentVideo, setCurrentVideo] = useState<Video>();
  const [youtubeVideoId, setYoutubeVideoId] = useState("");
  const [queue, setQueue] = useState<Video[]>([]);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const videoPlayerRef = useRef<any>(null);
  const [isPlayingNext, setIsPlayingNext] = useState(false);
  const [isAddingToQueue, setIsAddingToQueue] = useState(false);
  const [voteLoading, setVoteLoading] = useState<Record<string, boolean>>({});
  const { status } = useSession();
  const router = useRouter();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  // const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  /* ================== WEBSOCKET CONNECTION ================== */
  useEffect(() => {
    if (!creatorId) return;

    // Close existing socket if creatorId changes
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    const socket = new WebSocket("wss://musicweb-d38j.onrender.com");

    socketRef.current = socket;
    setSocket(socket);

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: "sender",
          creatorId,
        }),
      );
    };

    socket.onerror = (err) => {
      console.error("Sender WS error", err);
    };

    socket.onclose = () => {
      console.log("Sender WS closed");
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [creatorId]);

  /* ===================== AUTH + POLLING ===================== */
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    refreshStreams();
    const interval = setInterval(refreshStreams, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [status]);

  /* ===================== YOUTUBE PLAYER ===================== */
  useEffect(() => {
    if (!videoPlayerRef.current) {
      return;
    }

    let player = YouTubePlayer(videoPlayerRef.current);
    player.loadVideoById(currentVideo?.youtubeId!);

    player.playVideo();

    player.on("stateChange", onYTStateChange);

    return () => {
      player.destroy();
    };
  }, [currentVideo, videoPlayerRef, youtubeVideoId]);

  /* ===================== SEND PLAYBACK STATE ===================== */
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (currentVideo) {
  //       sendPlaybackState();
  //     }
  //   }, 60_000);

  //   return () => clearInterval(interval);
  // }, [currentVideo]);

  function sendPlaybackState(overrides?: Partial<PlaybackState>) {
    if (!socketRef.current) return;

    const state: PlaybackState = {
      youtubeId: currentVideo?.youtubeId ?? "",
      currentVideo,
      currentVideoId: currentVideo?.id,
      isPlaying: overrides?.isPlaying ?? false,
      currentTime: overrides?.currentTime ?? 0,
      timestamp: Date.now(),
      ...overrides,
    };

    socketRef.current.send(
      JSON.stringify({
        type: "PLAYBACK_STATE",
        creatorId,
        state,
      }),
    );
  }

  /* ===================== YT STATE CHANGE ===================== */
  async function onYTStateChange(event: any) {
    if (event.data === 1) {
      sendPlaybackState({
        isPlaying: true,
        currentTime: await event.target.getCurrentTime(),
      });
    }

    if (event.data === 2) {
      sendPlaybackState({
        isPlaying: false,
        currentTime: await event.target.getCurrentTime(),
      });
    }

    if (event.data === 0) {
      await nextVideo();
    }
  }

  /* ===================== FETCH QUEUE ===================== */
  async function refreshStreams() {
    try {
      const res = await fetch(`/api/stream?creatorId=${creatorId}`, {
        credentials: "include",
      });

      if (!res.ok) return;

      const data = await res.json();

      const mappedQueue: Video[] = (data.songs ?? []).map((song: any) => ({
        id: song.id,
        youtubeId: song.songId,
        title: song.title,
        bigImageUrl: song.bigImgUrl,
        upvotes: song.upvotes,
        haveUpvoted: song.haveUpvoted,
        userId: song.addedById,
      }));

      setQueue(mappedQueue);
    } catch (err) {
      console.error("Failed to fetch queue:", err);
    }
  }

  /* ===================== PLAY NEXT ===================== */
  async function nextVideo() {
    try {
      setIsPlayingNext(true);

      const res = await fetch(`/api/stream/next?creatorId=${creatorId}`, {
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        console.warn("Play next failed:", err?.message);
        return;
      }

      const data = await res.json();
      const song = data.song;

      if (!song) return;

      // 🔁 Map DB song → UI Video
      const nextVideo: Video = {
        id: song.id,
        youtubeId: song.songId,
        title: song.title,
        bigImageUrl: song.bigImgUrl,
        upvotes: 0,
        haveUpvoted: false,
        userId: song.addedById,
      };

      setCurrentVideo(nextVideo);
      setCurrentVideoId(song.id);

      setYoutubeVideoId(song.songId);

      await refreshStreams();

      setTimeout(() => {
        sendPlaybackState({
          currentVideo: nextVideo,
          currentVideoId: nextVideo.id,
          youtubeId: nextVideo.youtubeId,
          isPlaying: true,
          currentTime: 0,
        });
      }, 500);
    } catch (err) {
      console.error("Failed to play next video:", err);
    } finally {
      setIsPlayingNext(false);
    }
  }

  /* ===================== YT PREVIEW ===================== */
  const extractYoutubeId = (url: string): string | null => {
    const match = url.match(
      /^(?:(?:https?:)?\/\/)?(?:www\.)?(?:m\.)?(?:youtu(?:be)?\.com\/(?:v\/|embed\/|watch(?:\/|\?v=))|youtu\.be\/)((?:\w|-){11})/,
    );
    return match ? match[1] : null;
  };

  const handlePreview = () => {
    const videoId = extractYoutubeId(youtubeUrl);
    if (!videoId) return;

    setVideoPreview({
      title: `Video ${videoId.slice(0, 6)}...`,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    });
  };

  /* ========================= SHARE ========================= */
  const handleShare = () => {
    const link = `${window.location.origin}/creator/${creatorId}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard.");
  };

  /* ====================== ADD TO QUEUE ====================== */
  const handleAddToQueue = async () => {
    if (!youtubeUrl) return;

    try {
      setIsAddingToQueue(true);

      const res = await fetch("/api/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: youtubeUrl,
          streamOwnerId: creatorId,
        }),
      });

      if (!res.ok) throw new Error();

      setYoutubeUrl("");
      setVideoPreview(null);
      refreshStreams();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add song");
    } finally {
      setIsAddingToQueue(false);
    }
  };

  /* ========================= VOTING ========================= */
  async function handleUpvote(id: string) {
    setVoteLoading((p) => ({ ...p, [id]: true }));
    await fetch("/api/stream/upvote", {
      method: "POST",
      body: JSON.stringify({ songId: id }),
    });
    refreshStreams();
    setVoteLoading((p) => ({ ...p, [id]: false }));
  }

  async function handleDownvote(id: string) {
    setVoteLoading((p) => ({ ...p, [id]: true }));
    await fetch("/api/stream/downvote", {
      method: "POST",
      body: JSON.stringify({ songId: id }),
    });
    refreshStreams();
    setVoteLoading((p) => ({ ...p, [id]: false }));
  }

  /* =================== RENDER =================== */
  return (
    <div className="flex flex-col">
      <Toaster richColors />
      <Navigation />

      <main className="min-h-screen bg-background/95 backdrop-blur text-foreground pt-16">
        <div className="max-w-7xl mx-auto p-4 lg:p-6">
          <div className="flex justify-between items-center">
            {/* HEADER */}
            <div className="mb-8 text-center lg:text-left">
              <h1 className="text-4xl lg:text-5xl font-bold">Stream Queue</h1>
              <p className="text-muted-foreground text-lg mt-2">
                Submit and vote for the next song
              </p>
            </div>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-6 py-4 bg-accent cursor-pointer text-accent-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              <Share2 className="w-4 h-4" />
              Share Stream
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT SIDE */}
            <div className="lg:col-span-2 space-y-6">
              {/* CURRENT VIDEO */}
              <Card className="overflow-hidden rounded-2xl bg-background/40 border border-border/40 backdrop-blur-xl shadow-xl">
                <div className="aspect-video bg-muted/20 relative">
                  {youtubeVideoId ?
                    <div
                      className="w-full"
                      id="player"
                      ref={videoPlayerRef}
                    ></div>
                  : <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <div className="text-4xl mb-2 opacity-50">▶</div>
                        <p>No video selected</p>
                      </div>
                    </div>
                  }
                </div>

                {currentVideo && (
                  <div className="p-5 bg-background/40 border-t border-border/40 backdrop-blur-xl">
                    <h2 className="text-xl font-bold">{currentVideo.title}</h2>
                    <p className="text-muted-foreground text-sm">
                      Submitted by {currentVideo.userId}
                    </p>
                  </div>
                )}
              </Card>

              {/* ADD VIDEO FORM */}
              <Card className="p-6 rounded-2xl bg-background/40 border border-border/40 backdrop-blur-xl shadow-lg">
                <h3 className="text-xl font-bold mb-4">Search & Add Song</h3>

                <YouTubeSearch creatorId={creatorId} onAdded={refreshStreams} />
              </Card>
            </div>

            {/* RIGHT SIDE QUEUE */}
            <div>
              <Card className="p-4 h-fit rounded-2xl bg-background/40 border border-border/40 shadow-xl backdrop-blur-xl">
                <h3 className="text-xl font-bold mb-4">Upcoming Queue</h3>

                <div className="space-y-3 max-h-[700px] overflow-y-auto">
                  {
                    queue.length === 0 ?
                      // EMPTY STATE
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground py-12">
                        <div className="text-center">
                          <p>No video in queue</p>
                        </div>
                      </div>
                      // QUEUE LIST
                    : queue.map((item) => {
                        if (!item.id) return null;
                        return (
                          <div
                            key={item.id}
                            onClick={() => setCurrentVideoId(item.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer backdrop-blur ${
                              currentVideoId === item.id ?
                                "bg-accent/20 border-accent"
                              : "bg-background/40 border-border/40 hover:bg-background/60"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* VOTING */}
                              <div className="flex flex-col items-center gap-1">
                                {item.haveUpvoted ?
                                  <button
                                    disabled={voteLoading[item.id]}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownvote(item.id);
                                    }}
                                    className="p-1 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                  >
                                    <ArrowDown className="w-4 h-4" />
                                  </button>
                                : <button
                                    disabled={voteLoading[item.id]}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpvote(item.id);
                                    }}
                                    className="p-1 hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                  >
                                    <ArrowUp className="w-4 h-4" />
                                  </button>
                                }

                                <span className="text-sm font-bold text-accent">
                                  {item.upvotes}
                                </span>
                              </div>

                              {/* THUMBNAIL + TITLE */}
                              <div className="flex-1 flex gap-3">
                                <img
                                  src={item.bigImageUrl}
                                  className="w-12 h-9 rounded object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold truncate">
                                    {item.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    by {item.userId}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })

                  }
                </div>
              </Card>

              {playVideo && (
                <button
                  disabled={isPlayingNext}
                  onClick={nextVideo}
                  className="px-6 py-2 w-full bg-red-500 text-white rounded-lg font-semibold 
             hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isPlayingNext ? "Loading..." : "Play Next"}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
