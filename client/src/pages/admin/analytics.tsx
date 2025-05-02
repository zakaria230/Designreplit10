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

// Sample data for demonstrations (would be replaced with API data)
const salesData = [
  { date: "2024-01-01", revenue: 1200, orders: 48 },
  { date: "2024-02-01", revenue: 1900, orders: 65 },
  { date: "2024-03-01", revenue: 1500, orders: 42 },
  { date: "2024-04-01", revenue: 2400, orders: 78 },
  { date: "2024-05-01", revenue: 2700, orders: 89 },
  { date: "2024-06-01", revenue: 3500, orders: 110 },
  { date: "2024-07-01", revenue: 3100, orders: 95 },
];

const visitorData = [
  { date: "2024-01-01", visitors: 2500, newUsers: 950, returningUsers: 1550 },
  { date: "2024-02-01", visitors: 3200, newUsers: 1200, returningUsers: 2000 },
  { date: "2024-03-01", visitors: 2800, newUsers: 1100, returningUsers: 1700 },
  { date: "2024-04-01", visitors: 3600, newUsers: 1500, returningUsers: 2100 },
  { date: "2024-05-01", visitors: 4200, newUsers: 1700, returningUsers: 2500 },
  { date: "2024-06-01", visitors: 4900, newUsers: 1900, returningUsers: 3000 },
  { date: "2024-07-01", visitors: 4500, newUsers: 1800, returningUsers: 2700 },
];

const categoryData = [
  { name: "Patterns", value: 42 },
  { name: "Textures", value: 28 },
  { name: "Technical Drawings", value: 35 },
  { name: "3D Models", value: 20 },
];

const deviceData = [
  { name: "Desktop", value: 52 },
  { name: "Mobile", value: 38 },
  { name: "Tablet", value: 10 },
];

