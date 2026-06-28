"use client";

import { Play } from "lucide-react";

export function Hero() {
  return (
    <section className="min-h-screen pt-32 pb-20 flex flex-col justify-center bg-linear-to-b from-background via-background to-background/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-accent font-semibold tracking-widest text-sm uppercase">
                The Future of Streaming
              </p>
              <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight text-balance">
                Let Your Fans Choose
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                Give your audience real-time control over the music. Stream
                live, let fans vote on every track, and create unforgettable
                moments together.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button className="px-8 py-4 bg-accent text-accent-foreground rounded-xl font-bold hover:opacity-90 transition-all transform hover:scale-105 flex items-center justify-center gap-2">
                <Play className="w-5 h-5" />
                Start Streaming
              </button>
              <button className="px-8 py-4 bg-card text-foreground border border-border rounded-xl font-bold hover:bg-card/80 transition-colors">
                Learn More
              </button>
            </div>
          </div>

          {/* Right Visual - Album Cover Grid */}
          <div className="hidden md:grid grid-cols-2 gap-4 relative">
            <div className="aspect-square bg-linear-to-br from-accent/20 to-accent/5 rounded-xl border border-border/50 flex items-center justify-center overflow-hidden group cursor-pointer">
              <div className="text-6xl opacity-50 group-hover:opacity-100 transition-opacity">
                ♪
              </div>
            </div>
            <div className="aspect-square bg-linear-to-br from-accent/10 to-background rounded-xl border border-border/50 flex items-center justify-center">
              <div className="text-6xl opacity-30">♫</div>
            </div>
            <div className="aspect-square bg-linear-to-br from-accent/10 to-background rounded-xl border border-border/50 flex items-center justify-center">
              <div className="text-6xl opacity-30">♪</div>
            </div>
            <div className="aspect-square bg-linear-to-br from-accent/20 to-accent/5 rounded-xl border border-border/50 flex items-center justify-center overflow-hidden group cursor-pointer">
              <div className="text-6xl opacity-50 group-hover:opacity-100 transition-opacity">
                ♫
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
