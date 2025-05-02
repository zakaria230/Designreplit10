import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { Helmet } from "react-helmet-async";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  PayPalScriptProvider, 
  PayPalButtons,
  usePayPalScriptReducer
} from "@paypal/react-paypal-js";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, ShoppingCart } from "lucide-react";

// Checkout form schema
const checkoutFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

// PayPal checkout component
function PayPalCheckout({ 
  amount, 
  items, 
  onSuccess, 
  email 
}: { 
  amount: number, 
  items: any[], 
  onSuccess: (orderData?: {orderId?: number}) => void,
  email: string
}) {
  const { toast } = useToast();
  const [{ isPending }] = usePayPalScriptReducer();
  
  const createOrder = async () => {
    try {
      const response = await apiRequest("POST", "/api/create-paypal-order", {
        amount,
        items,
        email
      });
      
      if (!response.ok) {
        throw new Error("Failed to create PayPal order");
      }
      
      const data = await response.json();
      return data.id;
    } catch (error: any) {
      toast({
        title: "PayPal Error",
        description: error.message || "Failed to initialize PayPal payment",
        variant: "destructive"
      });
      throw error;
    }
  };
  
  const onApprove = async (data: any) => {
    try {
      const response = await apiRequest("POST", "/api/capture-paypal-order", {
        orderId: data.orderID,
        items
      });
      
      if (!response.ok) {
        throw new Error("Failed to capture PayPal payment");
      }
      
      const orderData = await response.json();
      
      toast({
        title: "Payment Successful!",
        description: "Thank you for your purchase. You can now download your assets.",
      });
      
      onSuccess(orderData);
    } catch (error: any) {
      toast({
        title: "Payment Capture Failed",
        description: error.message || "Failed to complete payment",
        variant: "destructive"
      });
    }
  };
  
  if (isPending) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <PayPalButtons
      style={{ 
        layout: "vertical",
        shape: "rect",
        color: "gold"
      }}
      createOrder={createOrder}
      onApprove={onApprove}
      onError={(err) => {
        toast({
          title: "PayPal Error",
          description: "An error occurred with PayPal. Please try again.",
          variant: "destructive"
        });
        console.error("PayPal error:", err);
      }}
    />
  );
}

export default function CheckoutPage() {
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  // Form for customer information
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      email: user?.email || "",
      name: user?.username || "",
    },
  });

  // State to track payment settings
  const [paymentSettings, setPaymentSettings] = useState({
    paypalEnabled: true,
    paypalClientId: ''
  });
  
  // Format price to display with 2 decimal places
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Fetch payment settings from the server
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const response = await fetch('/api/payment-settings');
        if (response.ok) {
          const settings = await response.json();
          setPaymentSettings({
            paypalEnabled: settings.paypalEnabled,
            paypalClientId: settings.paypalClientId
          });
        } else {
          console.error('Failed to fetch payment settings');
        }
      } catch (error) {
        console.error('Error fetching payment settings:', error);
      }
    };
    
    fetchPaymentSettings();
  }, []);

  useEffect(() => {
    // Redirect to cart if cart is empty
    if (totalItems === 0) {
      navigate("/cart");
    }
  }, [totalItems, navigate]);

  if (totalItems === 0) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <Helmet>
        <title>Checkout | DesignKorv</title>
        <meta name="description" content="Complete your purchase of digital fashion assets." />
      </Helmet>
      <div className="bg-white dark:bg-gray-900 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Checkout
          </h1>

          <div className="grid grid-cols-1 gap-8">
            {/* Order summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Order Summary
                </CardTitle>
                <CardDescription>
                  {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                  {items.map((item) => (
                    <li key={item.productId} className="py-3 flex justify-between">
                      <div className="flex items-center">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {item.product.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatPrice(item.product.price * item.quantity)}
                      </div>
                    </li>
                  ))}
                </ul>
                <Separator className="my-4" />
                <div className="flex justify-between font-bold text-gray-900 dark:text-white">
                  <span>Total</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Checkout form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Complete Your Order
                </h2>
                
                <Form {...form}>
                  <form className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter your email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-base font-medium mb-4">Payment with PayPal</h3>
                        
                        <div className="py-4">
                          <PayPalScriptProvider options={{ 
                            clientId: paymentSettings.paypalClientId || "test", 
                            currency: "USD" 
                          }}>
                            <PayPalCheckout 
                              amount={totalPrice} 
                              items={items} 
                              email={form.getValues().email}
                              onSuccess={(orderData) => {
                                clearCart();
                                // Navigate to thank you page
                                // The captured order ID will come from a response from the API (if available)
                                navigate(`/thank-you${orderData?.orderId ? `?orderId=${orderData.orderId}` : ''}`);
                              }} 
                            />
                          </PayPalScriptProvider>
                          
                          <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                            By clicking the PayPal button, you agree to the terms of service and privacy policy.
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}