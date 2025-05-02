import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { Product, Category } from "@shared/schema";
import { useCart } from "@/hooks/use-cart";
import { StarRating } from "@/components/ui/star-rating";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FeaturedProducts } from "@/components/home/featured-products";
import { Loader2, ChevronRight, ShoppingCart, Download, Check } from "lucide-react";

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

  return (
    <>
      <Helmet>
        <title>{`${product.name} | DesignKorv`}</title>
        <meta name="description" content={product.description || "Digital fashion design asset"} />
      </Helmet>

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            {/* Product image */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="h-full min-h-[400px] flex items-center justify-center">
                  <span className="text-gray-400 dark:text-gray-500">No image available</span>
                </div>
              )}
            </div>

            {/* Product info */}
            <div>
              <div className="flex flex-col h-full">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {product.name}
                </h1>
                
                {/* Rating */}
                {(product.rating && product.rating > 0) && (
                  <div className="flex items-center mb-4">
                    <StarRating rating={product.rating || 0} />
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      ({product.numReviews || 0} {(product.numReviews || 0) === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                )}
                
                {/* Price */}
                <div className="mb-6">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(product.price)}
                  </p>
                  {product.downloadable && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Digital download, available immediately after purchase
                    </p>
                  )}
                </div>
                
                {/* Description */}
                <div className="prose dark:prose-invert mb-8 max-w-none">
                  <p className="text-gray-600 dark:text-gray-300">
                    {product.description || "No description available."}
                  </p>
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
                  <div className="flex items-center mb-6">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-4">
                      Quantity:
                    </span>
                    <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-md">
                      <button
                        onClick={decreaseQuantity}
                        className="px-3 py-1 border-r border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        disabled={quantity <= 1}
                      >
                        -
                      </button>
                      <span className="px-4 py-1 text-gray-900 dark:text-white">
                        {quantity}
                      </span>
                      <button
                        onClick={increaseQuantity}
                        className="px-3 py-1 border-l border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      size="lg" 
                      className="flex-1"
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
                          Add to Cart
                        </>
                      )}
                    </Button>
                    <Button 
                      size="lg" 
                      variant="secondary"
                      className="flex-1"
                      onClick={() => {
                        addItem(product, quantity);
                        navigate("/checkout");
                      }}
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Buy Now
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
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    No additional details have been provided for this product.
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    The basic product information is shown in the main product section.
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="specifications">
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    No specifications provided for this product.
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    Specifications include file formats, dimensions, compatibility, and license details.
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="reviews">
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    No reviews yet. Reviews will appear here once customers leave feedback.
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    Product reviews help other customers make informed decisions.
                  </p>
                </div>
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
