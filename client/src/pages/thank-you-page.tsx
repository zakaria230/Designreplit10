import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
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
  CheckCircle, 
  ShoppingCart, 
  User,
  Loader2
} from "lucide-react";

export default function ThankYouPage() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get the orderId from query params
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("orderId");
  
  // Clear cart on component mount
  useEffect(() => {
    clearCart();
  }, []);

  // If no orderId is provided or user is not logged in, redirect to home
  useEffect(() => {
    if (!orderId || !user) {
      navigate("/");
    }
  }, [orderId, user, navigate]);
  
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
              Your order #{orderId} has been successfully placed and is now being processed.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="mt-8">
            <div className="bg-secondary/30 rounded-lg p-6 mb-8">
              <p className="text-center text-muted-foreground">
                We've sent a confirmation email with your order details.
                You can view your order history in your account dashboard.
              </p>
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