import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import {
  DollarSign,
  Users,
  ShoppingBag,
  Package,
  TrendingUp,
  Layers,
  Loader2,
  ChevronRight,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Eye,
  Receipt,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";

// Colors for charts
const COLORS = ["#14b8a6", "#8b5cf6", "#ef4444", "#f59e0b"];

export default function AdminDashboard() {
  // Selected order for the dialog
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Fetch overview stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Admin Dashboard | DesignKorv</title>
        <meta
          name="description"
          content="Admin dashboard for DesignKorv e-commerce platform."
        />
      </Helmet>

      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              className="flex items-center gap-2 justify-center bg-white dark:bg-gray-800 shadow-sm"
            >
              <Link href="/admin/products">Manage Products</Link>
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  formatCurrency(stats?.totalRevenue || 0)
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Track your revenue here
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  stats?.totalUsers || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Track your user growth here
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Total Orders
              </CardTitle>
              <ShoppingBag className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  stats?.totalOrders || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Track your order metrics here
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <Package className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  stats?.totalProducts || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Track your product inventory here
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="sales">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="sales">
                <LineChartIcon className="h-4 w-4 mr-2" />
                Sales
              </TabsTrigger>
              <TabsTrigger value="categories">
                <BarChart3 className="h-4 w-4 mr-2" />
                Categories
              </TabsTrigger>
              <TabsTrigger value="orders">
                <PieChartIcon className="h-4 w-4 mr-2" />
                Orders
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="sales" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
                <CardDescription>
                  Monthly sales data for the current year
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {isLoadingStats ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : stats?.salesData &&
                    Array.isArray(stats.salesData) &&
                    stats.salesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.salesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          formatter={(value: any) => [`$${value}`, "Sales"]}
                          labelFormatter={(label: any) => `Month: ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="#14b8a6"
                          strokeWidth={2}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">
                        No sales data available yet
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="categories" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales by Category</CardTitle>
                <CardDescription>
                  Distribution of sales across product categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {isLoadingStats ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : stats?.categoryData &&
                    Array.isArray(stats.categoryData) &&
                    stats.categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.categoryData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8b5cf6">
                          {stats.categoryData.map(
                            (entry: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ),
                          )}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">
                        No category sales data available yet
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="orders" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
                <CardDescription>
                  Distribution of orders by status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  {isLoadingStats ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : stats?.orderStatusData &&
                    Array.isArray(stats.orderStatusData) &&
                    stats.orderStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.orderStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }: any) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {stats.orderStatusData.map(
                            (entry: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ),
                          )}
                        </Pie>
                        <Tooltip
                          formatter={(value: any, name: any) => [
                            `${value} orders`,
                            name,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">
                        No order status data available yet
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recent Orders Section */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Completed Orders</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingStats ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : stats?.recentOrders &&
                      Array.isArray(stats.recentOrders) &&
                      stats.recentOrders.length > 0 ? (
                      stats.recentOrders
                        .filter(
                          (order: any) =>
                            order.status === "completed" &&
                            order.paymentStatus === "paid",
                        )
                        .map((order: any) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">
                              #{order.id}
                            </TableCell>
                            <TableCell>
                              {order.user?.username || "Unknown"}
                            </TableCell>
                            <TableCell>
                              {new Date(
                                order.createdAt || "",
                              ).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                completed
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(order.totalAmount || 0)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setSelectedOrder(order)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground"
                        >
                          No orders yet. Orders will appear here as they are
                          placed.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              Placed on{" "}
              {selectedOrder?.createdAt && formatDate(selectedOrder.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Information */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {selectedOrder.user?.username || "Unknown User"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedOrder.user?.email || "Email not available"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Order Details */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Order Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Status
                      </p>
                      <p className="font-medium capitalize">
                        {selectedOrder.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Payment Status
                      </p>
                      <p className="font-medium capitalize">
                        {selectedOrder.paymentStatus}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Payment Method
                      </p>
                      <p className="font-medium">PayPal</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Total Amount
                      </p>
                      <p className="font-medium">
                        {formatCurrency(selectedOrder.totalAmount || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <p className="font-medium mb-2">Order Items</p>
                    {selectedOrder.items &&
                    Array.isArray(selectedOrder.items) &&
                    selectedOrder.items.length > 0 ? (
                      <div className="space-y-2">
                        {selectedOrder.items.map((item: any) => (
                          <div
                            key={item.id}
                            className="border rounded p-3 flex justify-between items-center"
                          >
                            <div className="flex items-center gap-3">
                              <div>
                                <p className="font-medium">
                                  {item.product?.name ||
                                    `Product #${item.productId}`}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Quantity: {item.quantity} ×{" "}
                                  {formatCurrency(item.price || 0)}
                                </p>
                              </div>
                            </div>
                            <div className="font-medium">
                              {formatCurrency(item.price * item.quantity || 0)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No items found
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {selectedOrder.notes && selectedOrder.notes.trim() !== "" && (
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
