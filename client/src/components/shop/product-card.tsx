import { Link } from "wouter";
import { Product } from "@shared/schema";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { ShoppingCart } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  };
  
  // Format price to display with 2 decimal places
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(product.price);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col group">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-gray-400 dark:text-gray-500">No image</span>
            </div>
          )}
          
          {/* Label for new or bestseller products */}
          {product.isFeatured && (
            <div className="absolute top-0 right-0 p-3">
              <Badge variant="secondary" className="bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300">
                Featured
              </Badge>
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          <Link href={`/product/${product.slug}`}>{product.name}</Link>
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {product.description}
        </p>
        
        {/* Rating */}
        {product.rating > 0 && (
          <div className="flex items-center mt-2">
            <StarRating rating={product.rating} />
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
              ({product.numReviews})
            </span>
          </div>
        )}
        
        {/* Price and add to cart */}
        <div className="mt-auto pt-4 flex items-center justify-between">
          <span className="text-lg font-medium text-gray-900 dark:text-white">
            {formattedPrice}
          </span>
          <Button
            size="icon"
            variant="outline"
            onClick={handleAddToCart}
            className="rounded-md bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-800 border-primary-100 dark:border-primary-900"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="sr-only">Add to cart</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
