"use client";

const steps = [
  {
    number: "01",
    title: "Create Your Stream",
    description:
      "Set up your live stream in seconds and invite your community to join.",
  },
  {
    number: "02",
    title: "Add Your Playlist",
    description:
      "Upload your music or connect to your favorite streaming library.",
  },
  {
    number: "03",
    title: "Let Fans Vote",
    description:
      "Your audience votes on the next track in real-time as you stream.",
  },
  {
    number: "04",
    title: "Go Live",
    description:
      "Start streaming and watch your community engage like never before.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <p className="text-accent font-semibold tracking-widest text-sm uppercase">
            Simple Process
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground text-balance">
            How it works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="p-6 bg-background border border-border rounded-xl">
                <div className="text-4xl font-bold text-accent/20 mb-4">
                  {step.number}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-accent/20" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
