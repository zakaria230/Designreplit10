import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";

// Interface for reviews from API with user and product information
interface ReviewWithUserAndProduct {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    email?: string;
  };
  product?: {
    id: number;
    name: string;
    slug: string;
  };
}

export function TestimonialsSection() {
  // Fetch top-rated reviews from API
  const { data: reviews, isLoading, error } = useQuery<ReviewWithUserAndProduct[]>({
    queryKey: ["/api/reviews/featured"],
    select: (data) => {
      if (!data) return [];
      // Sort by rating (highest first) and take up to 6 reviews
      return [...data]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 6);
    },
  });

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, "MMM d, yyyy");
  };

  // Get user initials for avatar
  const getUserInitials = (username: string) => {
    return username ? username.slice(0, 2).toUpperCase() : "U";
  };

  // Render star rating
  const renderRating = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${
            index < rating
              ? "text-yellow-500 fill-yellow-500"
              : "text-gray-300"
          }`}
        />
      ));
  };

  // Loading state for reviews
  const renderSkeletons = () => {
    return Array(3).fill(0).map((_, index) => (
      <div key={index} className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div className="flex mb-4">
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-20 w-full mb-6" />
        <div className="flex items-center">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="ml-3">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    ));
  };

  return (
    <section className="py-12 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            What Our Customers Say
          </h2>
          <p className="max-w-2xl mx-auto text-gray-500 dark:text-gray-400 text-lg">
            Designers around the world trust DesignKorv for premium digital fashion assets that enhance their creativity and productivity.
          </p>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {renderSkeletons()}
          </div>
        ) : reviews && reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reviews.map((review) => (
              <div 
                key={review.id}
                className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm"
              >
                <div className="flex items-center mb-2">
                  <div className="flex">
                    {renderRating(review.rating)}
                  </div>
                </div>
                
                {review.title && (
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    {review.title}
                  </h4>
                )}
                
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  "{review.comment || "Great product, highly recommended!"}"
                </p>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 border border-gray-200 dark:border-gray-700">
                      <AvatarFallback className="bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                        {getUserInitials(review.user?.username || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {review.user?.username || "Anonymous"}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Verified Customer
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(review.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Customer testimonials will be displayed here as they become available.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
