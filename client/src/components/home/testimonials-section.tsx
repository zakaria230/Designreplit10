import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";

// Define the review type
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
    name?: string;
  };
  product?: {
    id: number;
    name: string;
    slug: string;
  };
}

// Fallback data if API doesn't return anything
const sampleReviews: ReviewWithUserAndProduct[] = [
  {
    id: 1,
    userId: 1,
    productId: 3,
    rating: 5,
    title: "Amazing design files",
    comment: "These design files are exactly what I needed for my latest project. The quality is exceptional!",
    createdAt: new Date().toISOString(),
    user: {
      id: 1,
      username: "daswa",
    },
    product: {
      id: 3,
      name: "sdsaw",
      slug: "sdaw",
    }
  },
  {
    id: 2,
    userId: 2,
    productId: 5,
    rating: 5,
    title: "Professional quality",
    comment: "The design assets exceeded my expectations. Perfect for my client projects!",
    createdAt: new Date().toISOString(),
    user: {
      id: 2,
      username: "designer_pro",
    },
    product: {
      id: 5,
      name: "Christmas designs",
      slug: "christmas-designs",
    }
  },
  {
    id: 3,
    userId: 3,
    productId: 4,
    rating: 5,
    title: "Time-saving templates",
    comment: "These templates have saved me hours of work. The attention to detail is impressive!",
    createdAt: new Date().toISOString(),
    user: {
      id: 3,
      username: "creative_mind",
    },
    product: {
      id: 4,
      name: "Fashion templates",
      slug: "fashion-templates",
    }
  }
];

export function TestimonialsSection() {
  // Fetch reviews from API
  const { data: apiReviews, isLoading } = useQuery<ReviewWithUserAndProduct[]>({
    queryKey: ["/api/reviews/featured"],
  });

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch {
      return "Recent";
    }
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
    return review.user?.username ? review.user.username.slice(0, 2).toUpperCase() : "UK";
  };

  // Display stars for rating
  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} 
      />
    ));
  };

  // Show loading skeletons while fetching data
  const renderSkeletons = () => {
    return Array(3).fill(0).map((_, i) => (
      <div key={i} className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm">
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

  // Use API reviews if available, otherwise use sample reviews
  const reviews = apiReviews && apiReviews.length > 0 
    ? apiReviews 
    : sampleReviews;

  return (
    <section className="py-12 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            What Our Customers Say
          </h2>
          <p className="max-w-2xl mx-auto text-gray-500 dark:text-gray-400 text-lg">
            Designers around the world trust DesignKorv for premium digital fashion assets that 
            enhance their creativity and productivity.
          </p>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {renderSkeletons()}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reviews.map((review) => (
              <div 
                key={review.id}
                className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm"
              >
                <div className="flex items-center mb-2">
                  <div className="flex">
                    {renderStars(review.rating)}
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
                        {getUserInitials(review)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {review.user?.name || review.user?.username || "Anonymous"}
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
        )}
      </div>
    </section>
  );
}
