import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background pattern */}
      <div 
        className="absolute inset-0 w-full h-full object-cover bg-gray-900"
      />
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-secondary-800 opacity-90 dark:opacity-95"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            Elevate Your Fashion Designs
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8">
            Premium digital fashion assets for designers who demand excellence. From patterns to complete designs, find everything you need to create stunning collections.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" asChild className="bg-white text-primary-700 hover:bg-gray-50" variant="secondary">
              <Link href="/shop">
                Browse Collection
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/about">
                Learn More
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
