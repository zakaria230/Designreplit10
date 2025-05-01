import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Product } from "@shared/schema";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import { Skeleton } from "@/components/ui/skeleton";

function ProductSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col">
      <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-700">
        <Skeleton className="w-full h-full" />
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-5/6 mb-4" />
        <Skeleton className="h-4 w-24 mb-6" />
        <div className="mt-auto pt-4 flex items-center justify-between">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function FeaturedProducts() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
  });

  const placeholderProducts = [
    {
      id: 1,
      name: "Premium Dress Pattern",
      slug: "premium-dress-pattern",
      description: "Complete pattern with size variations included",
      price: 49.99,
      imageUrl: "https://images.unsplash.com/photo-1511556820780-d912e42b4980?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      rating: 4.5,
      numReviews: 42,
      isFeatured: true,
      categoryId: 1,
    },
    {
      id: 2,
      name: "Technical Drawing Set",
      slug: "technical-drawing-set",
      description: "Professional technical drawings for manufacturers",
      price: 34.99,
      imageUrl: "https://images.unsplash.com/photo-1559664924-1b004d5c1f07?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      rating: 4.0,
      numReviews: 28,
      isFeatured: true,
      categoryId: 3,
    },
    {
      id: 3,
      name: "3D Apparel Model",
      slug: "3d-apparel-model",
      description: "High-quality 3D model for visualization",
      price: 79.99,
      imageUrl: "https://images.unsplash.com/photo-1605442786731-87518d4594c1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      rating: 5.0,
      numReviews: 76,
      isFeatured: true,
      categoryId: 4,
    },
    {
      id: 4,
      name: "Textile Pattern Collection",
      slug: "textile-pattern-collection",
      description: "Set of 10 seamless fabric patterns",
      price: 29.99,
      imageUrl: "https://images.unsplash.com/photo-1596458397260-255807e979f0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      rating: 4.0,
      numReviews: 31,
      isFeatured: true,
      categoryId: 2,
    }
  ];

  const displayProducts = products && products.length > 0 ? products : placeholderProducts;

  return (
    <section className="py-12 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Featured Products</h2>
          <Link
            href="/shop"
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium flex items-center"
          >
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading
            ? Array(4).fill(0).map((_, index) => <ProductSkeleton key={index} />)
            : displayProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
          }
        </div>
      </div>
    </section>
  );
}
