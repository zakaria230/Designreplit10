import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { ProfileLayout } from "@/components/profile/profile-layout";
import { Button } from "@/components/ui/button";
import { Star, PencilIcon, Trash2Icon } from "lucide-react";
import { Product } from "@/components/product/review-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ReviewForm } from "@/components/product/review-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import SEO from "@/components/seo";

interface ReviewWithProduct {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  product?: {
    id: number;
    name: string;
    slug: string;
    images?: { url: string; isPrimary: boolean }[];
  };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star}>
          <Star 
            key={star}
            className={`h-4 w-4 ${star <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
          />
        </span>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [editingReview, setEditingReview] = useState<ReviewWithProduct | null>(null);
  
  // Fetch the user's reviews
  const { data: reviews, isLoading, error } = useQuery<ReviewWithProduct[]>({
    queryKey: ["/api/reviews/user"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Define interface for order items
  interface OrderItem {
    product?: Product;
    quantity: number;
    price: number;
  }

  // Define interface for orders
  interface Order {
    id: number;
    orderCode: string;
    status: string;
    paymentStatus: string;
    items?: OrderItem[];
  }

  // Fetch user's purchases for products they can review
  const { data: purchases } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    select: (data) => {
      if (!data) return [];
      return data.filter(order => order.status === "completed" && order.paymentStatus === "paid");
    }
  });

  // Function to get a list of products the user has purchased but not reviewed
  const getUnreviewedProducts = () => {
    if (!purchases || !reviews) return [];
    
    // Extract unique product IDs from completed purchases
    const purchasedProductIds = new Set();
    purchases.forEach(order => {
      order.items?.forEach(item => {
        if (item.product && item.product.id) {
          purchasedProductIds.add(item.product.id);
        }
      });
    });
    
    // Filter out products that have already been reviewed
    const reviewedProductIds = new Set(reviews.map(review => review.productId));
    
    // Return products that have been purchased but not reviewed
    return Array.from(purchasedProductIds)
      .filter(productId => !reviewedProductIds.has(productId as number))
      .map(productId => {
        // Find the product details from purchases
        let productDetails = null;
        purchases.forEach(order => {
          order.items?.forEach(item => {
            if (item.product && item.product.id === productId) {
              productDetails = item.product;
            }
          });
        });
        return productDetails;
      })
      .filter(product => product !== null);
  };

  // Mutation to delete a review
  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: number) => {
      const response = await apiRequest("DELETE", `/api/reviews/${reviewId}`);
      if (!response.ok) {
        throw new Error("Failed to delete review");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/featured"] });
      toast({
        title: "Review deleted",
        description: "Your review has been successfully deleted",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete review",
        variant: "destructive",
      });
    },
  });

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      return "Unknown date";
    }
  };

  // Get product image URL
  const getProductImage = (review: ReviewWithProduct) => {
    if (!review.product) return "";
    
    if (review.product.images && review.product.images.length > 0) {
      const primaryImage = review.product.images.find(img => img.isPrimary);
      return primaryImage ? primaryImage.url : review.product.images[0].url;
    }
    
    return "";
  };

  // Render loading skeletons
  const renderSkeletons = () => (
    <>
      {[1, 2, 3].map((_, index) => (
        <Card key={index} className="mb-4">
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-16 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-4 w-32" />
          </CardFooter>
        </Card>
      ))}
    </>
  );

  return (
    <ProfileLayout
      title="My Reviews"
      description="View and manage your product reviews"
    >
      <SEO 
        title="My Reviews | DesignKorv" 
        description="View and manage your product reviews"
      />
      
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">My Reviews</h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage your product reviews
            </p>
          </div>
        </div>

        {/* Show review form for new reviews if user has products to review */}
        {getUnreviewedProducts().length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Write a Review</CardTitle>
              <CardDescription>
                Share your thoughts about products you've purchased
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewForm 
                products={getUnreviewedProducts()}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/reviews/user"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/reviews/featured"] });
                }}
              />
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          renderSkeletons()
        ) : error ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Failed to load reviews. Please try again later.
          </div>
        ) : reviews && reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {review.product && (
                    <div className="md:w-1/4 bg-gray-100 dark:bg-gray-800 p-4 flex items-center justify-center">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-white dark:bg-gray-700 rounded-md flex items-center justify-center overflow-hidden mb-2">
                          {getProductImage(review) ? (
                            <img 
                              src={getProductImage(review)}
                              alt={review.product.name}
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <div className="text-xs text-gray-500 dark:text-gray-400 p-2">
                              No image
                            </div>
                          )}
                        </div>
                        <h3 className="text-sm font-medium line-clamp-2">
                          {review.product.name}
                        </h3>
                      </div>
                    </div>
                  )}
                  
                  <div className={`flex-1 p-4 ${review.product ? 'md:w-3/4' : 'w-full'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <StarRating rating={review.rating} />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                        {review.title && (
                          <h3 className="font-medium">{review.title}</h3>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditingReview(review)}
                          title="Edit review"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-500 hover:text-red-600"
                              title="Delete review"
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete review</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this review? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-500 hover:bg-red-600"
                                onClick={() => deleteReviewMutation.mutate(review.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                      {review.comment}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              You haven't written any reviews yet. Reviews help other customers make informed decisions.
            </p>
            {getUnreviewedProducts().length === 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Purchase products to be able to leave reviews.
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Edit Review Modal */}
      {editingReview && (
        <AlertDialog open={!!editingReview} onOpenChange={() => setEditingReview(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Your Review</AlertDialogTitle>
              <AlertDialogDescription>
                Update your review for {editingReview.product?.name}
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="py-4">
              <ReviewForm 
                initialReview={editingReview}
                onSuccess={() => {
                  setEditingReview(null);
                  queryClient.invalidateQueries({ queryKey: ["/api/reviews/user"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/reviews/featured"] });
                }}
                onCancel={() => setEditingReview(null)}
              />
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </ProfileLayout>
  );
}