const countryData = [
  { name: "United States", value: 38 },
  { name: "United Kingdom", value: 15 },
  { name: "Germany", value: 12 },
  { name: "France", value: 9 },
  { name: "Canada", value: 8 },
  { name: "Others", value: 18 },
];

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

  // Fetch analytics data
  const {
    data: analyticsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/admin/analytics", timeRange, dateFrom, dateTo],
    queryFn: async () => {
      // In a real app, this would fetch from the API with proper params
      // const params = new URLSearchParams();
      // params.append('timeRange', timeRange);
      // if (dateFrom) params.append('dateFrom', dateFrom);
      // if (dateTo) params.append('dateTo', dateTo);
      // const response = await apiRequest(`GET`, `/api/admin/analytics?${params.toString()}`);
      // return await response.json();
      
      // For now, return mock data
      return {
        salesSummary: {
          totalRevenue: 16300,
          totalOrders: 527,
          averageOrderValue: 31,
          conversionRate: 3.2,
        },
        trafficSummary: {
          totalVisitors: 25700,
          newUsers: 11150,
          returningUsers: 14550,
          averageSessionDuration: "2m 45s",
        },
      };
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
                  <p className="text-xs text-green-600 mt-1">+12.5% from previous period</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.totalOrders?.toLocaleString() || 0}</div>
                  <p className="text-xs text-green-600 mt-1">+8.3% from previous period</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Avg. Order Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(metrics?.averageOrderValue || 0)}</div>
                  <p className="text-xs text-green-600 mt-1">+3.7% from previous period</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Conversion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.conversionRate || 0}%</div>
                  <p className="text-xs text-red-600 mt-1">-1.2% from previous period</p>
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
                  <p className="text-xs text-green-600 mt-1">+15.2% from previous period</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">New Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.newUsers?.toLocaleString() || 0}</div>
                  <p className="text-xs text-green-600 mt-1">+10.8% from previous period</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Returning Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.returningUsers?.toLocaleString() || 0}</div>
                  <p className="text-xs text-green-600 mt-1">+7.5% from previous period</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Avg. Session Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.averageSessionDuration || "0m 0s"}</div>
                  <p className="text-xs text-green-600 mt-1">+5.3% from previous period</p>
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
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={salesData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={formatDate}
                            />
                            <YAxis 
                              tickFormatter={(value) => `$${value}`} 
                            />
                            <Tooltip 
                              formatter={(value: any) => [`$${value}`, 'Revenue']}
                              labelFormatter={(label) => formatDate(label.toString())}
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
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={salesData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={formatDate} 
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
                              labelFormatter={(label) => formatDate(label.toString())}
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
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={categoryData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8b5cf6">
                              {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
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
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={visitorData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={formatDate}
                            />
                            <YAxis />
                            <Tooltip 
                              labelFormatter={(label) => formatDate(label.toString())}
                            />
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
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={visitorData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={formatDate}
                            />
                            <YAxis />
                            <Tooltip 
                              labelFormatter={(label) => formatDate(label.toString())}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="newUsers" 
                              stackId="1"
                              stroke="#3b82f6" 
                              fill="#3b82f6" 
                              fillOpacity={0.6} 
                              name="New Users"
                            />
                            <Area 
                              type="monotone" 
                              dataKey="returningUsers" 
                              stackId="1"
                              stroke="#f59e0b" 
                              fill="#f59e0b" 
                              fillOpacity={0.6} 
                              name="Returning Users"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
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
                          <tr className="[&_td]:p-2">
                            <td className="font-medium">Basic Pattern Block</td>
                            <td>Patterns</td>
                            <td>128</td>
                            <td>{formatCurrency(3840)}</td>
                            <td>4.8%</td>
                          </tr>
                          <tr className="[&_td]:p-2">
                            <td className="font-medium">Digital Fashion Toolkit</td>
                            <td>Textures</td>
                            <td>96</td>
                            <td>{formatCurrency(2880)}</td>
                            <td>4.2%</td>
                          </tr>
                          <tr className="[&_td]:p-2">
                            <td className="font-medium">Advanced Draping Guide</td>
                            <td>Patterns</td>
                            <td>84</td>
                            <td>{formatCurrency(2520)}</td>
                            <td>3.9%</td>
                          </tr>
                          <tr className="[&_td]:p-2">
                            <td className="font-medium">Technical Drawing Templates</td>
                            <td>Technical Drawings</td>
                            <td>75</td>
                            <td>{formatCurrency(2250)}</td>
                            <td>3.6%</td>
                          </tr>
                          <tr className="[&_td]:p-2">
                            <td className="font-medium">3D Garment Base</td>
                            <td>3D Models</td>
                            <td>62</td>
                            <td>{formatCurrency(1860)}</td>
                            <td>3.2%</td>
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
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={deviceData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              fill="#8884d8"
                              paddingAngle={5}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {deviceData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                          </PieChart>
                        </ResponsiveContainer>
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
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={countryData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              fill="#8884d8"
                              paddingAngle={5}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {countryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                          </PieChart>
                        </ResponsiveContainer>
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
                      <tr className="[&_td]:p-2">
                        <td className="font-medium">Direct</td>
                        <td>5,246</td>
                        <td>4.2%</td>
                        <td>{formatCurrency(5750)}</td>
                        <td className="text-green-600">185%</td>
                      </tr>
                      <tr className="[&_td]:p-2">
                        <td className="font-medium">Organic Search</td>
                        <td>4,821</td>
                        <td>3.8%</td>
                        <td>{formatCurrency(4250)}</td>
                        <td className="text-green-600">210%</td>
                      </tr>
                      <tr className="[&_td]:p-2">
                        <td className="font-medium">Social Media</td>
                        <td>3,985</td>
                        <td>2.5%</td>
                        <td>{formatCurrency(2840)}</td>
                        <td className="text-green-600">145%</td>
                      </tr>
                      <tr className="[&_td]:p-2">
                        <td className="font-medium">Email Marketing</td>
                        <td>2,750</td>
                        <td>5.2%</td>
                        <td>{formatCurrency(3500)}</td>
                        <td className="text-green-600">225%</td>
                      </tr>
                      <tr className="[&_td]:p-2">
                        <td className="font-medium">Referral</td>
                        <td>1,845</td>
                        <td>4.1%</td>
                        <td>{formatCurrency(1950)}</td>
                        <td className="text-green-600">175%</td>
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