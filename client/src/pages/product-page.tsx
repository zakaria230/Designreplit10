import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Product, Category } from "@shared/schema";
import { useCart } from "@/hooks/use-cart";
import { StarRating } from "@/components/ui/star-rating";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FeaturedProducts } from "@/components/home/featured-products";
import { ReviewList } from "@/components/product/review-list";
import { Loader2, ChevronRight, ShoppingCart, Download, Check, Heart, ChevronLeft } from "lucide-react";
import SEO from "@/components/seo";
import { getProductSchema, getBreadcrumbSchema } from "@/components/seo/structured-data";

export default function ProductPage() {
  const { slug } = useParams();
  const [, navigate] = useLocation();
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addItem } = useCart();

  // Fetch product details
  const {
    data: product,
    isLoading: isLoadingProduct,
    error: productError,
  } = useQuery<Product>({
    queryKey: [`/api/products/${slug}`],
  });

  // Fetch category details if product has a category
  const {
    data: category,
    isLoading: isLoadingCategory,
  } = useQuery<Category>({
    queryKey: [`/api/categories/${product?.categoryId}`],
    enabled: !!product?.categoryId,
  });

  // Handle adding to cart
  const handleAddToCart = () => {
    if (!product) return;
    
    setIsAddingToCart(true);
    
    // Add to cart with delay to show feedback
    setTimeout(() => {
      addItem(product, quantity);
      setIsAddingToCart(false);
    }, 500);
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Handle quantity changes
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  // Loading state
  if (isLoadingProduct) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (productError || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold text-red-600 dark:text-red-500 mb-4">
          Product Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Sorry, the product you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => navigate("/shop")}>
          Return to Shop
        </Button>
      </div>
    );
  }

  // Create breadcrumbs for SEO
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Shop", url: "/shop" },
  ];
  
  // Add category to breadcrumbs if available
  if (category) {
    breadcrumbs.push({ name: category.name, url: `/categories/${category.slug}` });
  }
  
  // Add current product to breadcrumbs
  breadcrumbs.push({ name: product.name, url: `/product/${product.slug}` });
  
  // Create product schema for structured data
  const productSchema = getProductSchema({
    id: product.id,
    name: product.name,
    description: product.description || "Digital fashion design asset",
    price: product.price,
    image: product.imageUrl || "/logo.png",
    url: `/product/${product.slug}`,
    brand: "DesignKorv",
    category: category?.name,
    ratingValue: product.rating || undefined,
    reviewCount: product.numReviews || undefined
  });
  
  // Create breadcrumb schema
  const breadcrumbSchema = getBreadcrumbSchema(breadcrumbs);
  
  // Combine structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [productSchema, breadcrumbSchema]
  };

  return (
    <>
      <SEO 
        title={`${product.name} | DesignKorv`}
        description={product.description || "Digital fashion design asset"}
        keywords={`fashion design, digital assets, ${product.name}, ${category?.name || ''}`}
        canonicalUrl={`/product/${product.slug}`}
        ogType="product"
        ogImage={product.imageUrl || undefined}
        structuredData={structuredData}
      />

      <div className="bg-white dark:bg-gray-900 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-8">
            <a href="/" className="hover:text-gray-900 dark:hover:text-gray-200">Home</a>
            <ChevronRight className="h-4 w-4 mx-2" />
            <a href="/shop" className="hover:text-gray-900 dark:hover:text-gray-200">Shop</a>
            {category && (
              <>
                <ChevronRight className="h-4 w-4 mx-2" />
                <a href={`/categories/${category.slug}`} className="hover:text-gray-900 dark:hover:text-gray-200">
                  {category.name}
                </a>
              </>
            )}
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-gray-900 dark:text-white" aria-current="page">
              {product.name}
            </span>
          </nav>

          {/* Product details */}
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 mb-16">
            {/* Thumbnails column */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <div className="flex flex-row lg:flex-col gap-2">
                {/* Convert images field to array and display them */}
                {(() => {
                  let imageArray: string[] = [];
                  
                  // Add main image if it exists
                  if (product.imageUrl) {
                    imageArray.push(product.imageUrl);
                  }
                  
                  // Add images from the images field if it exists
                  if (product.images) {
                    try {
                      // Try to parse if it's a string
                      if (typeof product.images === 'string') {
                        try {
                          const parsedImages = JSON.parse(product.images);
                          if (Array.isArray(parsedImages)) {
                            imageArray = [...imageArray, ...parsedImages];
                          } else if (typeof parsedImages === 'string') {
                            imageArray.push(parsedImages);
                          }
                        } catch (e) {
                          // If not valid JSON, treat as a single image URL
                          imageArray.push(product.images);
                        }
                      } 
                      // If already an array, use it directly
                      else if (Array.isArray(product.images)) {
                        imageArray = [...imageArray, ...product.images];
                      }
                    } catch (e) {
                      console.error("Error parsing product images", e);
                    }
                  }
                  
                  // Remove duplicates and filter out any null or empty strings
                  imageArray = Array.from(new Set(imageArray)).filter(url => url && typeof url === 'string' && url.trim().length > 0);
                  
                  return imageArray.map((imgUrl, index) => (
                    <div key={index} className="w-[60px] h-[60px] border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden cursor-pointer hover:border-primary">
                      <img 
                        src={imgUrl} 
                        alt={`${product.name} view ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ));
                })()}
                
                {/* Add placeholder thumbnails if we have no images */}
                {!product.imageUrl && (!product.images || (Array.isArray(product.images) && product.images.length === 0)) && (
                  <>
                    <div className="w-[60px] h-[60px] bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md flex items-center justify-center">
                      <span className="text-xs text-gray-400">Front</span>
                    </div>
                    <div className="w-[60px] h-[60px] bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md flex items-center justify-center">
                      <span className="text-xs text-gray-400">Back</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Main product image */}
            <div className="lg:col-span-5 order-1 lg:order-2 bg-gray-50 dark:bg-gray-800 rounded-md overflow-hidden relative">
              {(() => {
                // Get all available images
                let imageArray: string[] = [];
                
                // Add main image if it exists
                if (product.imageUrl) {
                  imageArray.push(product.imageUrl);
                }
                
                // Add images from the images field if it exists
                if (product.images) {
                  try {
                    // Try to parse if it's a string
                    if (typeof product.images === 'string') {
                      try {
                        const parsedImages = JSON.parse(product.images);
                        if (Array.isArray(parsedImages)) {
                          imageArray = [...imageArray, ...parsedImages];
                        } else if (typeof parsedImages === 'string') {
                          imageArray.push(parsedImages);
                        }
                      } catch (e) {
                        // If not valid JSON, treat as a single image URL
                        imageArray.push(product.images);
                      }
                    } 
                    // If already an array, use it directly
                    else if (Array.isArray(product.images)) {
                      imageArray = [...imageArray, ...product.images];
                    }
                  } catch (e) {
                    console.error("Error parsing product images", e);
                  }
                }
                
                // Remove duplicates and filter out any null or empty strings
                imageArray = Array.from(new Set(imageArray)).filter(url => url && typeof url === 'string' && url.trim().length > 0);
                
                // Display first image or fallback
                if (imageArray.length > 0) {
                  return (
                    <>
                      <img 
                        src={imageArray[0]} 
                        alt={product.name}
                        className="w-full h-full object-contain min-h-[450px]"
                      />
                      {imageArray.length > 1 && (
                        <div className="absolute bottom-4 right-4 flex gap-2">
                          <button className="rounded-full p-2 bg-white/80 hover:bg-white text-gray-700 hover:text-gray-900 transition-colors">
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button className="rounded-full p-2 bg-white/80 hover:bg-white text-gray-700 hover:text-gray-900 transition-colors">
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </>
                  );
                } else {
                  return (
                    <div className="h-full min-h-[450px] flex items-center justify-center">
                      <span className="text-gray-400 dark:text-gray-500">No image available</span>
                    </div>
                  );
                }
              })()}
            </div>

            {/* Product info */}
            <div className="lg:col-span-4 order-3">
              <div className="flex flex-col h-full">
                {/* Price in green */}
                <div className="mb-2">
                  <h2 className="text-xl font-bold text-green-600 dark:text-green-500">
                    {formatPrice(product.price)}
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="ml-2 text-base font-normal line-through text-gray-500">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </h2>
                </div>
                
                {/* Title */}
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {product.name}
                </h1>
                
                {/* Seller info with rating */}
                <div className="flex items-center mb-4">
                  <span className="text-sm text-gray-700 dark:text-gray-300 mr-1">DesignKorv</span>
                  {(product.rating && product.rating > 0) && (
                    <>
                      <span className="mx-2 text-gray-300">•</span>
                      <StarRating rating={product.rating || 0} />
                      <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
                        ({product.numReviews || 0})
                      </span>
                    </>
                  )}
                </div>
                
                {/* Description */}
                <div className="prose dark:prose-invert mb-8 max-w-none">
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {product.description || "No description available."}
                  </p>
                </div>
                
                {/* Highlights section */}
                <div className="mb-8">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Highlights</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                        <Download className="h-4 w-4 text-gray-500" />
                      </div>
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                        Digital download
                      </span>
                    </li>
                    {product.fileType && (
                      <li className="flex items-start">
                        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-500">•</span>
                        </div>
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                          Digital file type(s): {product.fileType}
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
                
                {/* Category */}
                {category && (
                  <div className="mb-8">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Category: </span>
                    <Badge variant="outline" className="ml-2">
                      <a href={`/categories/${category.slug}`}>{category.name}</a>
                    </Badge>
                  </div>
                )}
                
                {/* Add to cart */}
                <div className="mt-auto">
                  <div className="mb-6">
                    <Button 
                      size="lg" 
                      className="w-full"
                      onClick={handleAddToCart}
                      disabled={isAddingToCart}
                    >
                      {isAddingToCart ? (
                        <>
                          <Check className="mr-2 h-5 w-5" />
                          Added to Cart!
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-5 w-5" />
                          Add to cart
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional information tabs */}
          <div className="mb-16">
            <Tabs defaultValue="details">
              <TabsList className="w-full justify-start mb-6">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="specifications">Specifications</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="prose dark:prose-invert max-w-none">
                {product.details ? (
                  <div className="py-6" dangerouslySetInnerHTML={{ __html: product.details }} />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                      No additional details have been provided for this product.
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      The basic product information is shown in the main product section.
                    </p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="specifications">
                {product.specifications ? (
                  <div className="py-6">
                    <pre className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300">
                      {product.specifications}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                      No specifications provided for this product.
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      Specifications include file formats, dimensions, compatibility, and license details.
                    </p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="reviews">
                <ReviewList productId={product.id} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Related products */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
              You might also like
            </h2>
            <FeaturedProducts />
          </div>
        </div>
      </div>
    </>
  );
}
