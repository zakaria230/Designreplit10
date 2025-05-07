import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background pattern */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-gray-900"
        style={{ backgroundImage: "url('/images/hero-bg.png')" }}
      ></div>
      <div className="absolute inset-0 bg-gray-950 bg-opacity-70 dark:bg-opacity-85"></div>
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-secondary-800 opacity-90 dark:opacity-95"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            Digital Designs and Bundles
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8">
            Discover high-quality SVGs, PNGs, and design bundles made for
            crafters, designers, and print-on-demand sellers. Instant downloads
            perfect for T-shirts, mugs, social media, and creative projects.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              asChild
              variant="secondary"
              className="border-blue-500 text-blue-500 hover:bg-blue-500/10 dark:border-blue dark:text-white bg-white dark:hover:bg-white/10 dark:border-blue-500"
            >
              <Link href="/shop">Browse Collection</Link>
            </Button>
            <Button
              className="dark:hover:bg-white/10 hover:bg-blue-500/10"
              size="lg"
              variant="secondary"
              asChild
            >
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
