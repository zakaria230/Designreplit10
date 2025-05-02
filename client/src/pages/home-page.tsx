import { HeroSection } from "@/components/home/hero-section";
import { CategoriesSection } from "@/components/home/categories-section";
import { FeaturedProducts } from "@/components/home/featured-products";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { NewsletterSection } from "@/components/home/newsletter-section";
import SEO from "@/components/seo";
import { getWebsiteSchema } from "@/components/seo/structured-data";

export default function HomePage() {
  // SEO metadata
  const title = "DesignKorv - Premium Digital Fashion Assets";
  const description = "Premium digital fashion assets for designers who demand excellence. Patterns, technical drawings, 3D models and more.";
  const keywords = "digital fashion, design assets, fashion design, patterns, technical drawings, 3D models";
  
  // Structured data for SEO
  const structuredData = getWebsiteSchema();
  
  return (
    <>
      <SEO 
        title={title}
        description={description}
        keywords={keywords}
        canonicalUrl="/"
        structuredData={structuredData}
      />
      
      <HeroSection />
      <CategoriesSection />
      <FeaturedProducts />
      <TestimonialsSection />
      <NewsletterSection />
    </>
  );
}
