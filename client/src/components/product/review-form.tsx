import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";

interface ReviewFormProps {
  productId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function ReviewForm({ productId, onSuccess, onCancel, className }: ReviewFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const { toast } = useToast();

  // Check if form is valid
  const isFormValid = rating > 0 && title.trim().length >= 3;

  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: async () => {
      const reviewData = {
        productId,
        rating,
        title: title.trim(),
        comment: comment.trim(),
      };

      const response = await apiRequest("POST", "/api/reviews", reviewData);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit review");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
      
      // Reset form
      setRating(0);
      setTitle("");
      setComment("");
      
      // Invalidate product reviews query to refresh the list
      queryClient.invalidateQueries({ queryKey: [`/api/reviews/product/${productId}`] });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      // Show a specific message for "already reviewed" error
      if (error.message.includes("already reviewed")) {
        toast({
          title: "Already reviewed",
          description: "You have already submitted a review for this product.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to submit review",
          variant: "destructive",
        });
      }
    },
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    createReviewMutation.mutate();
  };

  return (
    <div className={className}>
      <h3 className="text-lg font-medium mb-4">Write a Review</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating stars */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Your Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1"
              >
                <Star
                  className={`h-6 w-6 transition-colors ${
                    (hoverRating ? value <= hoverRating : value <= rating)
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-500">
              {rating > 0 ? [
                "Poor",
                "Fair",
                "Good",
                "Very Good",
                "Excellent"
              ][rating - 1] : "Select a rating"}
            </span>
          </div>
          {rating === 0 && createReviewMutation.isPending && (
            <p className="text-sm text-red-500">Please select a rating</p>
          )}
        </div>
        
        {/* Review title */}
        <div className="space-y-2">
          <label htmlFor="review-title" className="text-sm font-medium">
            Review Title <span className="text-red-500">*</span>
          </label>
          <Input
            id="review-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your experience"
            maxLength={100}
            disabled={createReviewMutation.isPending}
          />
          {title.trim().length < 3 && title.trim().length > 0 && (
            <p className="text-sm text-red-500">Title must be at least 3 characters</p>
          )}
          <div className="text-xs text-gray-500 text-right">
            {title.length}/100
          </div>
        </div>
        
        {/* Review comment */}
        <div className="space-y-2">
          <label htmlFor="review-comment" className="text-sm font-medium">
            Your Review (Optional)
          </label>
          <Textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            rows={4}
            disabled={createReviewMutation.isPending}
          />
        </div>
        
        {/* Submit button */}
        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={createReviewMutation.isPending}
            >
              Cancel
            </Button>
          )}
          
          <Button 
            type="submit" 
            disabled={!isFormValid || createReviewMutation.isPending}
          >
            {createReviewMutation.isPending ? (
              <>
                <span className="animate-spin mr-2">⊚</span>
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}