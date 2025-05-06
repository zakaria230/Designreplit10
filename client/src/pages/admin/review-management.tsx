import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Review, User, Product } from "@shared/schema";

interface ReviewWithUserAndProduct extends Review {
  user?: User;
  product?: Product;
}

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Loader2, MoreHorizontal, Star, Trash, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ReviewManagement() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReview, setSelectedReview] = useState<ReviewWithUserAndProduct | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Fetch all reviews with users and products data
  const {
    data: reviews,
    isLoading,
    isError,
  } = useQuery<ReviewWithUserAndProduct[]>({
    queryKey: ["/api/admin/reviews"],
    select: (data) => {
      if (!data) return [];
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return data.filter(
          (review: ReviewWithUserAndProduct) =>
            review.product?.name?.toLowerCase().includes(query) ||
            review.user?.username?.toLowerCase().includes(query) ||
            review.title?.toLowerCase().includes(query) ||
            review.comment?.toLowerCase().includes(query)
        );
      }
      
      return data;
    },
  });

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/reviews/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete review");
      }
      return id;
    },
    onSuccess: () => {
      toast({
        title: "Review deleted",
        description: "The review has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete review",
        variant: "destructive",
      });
    },
  });

  // Handle review deletion
  const handleDeleteReview = (id: number) => {
    deleteReviewMutation.mutate(id);
  };

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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

  // Pagination logic
  const itemsPerPage = 10;
  const paginatedReviews = reviews
    ? reviews.slice((page - 1) * itemsPerPage, page * itemsPerPage)
    : [];
  const totalPages = reviews ? Math.ceil(reviews.length / itemsPerPage) : 0;

  if (isLoading) {
    return (
      <AdminLayout activeTab="reviews">
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout activeTab="reviews">
        <div className="text-center py-12">
          <p className="text-red-500">Error loading reviews. Please try again.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeTab="reviews">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Customer Reviews</h1>
          <div className="flex space-x-2">
            <Input
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
          </div>
        </div>

        {reviews?.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-lg">
            <p className="text-gray-500">No reviews found.</p>
          </div>
        ) : (
          <>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReviews.map((review: any) => (
                    <TableRow key={review.id}>
                      <TableCell>{review.id}</TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {review.product?.name || "Unknown Product"}
                      </TableCell>
                      <TableCell>{review.user?.username || "Unknown User"}</TableCell>
                      <TableCell>
                        <div className="flex">
                          {renderRating(review.rating)}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {review.title || "No title"}
                      </TableCell>
                      <TableCell>{formatDate(review.createdAt)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedReview(review);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedReview(review);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((p) => Math.max(p - 1, 1));
                      }}
                      className={page === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(p);
                        }}
                        isActive={page === p}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((p) => Math.min(p + 1, totalPages));
                      }}
                      className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}

        {/* View/Edit Review Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Review Details</DialogTitle>
              <DialogDescription>
                View complete details of the customer review.
              </DialogDescription>
            </DialogHeader>
            {selectedReview && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Product</p>
                    <p>{selectedReview.product?.name || "Unknown Product"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">User</p>
                    <p>{selectedReview.user?.username || "Unknown User"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Rating</p>
                    <div className="flex mt-1">
                      {renderRating(selectedReview.rating)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p>{formatDate(selectedReview.createdAt)}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Title</p>
                  <p>{selectedReview.title || "No title"}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Comment</p>
                  <div className="mt-1 bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                    <p className="whitespace-pre-wrap">
                      {selectedReview.comment || "No comment provided"}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button 
                variant="destructive"
                onClick={() => {
                  setIsViewDialogOpen(false);
                  setSelectedReview(selectedReview);
                  setIsDeleteDialogOpen(true);
                }}
              >
                Delete Review
              </Button>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this review? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() => selectedReview?.id && handleDeleteReview(selectedReview.id)}
                disabled={deleteReviewMutation.isPending}
              >
                {deleteReviewMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}