/**
 * This file contains helper functions to generate 
 * JSON-LD structured data for different types of pages
 */

/**
 * Generate structured data for the organization
 */
export const getOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "DesignKorv",
  url: "https://designkorv.com",
  logo: "https://designkorv.com/logo.png",
  sameAs: [
    "https://twitter.com/designkorv",
    "https://facebook.com/designkorv",
    "https://instagram.com/designkorv",
    "https://linkedin.com/company/designkorv"
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "",
    contactType: "customer service",
    email: "support@designkorv.com",
    availableLanguage: ["English"]
  }
});

/**
 * Generate structured data for a product
 */
export const getProductSchema = (product: {
  id: number;
  name: string;
  description: string;
  price: number;
  currency?: string;
  image: string;
  url: string;
  sku?: string;
  brand?: string;
  category?: string;
  ratingValue?: number;
  reviewCount?: number;
}) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  description: product.description,
  image: product.image,
  sku: product.sku || `DKPROD-${product.id}`,
  mpn: `DKMPN-${product.id}`,
  brand: {
    "@type": "Brand",
    name: product.brand || "DesignKorv"
  },
  offers: {
    "@type": "Offer",
    url: product.url,
    priceCurrency: product.currency || "USD",
    price: product.price,
    availability: "https://schema.org/InStock",
    seller: {
      "@type": "Organization",
      name: "DesignKorv"
    }
  },
  ...(product.ratingValue && product.reviewCount ? {
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.ratingValue,
      reviewCount: product.reviewCount
    }
  } : {})
});

/**
 * Generate structured data for a category page
 */
export const getCategorySchema = (category: {
  name: string;
  description: string;
  url: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: category.name,
  description: category.description,
  url: category.url,
  isPartOf: {
    "@type": "WebSite",
    name: "DesignKorv",
    url: "https://designkorv.com"
  }
});

/**
 * Generate structured data for FAQ page
 */
export const getFAQSchema = (faqs: Array<{question: string; answer: string}>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(faq => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer
    }
  }))
});

/**
 * Generate structured data for breadcrumbs
 */
export const getBreadcrumbSchema = (breadcrumbs: Array<{name: string; url: string}>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: breadcrumbs.map((crumb, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: crumb.name,
    item: crumb.url
  }))
});

/**
 * Generate structured data for the home page
 */
export const getWebsiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "DesignKorv",
  url: "https://designkorv.com",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://designkorv.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
});