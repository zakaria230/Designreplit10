import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Filter, Search, Loader2 } from "lucide-react";
import { Product, Category } from "@shared/schema";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/shop/product-grid";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

export default function ShopPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [sortOrder, setSortOrder] = useState<string>("newest");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Fetch all products
  const {
    data: products,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Fetch all categories
  const {
    data: categories,
    isLoading: isLoadingCategories,
  } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Filter and sort products
  const filteredProducts = products
    ? products
        .filter((product) => {
          // Filter by search query
          if (
            searchQuery &&
            !product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !product.description?.toLowerCase().includes(searchQuery.toLowerCase())
          ) {
            return false;
          }

          // Filter by category
          if (selectedCategory && product.categoryId !== selectedCategory) {
            return false;
          }

          // Filter by price range
          if (
            product.price < priceRange[0] ||
            product.price > priceRange[1]
          ) {
            return false;
          }

          return true;
        })
        .sort((a, b) => {
          // Sort products
          switch (sortOrder) {
            case "priceAsc":
              return a.price - b.price;
            case "priceDesc":
              return b.price - a.price;
            case "popular":
              return (b.rating || 0) - (a.rating || 0);
            case "newest":
            default:
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
        })
    : [];

  // Get max price for the slider
  const maxPrice = products
    ? Math.ceil(Math.max(...products.map((p) => p.price)))
    : 100;

  // Handle applying a filter
  const applyFilter = (type: string, value: string | number) => {
    if (type === "category") {
      setSelectedCategory(value as number);
      const category = categories?.find(c => c.id === value);
      if (category) {
        if (!activeFilters.includes(`Category: ${category.name}`)) {
          setActiveFilters([...activeFilters, `Category: ${category.name}`]);
        }
      }
    } else if (type === "price") {
      setPriceRange(value as number[]);
      setActiveFilters([...activeFilters.filter(f => !f.startsWith("Price:")), `Price: $${value[0]} - $${value[1]}`]);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setPriceRange([0, maxPrice]);
    setActiveFilters([]);
  };

  // Remove a specific filter
  const removeFilter = (filter: string) => {
    setActiveFilters(activeFilters.filter(f => f !== filter));
    
    if (filter.startsWith("Category:")) {
      setSelectedCategory(null);
    } else if (filter.startsWith("Price:")) {
      setPriceRange([0, maxPrice]);
    }
  };

  const isLoading = isLoadingProducts || isLoadingCategories;

  return (
    <>
      <Helmet>
        <title>Shop Digital Fashion Assets | DesignKorv</title>
        <meta name="description" content="Browse our collection of premium digital fashion design assets including patterns, technical drawings, 3D models, and textures." />
      </Helmet>

      <div className="bg-white dark:bg-gray-900 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Shop Digital Fashion Assets
            </h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-3xl">
              Browse our collection of premium digital fashion design assets. From patterns to 3D models, find the perfect resources for your next project.
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="flex items-center">
                      <Filter className="mr-2 h-4 w-4" />
                      Filter
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                      <SheetDescription>
                        Narrow down products by applying filters
                      </SheetDescription>
                    </SheetHeader>
                    <div className="py-6">
                      <Accordion type="single" collapsible defaultValue="categories">
                        <AccordionItem value="categories">
                          <AccordionTrigger>Categories</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3">
                              {isLoadingCategories ? (
                                <div className="flex justify-center">
                                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                </div>
                              ) : categories && categories.length > 0 ? (
                                categories.map((category) => (
                                  <div key={category.id} className="flex items-center">
                                    <Checkbox
                                      id={`category-${category.id}`}
                                      checked={selectedCategory === category.id}
                                      onCheckedChange={() => {
                                        applyFilter("category", selectedCategory === category.id ? null : category.id);
                                      }}
                                    />
                                    <label
                                      htmlFor={`category-${category.id}`}
                                      className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100"
                                    >
                                      {category.name}
                                    </label>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  No categories available
                                </p>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="price">
                          <AccordionTrigger>Price Range</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-5 py-2">
                              <Slider
                                defaultValue={[0, maxPrice]}
                                min={0}
                                max={maxPrice}
                                step={1}
                                value={priceRange}
                                onValueChange={(value) => {
                                  applyFilter("price", value);
                                }}
                              />
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  ${priceRange[0]}
                                </span>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  ${priceRange[1]}
                                </span>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                      <div className="flex justify-end mt-6">
                        <Button variant="outline" onClick={clearFilters} className="mr-2">
                          Clear All
                        </Button>
                        <Button>Apply Filters</Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                <Select
                  value={sortOrder}
                  onValueChange={(value) => setSortOrder(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="priceAsc">Price: Low to High</SelectItem>
                    <SelectItem value="priceDesc">Price: High to Low</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active filters */}
            {activeFilters.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {activeFilters.map((filter) => (
                  <Badge key={filter} variant="secondary" className="flex items-center">
                    {filter}
                    <button
                      onClick={() => removeFilter(filter)}
                      className="ml-1 rounded-full text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                  Clear all
                </Button>
              </div>
            )}
          </div>

          {/* Products Grid */}
          {productsError ? (
            <div className="text-center py-12">
              <p className="text-red-500 dark:text-red-400">
                Error loading products. Please try again later.
              </p>
            </div>
          ) : (
            <>
              <ProductGrid products={filteredProducts} isLoading={isLoading} />
              
              {/* Show "no results" message if no products match filters */}
              {!isLoading && filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No products found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Try adjusting your search or filter criteria.
                  </p>
                  <Button onClick={clearFilters}>Clear all filters</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
