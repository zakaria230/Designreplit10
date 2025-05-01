import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Category } from "@shared/schema";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryCardProps {
  category: Category;
}

function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link href={`/categories/${category.slug}`} className="group">
      <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative">
        {category.imageUrl ? (
          <img 
            src={category.imageUrl} 
            alt={category.name} 
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
          <h3 className="text-white font-medium text-lg">{category.name}</h3>
        </div>
      </div>
    </Link>
  );
}

function CategorySkeleton() {
  return (
    <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative">
      <Skeleton className="w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent flex items-end p-4">
        <Skeleton className="h-7 w-32" />
      </div>
    </div>
  );
}

export function CategoriesSection() {
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const placeholderCategories = [
    {
      id: 1,
      name: "Patterns",
      slug: "patterns",
      imageUrl: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=640&h=640&q=80"
    },
    {
      id: 2,
      name: "Textures",
      slug: "textures",
      imageUrl: "https://images.unsplash.com/photo-1548126466-a78aaeb13da5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=640&h=640&q=80"
    },
    {
      id: 3,
      name: "Technical Drawings",
      slug: "technical-drawings",
      imageUrl: "https://images.unsplash.com/photo-1558244661-d248897f7bc4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=640&h=640&q=80"
    },
    {
      id: 4,
      name: "3D Models",
      slug: "3d-models",
      imageUrl: "https://images.unsplash.com/photo-1633059388132-f7e6f6afa77c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=640&h=640&q=80"
    }
  ];

  const displayCategories = categories && categories.length > 0 ? categories : placeholderCategories;

  return (
    <section className="py-12 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h2>
          <Link 
            href="/categories"
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium flex items-center"
          >
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {isLoading
            ? Array(4).fill(0).map((_, index) => <CategorySkeleton key={index} />)
            : displayCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))
          }
        </div>
      </div>
    </section>
  );
}
