import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star, ThumbsUp, MessageSquare, ChevronRight, ChevronLeft } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Review, User, Product } from "@shared/schema";

interface ProductReviewsProps {
  productId: number;
  className?: string;
}

interface ReviewWithUserAndProduct extends Review {
  user?: User;
  product?: Product;
}

export function ProductReviews({ productId, className }: ProductReviewsProps) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 3;

  // Fetch reviews for the product
  const { data: reviews, isLoading, isError } = useQuery<ReviewWithUserAndProduct[]>({
    queryKey: [`/api/reviews/product/${productId}`],
    enabled: !!productId,
  });

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <h2 className="text-xl font-semibold">Customer Reviews</h2>
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={cn("space-y-4", className)}>
        <h2 className="text-xl font-semibold">Customer Reviews</h2>
        <div className="text-center py-10 border border-dashed rounded-lg">
          <p className="text-gray-500">Failed to load reviews.</p>
        </div>
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <h2 className="text-xl font-semibold">Customer Reviews</h2>
        <div className="text-center py-10 border border-dashed rounded-lg">
          <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
        </div>
      </div>
    );
  }

  // Calculate average rating
  const averageRating = 
    reviews.reduce((sum: number, review: ReviewWithUserAndProduct) => sum + review.rating, 0) / 
    reviews.length;
  
  // Calculate rating distribution
  const ratingDistribution = Array(5).fill(0);
  reviews.forEach((review: ReviewWithUserAndProduct) => {
    ratingDistribution[review.rating - 1]++;
  });
  
  // Paginate reviews
  const totalPages = Math.ceil(reviews.length / itemsPerPage);
  const paginatedReviews = reviews.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Render stars based on rating
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

  // Get user initials for avatar
  const getUserInitials = (review: ReviewWithUserAndProduct) => {
    // Prefer real name if available
    if (review.user?.name) {
      const nameParts = review.user.name.split(' ');
      if (nameParts.length > 1) {
        // If there's a full name (first + last), use first letter of each
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
      } else {
        // Single name, use first two letters
        return nameParts[0].slice(0, 2).toUpperCase();
      }
    }
    // Fall back to username
    return review.user?.username ? review.user.username.slice(0, 2).toUpperCase() : "U";
  };

  // Format date
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, "MMM d, yyyy");
  };

  return (
    <div className={cn("space-y-8", className)}>
      <div>
        <h2 className="text-xl font-semibold mb-4">Customer Reviews</h2>
        
        {/* Rating summary */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Average rating */}
            <div className="text-center md:border-r md:border-gray-200 dark:md:border-gray-700 pr-6">
              <div className="text-4xl font-bold text-gray-900 dark:text-white">{averageRating.toFixed(1)}</div>
              <div className="flex justify-center my-2">
                {renderRating(Math.round(averageRating))}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Based on {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
              </div>
            </div>
            
            {/* Rating distribution */}
            <div className="flex-1">
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingDistribution[star - 1];
                  const percentage = (count / reviews.length) * 100;
                  
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 w-12">
                        {star} <Star className="h-3 w-3 ml-1 text-yellow-500 fill-yellow-500" />
                      </div>
                      <div className="h-2 flex-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 w-12">
                        {count} ({percentage.toFixed(0)}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Reviews list */}
      <div className="space-y-6">
        {paginatedReviews.map((review: ReviewWithUserAndProduct) => (
          <div key={review.id} className="border-b border-gray-200 dark:border-gray-800 pb-6 last:border-0">
            <div className="flex items-start gap-4">
              <Avatar className="h-10 w-10 border border-gray-200 dark:border-gray-800">
                <AvatarFallback className="bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                  {getUserInitials(review.user?.username || "")}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap gap-2 items-center">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {review.user?.name || review.user?.username || "Anonymous"}
                  </h3>
                  <div className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                    Verified Purchase
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {renderRating(review.rating)}
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                
                {review.title && (
                  <h4 className="font-medium text-gray-900 dark:text-white mt-2">
                    {review.title}
                  </h4>
                )}
                
                <p className="text-gray-700 dark:text-gray-300 mt-1">
                  {review.comment || "No additional comments."}
                </p>
                
                <div className="flex items-center gap-4 mt-3">
                  <Button variant="ghost" size="sm" className="text-gray-500 dark:text-gray-400 h-8 gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    <span>Helpful</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-500 dark:text-gray-400 h-8 gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>Comment</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-4">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}