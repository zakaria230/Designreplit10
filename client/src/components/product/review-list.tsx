import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Review } from "@shared/schema";
import { ReviewCard } from "@/components/product/review-card";
import { ReviewForm } from "@/components/product/review-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, MessageSquarePlus, Star } from "lucide-react";

interface ReviewListProps {
  productId: number;
}

export function ReviewList({ productId }: ReviewListProps) {
  const { user } = useAuth();
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  
  const { 
    data: reviews = [], 
    isLoading,
    error
  } = useQuery<Review[]>({
    queryKey: [`/api/reviews/product/${productId}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Check if the current user has already submitted a review
  const userReview = user ? reviews.find(review => review.userId === user.id) : undefined;
  const canReview = user && !userReview;
  
  // Calculate average rating
  const averageRating = reviews.length 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        Failed to load reviews
      </div>
    );
  }
  
  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Customer Reviews</h2>
          <div className="flex items-center mt-1">
            {reviews.length > 0 ? (
              <>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= Math.round(averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="ml-2">
                    {averageRating.toFixed(1)} out of 5 ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              </>
            ) : (
              <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
            )}
          </div>
        </div>
        
        {canReview && (
          <Dialog open={isWriteReviewOpen} onOpenChange={setIsWriteReviewOpen}>
            <DialogTrigger asChild>
              <Button>
                <MessageSquarePlus className="h-4 w-4 mr-2" />
                Write a Review
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Write a Review</DialogTitle>
              </DialogHeader>
              <ReviewForm 
                productId={productId} 
                onSuccess={() => setIsWriteReviewOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} productId={productId} />
          ))}
        </div>
      ) : (
        <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">No reviews yet for this product.</p>
          {canReview && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setIsWriteReviewOpen(true)}
            >
              Be the first to review
            </Button>
          )}
        </div>
      )}
    </div>
  );
}