import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";

// Create a review schema with validation
const createReviewSchema = z.object({
  productId: z.number(),
  rating: z.number().min(1).max(5),
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  comment: z.string().min(10, "Comment must be at least 10 characters").max(1000, "Comment must be less than 1000 characters"),
});

type FormValues = z.infer<typeof createReviewSchema>;

interface ReviewFormProps {
  productId: number;
  defaultValues?: Partial<FormValues>;
  reviewId?: number;
  onSuccess?: () => void;
}

export function ReviewForm({ productId, defaultValues, reviewId, onSuccess }: ReviewFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hoveredRating, setHoveredRating] = useState(0);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: {
      productId,
      rating: defaultValues?.rating || 0,
      title: defaultValues?.title || "",
      comment: defaultValues?.comment || "",
    },
  });
  
  const createReviewMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const url = reviewId 
        ? `/api/reviews/${reviewId}` 
        : "/api/reviews";
      
      const method = reviewId ? "PATCH" : "POST";
      
      const res = await apiRequest(method, url, values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: reviewId ? "Review updated!" : "Review submitted!",
        description: reviewId 
          ? "Your review has been updated successfully." 
          : "Thank you for sharing your feedback.",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/reviews/product/${productId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}`] });
      
      if (onSuccess) {
        onSuccess();
      }
      
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: FormValues) => {
    createReviewMutation.mutate(values);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Rating */}
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel>Rating</FormLabel>
              <FormControl>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star
                      key={value}
                      className={`h-8 w-8 cursor-pointer ${
                        (hoveredRating || field.value) >= value
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                      onMouseEnter={() => setHoveredRating(value)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => form.setValue("rating", value)}
                    />
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Summarize your experience" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Comment */}
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Review</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Share details of your experience with this product..." 
                  rows={4}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={createReviewMutation.isPending}
        >
          {createReviewMutation.isPending ? "Submitting..." : reviewId ? "Update Review" : "Submit Review"}
        </Button>
      </form>
    </Form>
  );
}