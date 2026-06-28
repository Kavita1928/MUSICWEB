import { Navigation } from "./components/navigation";
import { Hero } from "./components/hero";
import { Features } from "./components/features";
import { HowItWorks } from "./components/how-it-works";
import { CTA } from "./components/cta";
import { Footer } from "./components/footer";
import { Redirect } from "./components/redirect";

export default function Home() {
  return (
    <main className="bg-background min-h-screen">
      <Navigation />
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
      <Footer />

      <Redirect />
    </main>
  );
}
