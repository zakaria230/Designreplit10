import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Order } from "@shared/schema";
import { Link } from "wouter";
import { AdminLayout } from "@/components/admin/admin-layout";

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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  ArrowLeft, 
  Eye, 
  Download, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

// Order status options
const ORDER_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
  { value: "processing", label: "Processing", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
];

// Payment status options
const PAYMENT_STATUSES = [
  { value: "unpaid", label: "Unpaid", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
  { value: "paid", label: "Paid", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  { value: "refunded", label: "Refunded", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
];

// Interface for order with items
interface OrderWithItems extends Order {
  items?: {
    id: number;
    productId: number;
    quantity: number;
    price: number;
    product: {
      name: string;
      imageUrl?: string;
      downloadUrl?: string;
    };
  }[];
  user?: {
    username: string;
    email: string;
  };
}

export default function OrderManagement() {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  // Items per page
  const perPage = 10;

  // Fetch all orders
  const {
    data: orders,
    isLoading: isLoadingOrders,
    error: ordersError,
    refetch: refetchOrders,
  } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/admin/orders"],
    queryFn: async () => {
      // In a real implementation, this would fetch from the API
      const res = await apiRequest("GET", "/api/admin/orders");
      return await res.json();
    },
  });

  // Fetch order details
  const fetchOrderDetails = async (orderId: number) => {
    try {
      const res = await apiRequest("GET", `/api/admin/orders/${orderId}`);
      const orderWithItems = await res.json();
      setSelectedOrder(orderWithItems);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to fetch order details: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/orders/${orderId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Order Updated",
        description: "The order status has been updated successfully.",
      });
      setIsUpdateDialogOpen(false);
      refetchOrders();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update order status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update payment status mutation
  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ 
      orderId, 
      paymentStatus 
    }: { 
      orderId: number; 
      paymentStatus: string;
    }) => {
      const res = await apiRequest("PATCH", `/api/admin/orders/${orderId}/payment`, { paymentStatus });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Payment Status Updated",
        description: "The payment status has been updated successfully.",
      });
      setIsUpdateDialogOpen(false);
      refetchOrders();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update payment status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle viewing order details
  const handleViewOrder = (order: OrderWithItems) => {
    fetchOrderDetails(order.id);
  };

  // Handle status update
  const handleStatusUpdate = (status: string) => {
    if (!selectedOrder) return;
    updateOrderStatusMutation.mutate({ orderId: selectedOrder.id, status });
  };

  // Handle payment status update
  const handlePaymentStatusUpdate = (paymentStatus: string) => {
    if (!selectedOrder) return;
    updatePaymentStatusMutation.mutate({ orderId: selectedOrder.id, paymentStatus });
  };

  // Filter orders by search query and status
  const filteredOrders = orders
    ? orders.filter((order) => {
        // Filter by search query (order ID or username)
        if (
          searchQuery &&
          !order.id.toString().includes(searchQuery) &&
          !(order.user?.username || "").toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }

        // Filter by order status
        if (statusFilter && order.status !== statusFilter) {
          return false;
        }

        // Filter by payment status
        if (paymentFilter && order.paymentStatus !== paymentFilter) {
          return false;
        }

        return true;
      })
    : [];

  // Paginate orders
  const totalPages = Math.ceil(filteredOrders.length / perPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  // Get status badge color
  const getStatusBadgeClass = (status: string) => {
    const statusItem = ORDER_STATUSES.find((s) => s.value === status);
    return statusItem?.color || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  };

  // Get payment status badge color
  const getPaymentStatusBadgeClass = (status: string) => {
    const statusItem = PAYMENT_STATUSES.find((s) => s.value === status);
    return statusItem?.color || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Order Management | DesignKorv Admin</title>
        <meta name="description" content="Manage customer orders for the DesignKorv e-commerce platform." />
      </Helmet>

      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" asChild className="mr-2">
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by order ID or customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  <span>{statusFilter ? `Status: ${statusFilter}` : "Order Status"}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={paymentFilter || "all"} onValueChange={(value) => setPaymentFilter(value === "all" ? null : value)}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  <span>{paymentFilter ? `Payment: ${paymentFilter}` : "Payment Status"}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                {PAYMENT_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(statusFilter || paymentFilter || searchQuery) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter(null);
                  setPaymentFilter(null);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Orders Table */}
        <div className="border rounded-lg">
          {ordersError ? (
            <div className="p-8 text-center">
              <p className="text-red-500 dark:text-red-400">
                Error loading orders. Please try again later.
              </p>
            </div>
          ) : isLoadingOrders ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : paginatedOrders.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No orders found. {searchQuery || statusFilter || paymentFilter ? "Try adjusting your filters." : ""}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{formatDate(order.createdAt)}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTime(order.createdAt)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{order.user?.username || "Unknown"}</TableCell>
                        <TableCell>{formatPrice(order.totalAmount)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeClass(order.status)}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPaymentStatusBadgeClass(order.paymentStatus)}>
                            {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewOrder(order)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-800">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing <span className="font-medium">{(currentPage - 1) * perPage + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min(currentPage * perPage, filteredOrders.length)}
                    </span>{" "}
                    of <span className="font-medium">{filteredOrders.length}</span> orders
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">Previous Page</span>
                    </Button>
                    <div className="text-sm">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                      <span className="sr-only">Next Page</span>
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Order Detail Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <DialogContent className="sm:max-w-[650px]">
            <DialogHeader>
              <DialogTitle>Order #{selectedOrder?.id}</DialogTitle>
              <DialogDescription>
                Placed on {selectedOrder?.createdAt && formatDate(selectedOrder.createdAt)} at{" "}
                {selectedOrder?.createdAt && formatTime(selectedOrder.createdAt)}
              </DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-6">
                {/* Customer Information */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <p className="font-medium">{selectedOrder.user?.username || "Unknown User"}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedOrder.user?.email || "Email not available"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Status */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Order Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Current Status:</span>
                      <Badge className={getStatusBadgeClass(selectedOrder.status)}>
                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Payment Status:</span>
                      <Badge className={getPaymentStatusBadgeClass(selectedOrder.paymentStatus)}>
                        {selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1)}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Update Status:</span>
                      <div className="flex gap-2">
                        <Select 
                          value={selectedOrder.status} 
                          onValueChange={handleStatusUpdate}
                          disabled={updateOrderStatusMutation.isPending}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Order Status" />
                          </SelectTrigger>
                          <SelectContent>
                            {ORDER_STATUSES.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Select 
                          value={selectedOrder.paymentStatus} 
                          onValueChange={handlePaymentStatusUpdate}
                          disabled={updatePaymentStatusMutation.isPending}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Payment Status" />
                          </SelectTrigger>
                          <SelectContent>
                            {PAYMENT_STATUSES.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {(updateOrderStatusMutation.isPending || updatePaymentStatusMutation.isPending) && (
                      <div className="flex justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Order Items */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Order Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        <div className="divide-y divide-gray-200 dark:divide-gray-800">
                          {selectedOrder.items.map((item) => (
                            <div key={item.id} className="py-3 flex justify-between items-center">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 mr-3">
                                  {item.product && item.product.imageUrl ? (
                                    <img
                                      src={item.product.imageUrl}
                                      alt={item.product.name || 'Product'}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                                      No img
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">{item.product ? item.product.name : `Product #${item.productId}`}</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Qty: {item.quantity} × {formatPrice(item.price)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <p className="font-medium mr-3">
                                  {formatPrice(item.quantity * item.price)}
                                </p>
                                {item.product && item.product.downloadUrl && (
                                  <Button size="sm" variant="outline">
                                    <Download className="h-4 w-4 mr-1" />
                                    Files
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center">
                          No items found in this order.
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between pt-0">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Order Total</p>
                      <p className="text-xl font-bold">{formatPrice(selectedOrder.totalAmount)}</p>
                    </div>
                    {selectedOrder.paymentIntentId && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        <p>Payment ID:</p>
                        <p className="font-mono">{selectedOrder.paymentIntentId}</p>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
