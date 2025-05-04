import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { ProfileLayout } from "@/components/profile/profile-layout";
import { 
  CalendarClock, 
  Inbox, 
  Download, 
  CreditCard, 
  ArrowRight,
  ShoppingBag,
  Eye,
  Package,
  Mail,
  Loader2
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Order, OrderItem, Product } from "@shared/schema";

interface OrderWithItems extends Order {
  items?: (OrderItem & { product?: Product })[];
  notes?: string | null;
}

// Email Verification Button Component
function EmailVerificationButton() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  
  const sendVerificationEmailMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/send-verification-email", {});
      return await res.json();
    },
    onSuccess: (data) => {
      setVerificationSent(true);
      setShowVerificationMessage(true);
      toast({
        title: "Verification Link Generated",
        description: "Check the server logs (or dialog box) for the verification link.",
        duration: 10000,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification email.",
        variant: "destructive",
      });
    },
  });
  
  const handleSendVerificationEmail = () => {
    sendVerificationEmailMutation.mutate();
  };
  
  return (
    <>
      <Button 
        variant="outline"
        className="flex items-center gap-2"
        onClick={handleSendVerificationEmail}
        disabled={sendVerificationEmailMutation.isPending}
      >
        {sendVerificationEmailMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating link...
          </>
        ) : (
          <>
            <Mail className="h-4 w-4" />
            Generate Verification Link
          </>
        )}
      </Button>
      
      {/* Information dialog about email simulation */}
      <Dialog open={showVerificationMessage} onOpenChange={setShowVerificationMessage}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Email Verification Link Generated</DialogTitle>
            <DialogDescription>
              Since we're not using a real email service in this demo, the verification link is displayed in the server logs. 
              Please check the console logs where the server is running to find your verification link.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md text-sm font-mono overflow-auto max-h-40">
            <p className="mb-2 text-green-600 dark:text-green-400">Look for this section in the server logs:</p>
            <p>==================================================</p>
            <p>VERIFICATION EMAIL (SIMULATION)</p>
            <p>==================================================</p>
            <p>...</p>
            <p>http://localhost:5000/verify-email?token=TOKEN_VALUE</p>
            <p>...</p>
          </div>
          <p className="mt-2 text-sm">
            Copy the full verification URL from the server logs and paste it in your browser to verify your email.
          </p>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setShowVerificationMessage(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  
  const { data: orders, isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });
  
  const handleViewOrder = (order: OrderWithItems) => {
    setSelectedOrder(order);
  };

  // Format date to display in readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Format price to display with 2 decimal places
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  useEffect(() => {
    if (orders && orders.length > 0) {
      setRecentOrders(orders.slice(0, 3));
    }
  }, [orders]);

  return (
    <ProfileLayout 
      title="Profile Overview" 
      description="Welcome back! Manage your orders, downloads, and account settings."
    >
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-primary/10 p-4 rounded-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Welcome, {user?.username}!</h2>
              <p className="text-gray-600 dark:text-gray-300">
                From here you can view your recent orders, download your purchased assets,
                and manage your account settings.
              </p>
            </div>
            <EmailVerificationButton />
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Orders</p>
                <p className="text-2xl font-bold">{orders?.length || 0}</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-primary opacity-80" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Downloads</p>
                <p className="text-2xl font-bold">{orders?.length || 0}</p>
              </div>
              <Download className="h-8 w-8 text-primary opacity-80" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
                <p className="text-lg font-bold">{user?.createdAt ? formatDate(user.createdAt) : "N/A"}</p>
              </div>
              <CalendarClock className="h-8 w-8 text-primary opacity-80" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Spent</p>
                <p className="text-2xl font-bold">
                  {formatPrice(orders?.reduce((total, order) => total + order.totalAmount, 0) || 0)}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-primary opacity-80" />
            </div>
          </div>
        </div>
        
        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Orders</h3>
            <Link href="/profile/orders">
              <Button variant="link" className="p-0 h-auto">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-gray-500 dark:text-gray-400">Loading your orders...</p>
            </div>
          ) : recentOrders && recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-2 text-left">Order ID</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Total</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-2">#{order.id}</td>
                      <td className="px-4 py-2">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'completed' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : order.status === 'processing'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-2">{formatPrice(order.totalAmount)}</td>
                      <td className="px-4 py-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewOrder(order)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              <Inbox className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-medium mb-1">No orders yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                You haven't placed any orders yet.
              </p>
              <Link href="/shop">
                <Button>Start Shopping</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Order #{selectedOrder.id}</DialogTitle>
              <DialogDescription>
                Placed on {formatDate(selectedOrder.createdAt)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Order status */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                    selectedOrder.status === 'completed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : selectedOrder.status === 'processing'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      : selectedOrder.status === 'cancelled'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                  }`}>
                    {selectedOrder.status?.charAt(0).toUpperCase() + selectedOrder.status?.slice(1) || 'Pending'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Payment</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                    selectedOrder.paymentStatus === 'paid' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                  }`}>
                    {selectedOrder.paymentStatus 
                      ? selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1)
                      : 'Pending'}
                  </span>
                </div>
              </div>
              
              {/* Order items */}
              <div>
                <h3 className="text-lg font-medium mb-3">Order Items</h3>
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="py-3 flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="h-12 w-12 rounded overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 mr-3">
                            {item.product && item.product.imageUrl ? (
                              <img
                                src={item.product.imageUrl}
                                alt={item.product.name || 'Product'}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-gray-400">
                                <Package className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {item.product ? item.product.name : `Product #${item.productId}`}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Qty: {item.quantity} × {formatPrice(item.price)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="font-medium mr-3">
                            {formatPrice(item.quantity * item.price)}
                          </span>
                          {item.product && item.product.downloadUrl && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={item.product.downloadUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-3">
                    No items found in this order.
                  </p>
                )}
              </div>
              
              {/* Order summary */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium">{formatPrice(selectedOrder.totalAmount)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600 dark:text-gray-400">Taxes</span>
                  <span className="font-medium">{formatPrice(0)}</span>
                </div>
                <div className="flex justify-between py-1 text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(selectedOrder.totalAmount)}</span>
                </div>
              </div>
              
              {/* Notes */}
              {selectedOrder.notes && selectedOrder.notes.trim() !== "" && (
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </ProfileLayout>
  );
}