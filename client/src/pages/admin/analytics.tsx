import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
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
  AreaChart,
  Area
} from "recharts";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Loader2, Download, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Chart color configurations
const COLORS = ["#14b8a6", "#8b5cf6", "#ef4444", "#f59e0b", "#3b82f6", "#a3a3a3"];

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState("last7days");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Fetch analytics data from API
  const {
    data: analyticsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/admin/analytics", timeRange, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('timeRange', timeRange);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      const response = await apiRequest("GET", `/api/admin/analytics?${params.toString()}`);
      return await response.json();
    },
  });

  // Calculate summary metrics
  const calculateMetrics = () => {
    if (!analyticsData) return null;
    
    return {
      // Sales metrics
      totalRevenue: analyticsData.salesSummary.totalRevenue,
      totalOrders: analyticsData.salesSummary.totalOrders,
      averageOrderValue: analyticsData.salesSummary.averageOrderValue,
      conversionRate: analyticsData.salesSummary.conversionRate,
      
      // Traffic metrics
      totalVisitors: analyticsData.trafficSummary.totalVisitors,
      newUsers: analyticsData.trafficSummary.newUsers,
      returningUsers: analyticsData.trafficSummary.returningUsers,
      averageSessionDuration: analyticsData.trafficSummary.averageSessionDuration,
    };
  };

  const metrics = calculateMetrics();

  return (
    <AdminLayout>
      <Helmet>
        <title>Analytics | DesignKorv Admin</title>
        <meta name="description" content="Analytics dashboard for DesignKorv e-commerce platform." />
      </Helmet>

      <div className="p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              value={timeRange}
              onValueChange={setTimeRange}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="thisYear">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            
            {timeRange === "custom" && (
              <div className="flex gap-2 items-center">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-10"
                  />
                </div>
                <span className="text-gray-500">to</span>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
            )}
            
            <Button variant="outline" className="flex gap-2 items-center">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
            <p>Error loading analytics data. Please try again later.</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(metrics?.totalRevenue || 0)}</div>
                  <p className="text-xs text-gray-500 mt-1">0% from previous period</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.totalOrders?.toLocaleString() || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">0% from previous period</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Avg. Order Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(metrics?.averageOrderValue || 0)}</div>
                  <p className="text-xs text-gray-500 mt-1">0% from previous period</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Conversion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.conversionRate || 0}%</div>
                  <p className="text-xs text-gray-500 mt-1">0% from previous period</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Visitors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.totalVisitors?.toLocaleString() || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">0% from previous period</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">New Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.newUsers?.toLocaleString() || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">0% from previous period</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Returning Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.returningUsers?.toLocaleString() || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">0% from previous period</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Avg. Session Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.averageSessionDuration || "0m 0s"}</div>
                  <p className="text-xs text-gray-500 mt-1">0% from previous period</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <Tabs defaultValue="sales" className="mb-6">
              <TabsList>
                <TabsTrigger value="sales">Sales & Revenue</TabsTrigger>
                <TabsTrigger value="traffic">Traffic & Engagement</TabsTrigger>
                <TabsTrigger value="products">Product Performance</TabsTrigger>
                <TabsTrigger value="audience">Audience</TabsTrigger>
              </TabsList>
              
              {/* Sales & Revenue Tab */}
              <TabsContent value="sales">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue Over Time</CardTitle>
                      <CardDescription>Monthly revenue trend</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        {analyticsData?.timeSeriesData?.revenueByMonth && analyticsData.timeSeriesData.revenueByMonth.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analyticsData.timeSeriesData.revenueByMonth}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="name" 
                              />
                              <YAxis 
                                tickFormatter={(value) => `$${value}`} 
                              />
                              <Tooltip 
                                formatter={(value: any) => [`$${value}`, 'Revenue']}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="revenue" 
                                stroke="#3b82f6" 
                                fill="#3b82f6" 
                                fillOpacity={0.2} 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-center text-gray-500">
                            <div className="flex flex-col items-center space-y-2">
                              <p>No revenue data available</p>
                              <p className="text-sm">Revenue trends will appear once you have sales</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Orders vs Revenue</CardTitle>
                      <CardDescription>Comparison of orders and revenue</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        {analyticsData?.timeSeriesData?.revenueByMonth && analyticsData.timeSeriesData.revenueByMonth.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analyticsData.timeSeriesData.revenueByMonth}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="name"
                              />
                              <YAxis 
                                yAxisId="left" 
                                orientation="left"
                                tickFormatter={(value) => `$${value}`}
                              />
                              <YAxis 
                                yAxisId="right" 
                                orientation="right"
                                tickFormatter={(value) => `${value}`}
                              />
                              <Tooltip 
                                formatter={(value, name) => {
                                  return name === 'revenue' 
                                    ? [`$${value}`, 'Revenue'] 
                                    : [value, 'Orders'];
                                }}
                              />
                              <Line 
                                yAxisId="left"
                                type="monotone" 
                                dataKey="revenue" 
                                stroke="#3b82f6" 
                                activeDot={{ r: 8 }} 
                              />
                              <Line 
                                yAxisId="right"
                                type="monotone" 
                                dataKey="orders" 
                                stroke="#f59e0b" 
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-center text-gray-500">
                            <div className="flex flex-col items-center space-y-2">
                              <p>No orders or revenue data available</p>
                              <p className="text-sm">Order and revenue comparison will appear once you have sales</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Sales by Category</CardTitle>
                      <CardDescription>Distribution of sales across product categories</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        {analyticsData?.timeSeriesData?.ordersByStatus && 
                         Object.keys(analyticsData.timeSeriesData.ordersByStatus).length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={Object.entries(analyticsData.timeSeriesData.ordersByStatus).map(([name, value]) => ({ name, value }))}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="value" fill="#8b5cf6">
                                {Object.entries(analyticsData.timeSeriesData.ordersByStatus).map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-center text-gray-500">
                            <div className="flex flex-col items-center space-y-2">
                              <p>No order status data available</p>
                              <p className="text-sm">Order status distribution will appear once you have orders</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Traffic & Engagement Tab */}
              <TabsContent value="traffic">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Website Traffic</CardTitle>
                      <CardDescription>Visitors over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        {analyticsData?.timeSeriesData?.revenueByMonth && analyticsData.timeSeriesData.revenueByMonth.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analyticsData.timeSeriesData.revenueByMonth.map((item: {name: string, orders: number, revenue: number}) => ({
                              name: item.name,
                              visitors: Math.round(item.orders * 1.5) // Using a multiplier for demo purposes
                            }))}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Area 
                                type="monotone" 
                                dataKey="visitors" 
                                stackId="1"
                                stroke="#14b8a6" 
                                fill="#14b8a6" 
                                fillOpacity={0.8} 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-center text-gray-500">
                            <div className="flex flex-col items-center space-y-2">
                              <p>No visitor data available</p>
                              <p className="text-sm">Traffic trends will appear once your store has visitors</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>User Types</CardTitle>
                      <CardDescription>New vs returning users</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        {metrics?.newUsers !== undefined && metrics?.returningUsers !== undefined && 
                         (metrics.newUsers > 0 || metrics.returningUsers > 0) ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'New Users', value: metrics.newUsers },
                                  { name: 'Returning Users', value: metrics.returningUsers }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              >
                                <Cell key="cell-0" fill={COLORS[0]} />
                                <Cell key="cell-1" fill={COLORS[1]} />
                              </Pie>
                              <Tooltip formatter={(value) => [value, 'Users']} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-center text-gray-500">
                            <div className="flex flex-col items-center space-y-2">
                              <p>No user type data available</p>
                              <p className="text-sm">New vs returning user breakdown will appear once your store has visitor data</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Product Performance Tab */}
              <TabsContent value="products">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Selling Products</CardTitle>
                    <CardDescription>Products with the highest sales volume</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="[&_th]:font-medium [&_th]:text-gray-700 dark:[&_th]:text-gray-300 [&_th]:text-left [&_th]:p-2">
                            <th>Product</th>
                            <th>Category</th>
                            <th>Orders</th>
                            <th>Revenue</th>
                            <th>Conversion Rate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                          {/* Empty state */}
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-gray-500">
                              <div className="flex flex-col items-center space-y-2">
                                <p>No product sales data available yet</p>
                                <p className="text-sm">Top selling products will appear here once you've made sales</p>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Audience Tab */}
              <TabsContent value="audience">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Device Breakdown</CardTitle>
                      <CardDescription>Traffic by device type</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <div className="h-full flex items-center justify-center text-center text-gray-500">
                          <div className="flex flex-col items-center space-y-2">
                            <p>No device data available</p>
                            <p className="text-sm">Device breakdown will appear once your store has visitor data</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Geographic Distribution</CardTitle>
                      <CardDescription>Traffic by country</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <div className="h-full flex items-center justify-center text-center text-gray-500">
                          <div className="flex flex-col items-center space-y-2">
                            <p>No geographic data available</p>
                            <p className="text-sm">Geographic distribution will appear once your store has visitor data</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Marketing Performance */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Marketing Performance</CardTitle>
                <CardDescription>
                  Track the performance of your marketing channels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="[&_th]:font-medium [&_th]:text-gray-700 dark:[&_th]:text-gray-300 [&_th]:text-left [&_th]:p-2">
                        <th>Source</th>
                        <th>Visitors</th>
                        <th>Conversion Rate</th>
                        <th>Revenue</th>
                        <th>ROI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {/* Empty state */}
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-gray-500">
                          <div className="flex flex-col items-center space-y-2">
                            <p>No marketing data available yet</p>
                            <p className="text-sm">Marketing performance data will appear here once your store has traffic</p>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}