"use client";

export function CTA() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-linear-to-br from-accent/10 to-background border border-accent/20 rounded-2xl p-12 text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground text-balance">
            Ready to revolutionize your streams?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Join thousands of creators who are building stronger connections
            with their fans through interactive music streaming.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-accent text-accent-foreground rounded-xl font-bold hover:opacity-90 transition-all transform hover:scale-105">
              Start Your Free Trial
            </button>
            <button className="px-8 py-4 bg-card text-foreground border border-border rounded-xl font-bold hover:bg-card/80 transition-colors">
              Schedule a Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
