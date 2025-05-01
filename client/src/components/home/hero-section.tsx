import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-secondary-700 opacity-90 dark:opacity-80"></div>
      <div 
        className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1593030103066-0093718efeb9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            Elevate Your Fashion Designs
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8">
            Premium digital fashion assets for designers who demand excellence. From patterns to complete designs, find everything you need to create stunning collections.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" asChild className="bg-white text-primary-700 hover:bg-gray-50">
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
