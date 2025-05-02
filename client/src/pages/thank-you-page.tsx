import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  CheckCircle, 
  Download, 
  Package, 
  ShoppingCart, 
  User,
  Loader2
} from "lucide-react";

interface OrderItem {
  id: number;
  productId: number;
  orderId: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    name: string;
    description: string;
    price: number;
    downloadUrl?: string;
    image?: string;
  };
}

interface Order {
  id: number;
  userId: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export default function ThankYouPage() {
  const [, navigate] = useLocation();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { clearCart } = useCart();
  
  // Get the orderId from query params
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("orderId");
  
  useEffect(() => {
    // Clear the cart when thank you page is loaded
    clearCart();
    
    // If no orderId is provided or user is not logged in, redirect to home
    if (!orderId || !user) {
      navigate("/");
      return;
    }
    
    const fetchOrderDetails = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest("GET", `/api/orders/${orderId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch order details");
        }
        
        const data = await response.json();
        setOrder(data);
      } catch (error) {
        console.error("Error fetching order details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId, user, navigate, clearCart]);
  
  // Format price to display with 2 decimal places
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Order Not Found</CardTitle>
            <CardDescription>We couldn't find the order you're looking for.</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link to="/">Return to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Thank You for Your Order | DesignKorv</title>
      </Helmet>
      
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <Card className="border-primary/20">
          <CardHeader className="text-center pb-0">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Thank You for Your Purchase!</CardTitle>
            <CardDescription>
              Your order #{order.id} has been successfully placed and is now being processed.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="mt-8">
            <div className="bg-secondary/30 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Order Summary
              </h3>
              
              <div className="grid gap-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Date:</span>
                  <span className="font-medium">
                    {format(new Date(order.createdAt), "MMMM d, yyyy")}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Status:</span>
                  <Badge variant={
                    order.status === "delivered" ? "default" :
                    order.status === "cancelled" ? "destructive" :
                    "default"
                  }>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Status:</span>
                  <Badge variant={
                    order.paymentStatus === "paid" ? "default" :
                    order.paymentStatus === "refunded" ? "destructive" :
                    "default"
                  }>
                    {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="font-medium">
                    {order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-bold">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold mb-4">Your Purchased Items</h3>
            
            <div className="space-y-4">
              {order.items.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    {item.product.image && (
                      <div className="w-full sm:w-1/4 bg-secondary/20">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="p-4 flex-1">
                      <h4 className="font-semibold text-lg">{item.product.name}</h4>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {item.product.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span>{formatPrice(item.price)}</span>
                        
                        {item.product.downloadUrl && (
                          <Button size="sm" variant="outline" className="gap-1">
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
          
          <Separator className="my-2" />
          
          <CardFooter className="pt-6 flex flex-col sm:flex-row gap-4">
            <Button asChild className="flex-1" variant="outline">
              <Link to="/orders">
                View All Orders
                <User className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            
            <Button asChild className="flex-1">
              <Link to="/shop">
                Continue Shopping
                <ShoppingCart className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}