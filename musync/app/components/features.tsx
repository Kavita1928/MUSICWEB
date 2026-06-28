"use client";

import { Users, Vote, Radio, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Radio,
    title: "Live Streaming",
    description:
      "Stream your music directly to your community with crystal-clear quality and low latency.",
  },
  {
    icon: Vote,
    title: "Fan Voting",
    description:
      "Real-time voting lets your audience choose what plays next, creating interactive sessions.",
  },
  {
    icon: Users,
    title: "Community Building",
    description:
      "Connect with fans like never before and grow your audience through authentic engagement.",
  },
  {
    icon: TrendingUp,
    title: "Analytics & Insights",
    description:
      "Track listener behavior, voting patterns, and engagement metrics to grow your following.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <p className="text-accent font-semibold tracking-widest text-sm uppercase">
            Powerful Features
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground text-balance">
            Everything creators need
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="p-8 bg-card border border-border rounded-xl hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10 group"
              >
                <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/30 transition-colors">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
