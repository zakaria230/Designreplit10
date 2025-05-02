import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogType?: "website" | "article" | "product";
  ogImage?: string;
  keywords?: string;
  structuredData?: Record<string, any>;
}

/**
 * SEO Component for optimizing pages for search engines
 * 
 * @param title - Page title
 * @param description - Page description
 * @param canonicalUrl - Canonical URL (optional)
 * @param ogType - Open Graph type (optional)
 * @param ogImage - Open Graph image URL (optional)
 * @param keywords - Meta keywords (optional)
 * @param structuredData - JSON-LD structured data (optional)
 */
export default function SEO({
  title,
  description,
  canonicalUrl,
  ogType = "website",
  ogImage = "/logo-og.png", // Default OG image
  keywords,
  structuredData
}: SEOProps) {
  // Base domain for canonical and OG URLs
  const domain = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://designkorv.com'; // Replace with your actual domain

  // Create full canonical URL if relative path is provided
  const fullCanonicalUrl = canonicalUrl 
    ? (canonicalUrl.startsWith('http') ? canonicalUrl : `${domain}${canonicalUrl}`)
    : undefined;
    
  // Create full OG image URL if relative path is provided
  const fullOgImage = ogImage 
    ? (ogImage.startsWith('http') ? ogImage : `${domain}${ogImage}`)
    : undefined;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Canonical URL */}
      {fullCanonicalUrl && <link rel="canonical" href={fullCanonicalUrl} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {fullOgImage && <meta property="og:image" content={fullOgImage} />}
      {fullCanonicalUrl && <meta property="og:url" content={fullCanonicalUrl} />}
      <meta property="og:site_name" content="DesignKorv" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {fullOgImage && <meta name="twitter:image" content={fullOgImage} />}
      
      {/* Structured Data / JSON-LD */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}