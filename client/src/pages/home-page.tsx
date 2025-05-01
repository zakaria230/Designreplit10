import { HeroSection } from "@/components/home/hero-section";
import { CategoriesSection } from "@/components/home/categories-section";
import { FeaturedProducts } from "@/components/home/featured-products";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { NewsletterSection } from "@/components/home/newsletter-section";
import { Helmet } from "react-helmet-async";

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>DesignKorv - Premium Digital Fashion Assets</title>
        <meta name="description" content="Premium digital fashion assets for designers who demand excellence. Patterns, technical drawings, 3D models and more." />
      </Helmet>
      
      <HeroSection />
      <CategoriesSection />
      <FeaturedProducts />
      <TestimonialsSection />
      <NewsletterSection />
    </>
  );
}
