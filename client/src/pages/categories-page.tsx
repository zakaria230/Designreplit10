import { useState, useEffect } from "react";
import { Link, useRoute } from "wouter";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { Category, Product } from "@shared/schema";
import { ProductGrid } from "@/components/shop/product-grid";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Grid, 
  Layers, 
  Scissors, 
  ShoppingBag, 
  Palette, 
  ChevronRight,
  Tag,
  ChevronLeft
} from "lucide-react";

export default function CategoriesPage() {
  const [, params] = useRoute("/categories/:slug?");
  const categorySlug = params?.slug || "";

  // Fetch categories
  const { 
    data: categories = [], 
    isLoading: categoriesLoading 
  } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    retry: false,
  });

  // Get the selected category based on the slug
  const selectedCategory = categories.find(
    (category) => category.slug === categorySlug
  );
  
  // Fetch products for the selected category
  const { 
    data: products = [], 
    isLoading: productsLoading 
  } = useQuery<Product[]>({
    queryKey: ["/api/products/category", selectedCategory?.id],
    queryFn: async () => {
      const res = await fetch(`/api/products/category/${selectedCategory?.id}`);
      if (!res.ok) throw new Error('Failed to fetch category products');
      return res.json();
    },
    enabled: !!selectedCategory?.id,
    retry: false,
  });

  // If no category is selected, show all products
  const { 
    data: allProducts = [], 
    isLoading: allProductsLoading 
  } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: !selectedCategory?.id,
    retry: false,
  });

  // Default to first category if none is selected and categories exist
  useEffect(() => {
    if (!categorySlug && categories.length > 0) {
      // This effect doesn't redirect, just provides the categories for rendering
    }
  }, [categorySlug, categories]);

  if (categoriesLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-t-primary border-primary/40 rounded-full animate-spin"></div>
      </div>
    );
  }

  const displayedProducts = selectedCategory ? products : allProducts;
  const isLoading = selectedCategory ? productsLoading : allProductsLoading;

  // Category icons map
  const getCategoryIcon = (slug: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      patterns: <Layers className="h-5 w-5" />,
      templates: <Grid className="h-5 w-5" />,
      textures: <Palette className="h-5 w-5" />,
      accessories: <Tag className="h-5 w-5" />,
      tools: <Scissors className="h-5 w-5" />,
    };
    
    return iconMap[slug] || <ShoppingBag className="h-5 w-5" />;
  };

  return (
    <>
      <Helmet>
        <title>
          {selectedCategory 
            ? `${selectedCategory.name} Products | DesignKorv` 
            : "Categories | DesignKorv"}
        </title>
        <meta 
          name="description" 
          content={
            selectedCategory 
              ? `Browse our selection of ${selectedCategory.name.toLowerCase()} design assets.` 
              : "Explore our categories of premium digital fashion design assets."
          } 
        />
      </Helmet>

      {/* Breadcrumb */}
      <div className="bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-200">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <Link href="/categories" className="hover:text-gray-700 dark:hover:text-gray-200">
              Categories
            </Link>
            {selectedCategory && (
              <>
                <ChevronRight className="h-4 w-4 mx-2" />
                <span className="text-gray-900 dark:text-gray-100">{selectedCategory.name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Categories Sidebar */}
          <div className="md:w-1/4">
            <div className="p-4 md:p-6 bg-white dark:bg-gray-800 rounded-lg shadow mb-4">
              <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Categories</h2>
              <ul className="space-y-1">
                <li>
                  <Link href="/categories">
                    <Button 
                      variant={!selectedCategory ? "default" : "ghost"} 
                      className="w-full justify-start"
                    >
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      All Categories
                    </Button>
                  </Link>
                </li>
                {categories?.map((category: Category) => (
                  <li key={category.id}>
                    <Link href={`/categories/${category.slug}`}>
                      <Button 
                        variant={selectedCategory?.id === category.id ? "default" : "ghost"} 
                        className="w-full justify-start"
                      >
                        {getCategoryIcon(category.slug)}
                        <span className="ml-2">{category.name}</span>
                      </Button>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Products */}
          <div className="md:w-3/4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedCategory ? selectedCategory.name : "All Categories"}
                </h1>
                
                {selectedCategory && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/categories">
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Back to All
                    </Link>
                  </Button>
                )}
              </div>
              
              {selectedCategory && (
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {selectedCategory.description || `Browse our collection of premium ${selectedCategory.name.toLowerCase()} for your fashion design projects.`}
                </p>
              )}
            </div>

            {/* Show category grid if no category is selected */}
            {!selectedCategory && categories && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {categories.map((category: Category) => (
                  <Link key={category.id} href={`/categories/${category.slug}`}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md transition-all hover:shadow-lg overflow-hidden">
                      <div className="p-5">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary mr-3">
                            {getCategoryIcon(category.slug)}
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {category.name}
                          </h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                          {category.description || `Premium ${category.name.toLowerCase()} for your fashion design projects.`}
                        </p>
                        <Button variant="outline" size="sm" className="mt-2 w-full">
                          View Products <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Show products grid if category is selected or viewing all products */}
            {(selectedCategory || (!selectedCategory && allProducts)) && (
              <ProductGrid products={displayedProducts || []} isLoading={isLoading} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}