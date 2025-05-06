import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Interface for review data
interface ReviewData {
  productId: number;
  rating: number;
  title: string;
  comment: string;
}

// Product data from API
interface Product {
  id: number;
  name: string;
  slug: string;
  images?: { url: string; isPrimary: boolean }[];
}

// Review form props
interface ReviewFormProps {
  products?: Product[];
  productId?: number;
  initialReview?: {
    id: number;
    productId: number;
    rating: number;
    title: string;
    comment: string;
    product?: {
      id: number;
      name: string;
    };
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ 
  products, 
  productId, 
  initialReview, 
  onSuccess, 
  onCancel 
}: ReviewFormProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState<number>(initialReview?.rating || 5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  
  // Initialize form with default values or existing review data
  const form = useForm<ReviewData>({
    defaultValues: {
      productId: initialReview?.productId || productId || (products?.length ? products[0].id : 0),
      rating: initialReview?.rating || 5,
      title: initialReview?.title || "",
      comment: initialReview?.comment || "",
    },
  });

  // Create or update review mutation
  const mutation = useMutation({
    mutationFn: async (data: ReviewData) => {
      // Update rating from the star rating component
      data.rating = rating;
      
      // For existing review, use PUT to update
      if (initialReview) {
        const response = await apiRequest(
          "PUT", 
          `/api/reviews/${initialReview.id}`,
          data
        );
        
        if (!response.ok) {
          throw new Error("Failed to update review");
        }
        
        return await response.json();
      } 
      // For new review, use POST to create
      else {
        const response = await apiRequest("POST", "/api/reviews", data);
        
        if (!response.ok) {
          throw new Error("Failed to create review");
        }
        
        return await response.json();
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/featured"] });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/reviews/product/${form.getValues().productId}`] 
      });
      
      // Display success message
      toast({
        title: initialReview ? "Review updated" : "Review submitted",
        description: initialReview
          ? "Your review has been successfully updated"
          : "Thank you for your feedback!",
      });
      
      // Reset form for new reviews
      if (!initialReview) {
        form.reset();
        setRating(5);
      }
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      // Display error message
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    },
  });

  // Star rating renderer
  const renderStars = () => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="focus:outline-none"
            onClick={() => {
              setRating(star);
              form.setValue("rating", star);
            }}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(null)}
          >
            <Star
              className={`h-6 w-6 ${
                star <= (hoveredRating || rating)
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  // Form submission handler
  const onSubmit = (data: ReviewData) => {
    mutation.mutate(data);
  };

  // Get product name for editing based on the product ID
  const getProductName = (id: number) => {
    if (initialReview?.product) {
      return initialReview.product.name;
    }
    
    if (products) {
      const product = products.find(p => p.id === id);
      return product ? product.name : "Unknown Product";
    }
    
    return "Product";
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Product selection field (only shown when multiple products available) */}
        {products && products.length > 1 && !initialReview && (
          <FormField
            control={form.control}
            name="productId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product</FormLabel>
                <Select
                  defaultValue={String(field.value)}
                  onValueChange={(value) => field.onChange(Number(value))}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={String(product.id)}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* For editing, show product name */}
        {initialReview && (
          <div className="mb-4">
            <FormLabel className="text-sm text-gray-500">Product</FormLabel>
            <div className="font-medium">
              {getProductName(initialReview.productId)}
            </div>
          </div>
        )}

        {/* Rating field */}
        <div className="space-y-2">
          <FormLabel>Rating</FormLabel>
          <div className="flex items-center">
            {renderStars()}
            <span className="ml-2 text-sm text-gray-500">
              {rating} {rating === 1 ? "star" : "stars"}
            </span>
          </div>
        </div>

        {/* Review title field */}
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

        {/* Review comment field */}
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Review</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Share your thoughts about this product"
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form actions */}
        <div className="flex justify-end space-x-2 pt-2">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Submitting...
              </span>
            ) : initialReview ? (
              "Update Review"
            ) : (
              "Submit Review"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}