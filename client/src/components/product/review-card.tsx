import { useState } from "react";
import { Review } from "@shared/schema";
import { Star, StarHalf, ThumbsUp, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ReviewForm } from "@/components/product/review-form";

interface ReviewCardProps {
  review: Review;
  productId: number;
}

export function ReviewCard({ review, productId }: ReviewCardProps) {
  const { user } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const deleteReviewMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/reviews/${review.id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/reviews/product/${productId}`] });
      toast({
        title: "Review deleted",
        description: "Your review has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Render stars based on rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="h-5 w-5 fill-yellow-400 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="h-5 w-5 fill-yellow-400 text-yellow-400" />);
    }

    const remainingStars = 5 - stars.length;
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-5 w-5 text-gray-300" />);
    }

    return stars;
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      deleteReviewMutation.mutate();
    }
  };

  const isOwner = user && user.id === review.userId;
  const isAdmin = user && user.role === "admin";
  const canEdit = isOwner || isAdmin;

  return (
    <div className="border rounded-lg p-4 mb-4 bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-semibold text-lg">{review.title}</h4>
          <div className="flex items-center">
            <div className="flex mr-2">{renderStars(review.rating)}</div>
            <span className="text-sm text-gray-500">
              {review.updatedAt && review.updatedAt !== review.createdAt
                ? `Updated on ${formatDate(review.updatedAt)}`
                : formatDate(review.createdAt)}
            </span>
          </div>
        </div>
        {canEdit && (
          <div className="flex space-x-2">
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit your review</DialogTitle>
                </DialogHeader>
                <ReviewForm 
                  productId={productId} 
                  defaultValues={{
                    rating: review.rating,
                    title: review.title || "",
                    comment: review.comment || "",
                  }}
                  reviewId={review.id}
                  onSuccess={() => setIsEditOpen(false)}
                />
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1 text-red-500" />
              Delete
            </Button>
          </div>
        )}
      </div>
      <p className="mt-2 text-gray-700 dark:text-gray-300">{review.comment}</p>
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-500">
          By User #{review.userId}
        </div>
        <Button variant="ghost" size="sm">
          <ThumbsUp className="h-4 w-4 mr-1" />
          Helpful
        </Button>
      </div>
    </div>
  );
}