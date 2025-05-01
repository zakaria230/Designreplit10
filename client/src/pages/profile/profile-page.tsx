import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { ProfileLayout } from "@/components/profile/profile-layout";
import { 
  CalendarClock, 
  Inbox, 
  Download, 
  CreditCard, 
  ArrowRight,
  ShoppingBag
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { getQueryFn } from "@/lib/queryClient";

export default function ProfilePage() {
  const { user } = useAuth();
  const [recentOrders, setRecentOrders] = useState([]);
  
  const { data: orders, isLoading } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

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
          <h2 className="text-xl font-semibold mb-2">Welcome, {user?.username}!</h2>
          <p className="text-gray-600 dark:text-gray-300">
            From here you can view your recent orders, download your purchased assets,
            and manage your account settings.
          </p>
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
                        <Link href={`/profile/orders/${order.id}`}>
                          <Button variant="outline" size="sm">
                            Details
                          </Button>
                        </Link>
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
    </ProfileLayout>
  );
}