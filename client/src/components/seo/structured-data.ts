/**
 * This file contains helper functions to generate 
 * JSON-LD structured data for different types of pages
 */

/**
 * Generate structured data for the organization
 */
export const getOrganizationSchema = (
  siteName: string = 'DesignKorv',
  domain: string = 'https://designkorv.com',
  contactEmail: string = 'support@designkorv.com',
  contactPhone: string = ''
) => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteName,
  url: domain,
  logo: `${domain}/logo.png`,
  sameAs: [
    `https://twitter.com/${siteName.toLowerCase().replace(/\s+/g, '')}`,
    `https://facebook.com/${siteName.toLowerCase().replace(/\s+/g, '')}`,
    `https://instagram.com/${siteName.toLowerCase().replace(/\s+/g, '')}`,
    `https://linkedin.com/company/${siteName.toLowerCase().replace(/\s+/g, '')}`
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: contactPhone,
    contactType: "customer service",
    email: contactEmail,
    availableLanguage: ["English"]
  }
});

/**
 * Generate structured data for a product
 */
export const getProductSchema = (
  product: {
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
  },
  siteName: string = 'DesignKorv'
) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  description: product.description,
  image: product.image,
  sku: product.sku || `DKPROD-${product.id}`,
  mpn: `DKMPN-${product.id}`,
  brand: {
    "@type": "Brand",
    name: product.brand || siteName
  },
  offers: {
    "@type": "Offer",
    url: product.url,
    priceCurrency: product.currency || "USD",
    price: product.price,
    availability: "https://schema.org/InStock",
    seller: {
      "@type": "Organization",
      name: siteName
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
export const getCategorySchema = (
  category: {
    name: string;
    description: string;
    url: string;
  },
  siteName: string = 'DesignKorv',
  domain: string = 'https://designkorv.com'
) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: category.name,
  description: category.description,
  url: category.url,
  isPartOf: {
    "@type": "WebSite",
    name: siteName,
    url: domain
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
export const getWebsiteSchema = (siteName: string = 'DesignKorv', domain: string = 'https://designkorv.com') => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  url: domain,
  potentialAction: {
    "@type": "SearchAction",
    target: `${domain}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string"
  }
});