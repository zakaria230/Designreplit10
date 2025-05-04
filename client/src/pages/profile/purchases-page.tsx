import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { ProfileLayout } from "@/components/profile/profile-layout";
import { getQueryFn } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Search, 
  Download, 
  Receipt, 
  CreditCard, 
  Box,
  Calendar,
  ArrowRight,
  Package
} from "lucide-react";
import { format } from "date-fns";

export default function PurchasesPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");

  // Fetch orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  // Format date to display in readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy");
  };

  // Format price to display with 2 decimal places
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Filter orders based on time frame
  const filterByTime = (order) => {
    if (timeFilter === "all") return true;
    
    const orderDate = new Date(order.createdAt);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    const ninetyDaysAgo = new Date(now.setDate(now.getDate() - 60)); // 90 days total
    const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
    
    if (timeFilter === "30days" && orderDate >= thirtyDaysAgo) return true;
    if (timeFilter === "90days" && orderDate >= ninetyDaysAgo) return true;
    if (timeFilter === "year" && orderDate >= oneYearAgo) return true;
    
    return false;
  };

  // Get all purchased products
  const getPurchasedProducts = () => {
    if (!orders) return [];
    
    const purchasedItems = [];
    const completedOrders = orders.filter(order => 
      order.status === "completed" && filterByTime(order)
    );
    
    completedOrders.forEach(order => {
      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          if (item.product) {
            const purchaseRecord = {
              id: `${order.id}-${item.id}`,
              orderId: order.id,
              orderDate: order.createdAt,
              productId: item.productId,
              productName: item.product.name,
              quantity: item.quantity,
              price: item.price,
              totalPrice: item.price * item.quantity,
              imageUrl: item.product.imageUrl,
              downloadUrl: item.product.downloadUrl,
              paymentMethod: order.paymentMethod || "card",
              paymentStatus: order.paymentStatus || "paid"
            };
            
            // Only include in results if it matches search term
            if (
              searchTerm === "" || 
              purchaseRecord.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              String(purchaseRecord.orderId).includes(searchTerm)
            ) {
              purchasedItems.push(purchaseRecord);
            }
          }
        });
      }
    });
    
    // Sort by most recent first
    return purchasedItems.sort((a, b) => 
      new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
    );
  };

  const purchasedItems = getPurchasedProducts();
  
  // Calculate total spent
  const totalSpent = purchasedItems.reduce((total, item) => total + item.totalPrice, 0);

  return (
    <ProfileLayout 
      title="My Purchases" 
      description="View and manage your purchase history"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Purchases</p>
                <p className="text-2xl font-bold">{purchasedItems.length}</p>
              </div>
              <Box className="h-10 w-10 text-primary/70" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Spent</p>
                <p className="text-2xl font-bold">{formatPrice(totalSpent)}</p>
              </div>
              <CreditCard className="h-10 w-10 text-primary/70" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Latest Purchase</p>
                <p className="text-lg font-bold">
                  {purchasedItems.length > 0 
                    ? formatDate(purchasedItems[0].orderDate) 
                    : "No purchases"}
                </p>
              </div>
              <Calendar className="h-10 w-10 text-primary/70" />
            </div>
          </div>
        </div>
        
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder="Search purchases by product name or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-transparent border border-gray-300 dark:border-gray-600 rounded-md h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Time</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="year">Last Year</option>
            </select>
          </div>
        </div>

        {/* Purchases List */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading your purchase history...</p>
          </div>
        ) : purchasedItems.length > 0 ? (
          <div className="space-y-4">
            {purchasedItems.map((item) => (
              <div 
                key={item.id} 
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row"
              >
                <div className="flex-shrink-0 sm:mr-4 mb-3 sm:mb-0">
                  <div className="h-16 w-16 rounded bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.productName} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-1">
                    <h3 className="font-medium text-lg">{item.productName}</h3>
                    <p className="text-lg font-bold mt-1 sm:mt-0">
                      {formatPrice(item.totalPrice)}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <span className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      {formatDate(item.orderDate)}
                    </span>
                    <span className="flex items-center">
                      <Receipt className="h-3.5 w-3.5 mr-1" />
                      Order #{item.orderId}
                    </span>
                    <span className="flex items-center">
                      <CreditCard className="h-3.5 w-3.5 mr-1" />
                      {item.paymentMethod?.charAt(0).toUpperCase() + item.paymentMethod?.slice(1) || "Card"}
                    </span>
                    <span>
                      Qty: {item.quantity} × {formatPrice(item.price)}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href="/profile/downloads">
                        Go to Downloads
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <Receipt className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium mb-1">No purchase history</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm || timeFilter !== "all" 
                ? "No purchases match your current filters. Try adjusting your search criteria."
                : "You haven't made any purchases yet."}
            </p>
          </div>
        )}
      </div>
    </ProfileLayout>
  );
}