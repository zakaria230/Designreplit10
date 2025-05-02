import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { Helmet } from "react-helmet-async";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
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

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.warn('Missing VITE_STRIPE_PUBLIC_KEY. Stripe payments will not work correctly.');
}

// Safe Stripe initialization for production environments
let stripePromise: Promise<any> | null = null;
try {
  if (import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
  }
} catch (error) {
  console.error('Failed to initialize Stripe:', error);
  stripePromise = null;
}

// Checkout form schema
const checkoutFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();

  // Initialize form with user data if available
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      email: user?.email || "",
      name: user?.username || "",
    },
  });

  const onSubmit = async (values: CheckoutFormValues) => {
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/orders",
          receipt_email: values.email,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "An error occurred with your payment",
          variant: "destructive",
        });
      } else {
        // If we get here, the payment was successful
        toast({
          title: "Order Successful!",
          description: "Thank you for your purchase. You can now download your assets.",
        });
        clearCart();
        navigate("/orders");
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Format price to display with 2 decimal places
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>
              Enter your card information to complete the purchase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentElement />
            <div className="mt-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Supported payment methods:</p>
              <div className="flex items-center space-x-3">
                <div className="bg-white rounded p-1 shadow-sm">
                  <img src="https://cdn.jsdelivr.net/gh/michelml/payment-icons@1.0.0/visa.svg" alt="Visa" className="h-6 w-10" />
                </div>
                <div className="bg-white rounded p-1 shadow-sm">
                  <img src="https://cdn.jsdelivr.net/gh/michelml/payment-icons@1.0.0/mastercard.svg" alt="Mastercard" className="h-6 w-10" />
                </div>
                <div className="bg-white rounded p-1 shadow-sm">
                  <img src="https://cdn.jsdelivr.net/gh/michelml/payment-icons@1.0.0/american-express.svg" alt="American Express" className="h-6 w-10" />
                </div>
                <div className="bg-white rounded p-1 shadow-sm">
                  <img src="https://cdn.jsdelivr.net/gh/michelml/payment-icons@1.0.0/paypal.svg" alt="PayPal" className="h-6 w-10" />
                </div>
                <div className="bg-white rounded p-1 shadow-sm">
                  <img src="https://cdn.jsdelivr.net/gh/michelml/payment-icons@1.0.0/apple-pay.svg" alt="Apple Pay" className="h-6 w-10" />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm font-medium">
              <span className="text-gray-500 dark:text-gray-400">Total: </span>
              <span className="text-gray-900 dark:text-white">{formatPrice(totalPrice)}</span>
            </div>
            <Button
              type="submit"
              disabled={!stripe || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Complete Purchase"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

export default function CheckoutPage() {
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("visa");
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Flag to check if Stripe is properly configured
  const isStripeConfigured = import.meta.env.VITE_STRIPE_PUBLIC_KEY && stripePromise;

  // Format price to display with 2 decimal places
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Handle simulated checkout when Stripe is not configured
  const handleSimulatedCheckout = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to complete your order",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    try {
      // Get payment method name for notes
      const paymentMethodName = selectedPaymentMethod.charAt(0).toUpperCase() + selectedPaymentMethod.slice(1);
      
      // Create a mock order
      const response = await apiRequest("POST", "/api/create-order", {
        items: items,
        totalAmount: totalPrice,
        paymentStatus: "paid", // Simulate payment
        paymentMethod: selectedPaymentMethod,
        notes: `Payment processed via ${paymentMethodName}`
      });
      
      if (response.ok) {
        toast({
          title: "Order Successful!",
          description: `Your order has been placed successfully and paid with ${paymentMethodName}.`,
        });
        clearCart();
        navigate("/orders");
      } else {
        throw new Error("Failed to create order");
      }
    } catch (error: any) {
      toast({
        title: "Checkout Failed",
        description: error.message || "An error occurred during checkout",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Redirect to cart if cart is empty
    if (totalItems === 0) {
      navigate("/cart");
      return;
    }

    // If Stripe is configured, create PaymentIntent as soon as the page loads
    if (isStripeConfigured) {
      const createPaymentIntent = async () => {
        try {
          setIsLoading(true);
          
          const response = await apiRequest("POST", "/api/create-payment-intent", { 
            amount: totalPrice,
            items: items
          });
          
          if (!response.ok) {
            // Handle specific error cases from the API
            const errorData = await response.json();
            if (errorData.errorCode === "STRIPE_NOT_CONFIGURED") {
              // If Stripe isn't available on the server, switch to simulated checkout
              toast({
                title: "Stripe Payment Unavailable",
                description: "Using simulated checkout instead. This is common in test environments.",
                variant: "warning"
              });
              setIsLoading(false);
              return;
            } else {
              throw new Error(errorData.message || "Failed to initialize payment");
            }
          }
          
          const data = await response.json();
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
          } else {
            throw new Error("Invalid payment session response");
          }
        } catch (error: any) {
          toast({
            title: "Payment Setup Error",
            description: "Failed to initialize payment. Please try a different method or try again later.",
            variant: "destructive",
          });
          console.error("Error creating payment intent:", error);
        } finally {
          setIsLoading(false);
        }
      };

      createPaymentIntent();
    } else {
      // If Stripe is not configured, don't show loading
      setIsLoading(false);
    }
  }, [items, totalItems, totalPrice, navigate, toast, isStripeConfigured]);

  if (totalItems === 0) {
    return null; // Will redirect in useEffect
  }

  if (isLoading && isStripeConfigured) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
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
                
                {isStripeConfigured && clientSecret ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm />
                  </Elements>
                ) : (
                  <div className="text-center py-8">
                    {isStripeConfigured ? (
                      <>
                        <p className="text-red-500 dark:text-red-400 mb-4">
                          Error initializing payment system. Please try again.
                        </p>
                        <Button onClick={() => navigate("/cart")}>
                          Return to Cart
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-amber-500 dark:text-amber-400 mb-4">
                          Development mode: Stripe payment is not configured.
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                          You can use simulated checkout to test the ordering process.
                        </p>
                        {(() => {
                          // Create a form instance for simulated checkout
                          const simulatedForm = useForm<CheckoutFormValues>({
                            resolver: zodResolver(checkoutFormSchema),
                            defaultValues: {
                              email: user?.email || "",
                              name: user?.username || "",
                            },
                          });
                          
                          return (
                            <Form {...simulatedForm}>
                              <form onSubmit={simulatedForm.handleSubmit(handleSimulatedCheckout)} className="space-y-6">
                                <div className="space-y-4">
                                  <FormField
                                    control={simulatedForm.control}
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
                                    control={simulatedForm.control}
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
                                    <p className="text-sm font-medium mb-3">Payment Method</p>
                                    <div className="grid grid-cols-3 gap-3">
                                      <div 
                                        className={`border rounded-lg p-3 flex items-center justify-center cursor-pointer bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedPaymentMethod === 'visa' ? 'border-primary ring-1 ring-primary' : 'border-gray-200 dark:border-gray-700'}`}
                                        onClick={() => setSelectedPaymentMethod('visa')}
                                      >
                                        <img src="https://cdn.jsdelivr.net/gh/michelml/payment-icons@1.0.0/visa.svg" alt="Visa" className="h-6" />
                                      </div>
                                      <div 
                                        className={`border rounded-lg p-3 flex items-center justify-center cursor-pointer bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedPaymentMethod === 'mastercard' ? 'border-primary ring-1 ring-primary' : 'border-gray-200 dark:border-gray-700'}`}
                                        onClick={() => setSelectedPaymentMethod('mastercard')}
                                      >
                                        <img src="https://cdn.jsdelivr.net/gh/michelml/payment-icons@1.0.0/mastercard.svg" alt="Mastercard" className="h-6" />
                                      </div>
                                      <div 
                                        className={`border rounded-lg p-3 flex items-center justify-center cursor-pointer bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedPaymentMethod === 'paypal' ? 'border-primary ring-1 ring-primary' : 'border-gray-200 dark:border-gray-700'}`}
                                        onClick={() => setSelectedPaymentMethod('paypal')}
                                      >
                                        <img src="https://cdn.jsdelivr.net/gh/michelml/payment-icons@1.0.0/paypal.svg" alt="PayPal" className="h-6" />
                                      </div>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                      Selected: {selectedPaymentMethod.charAt(0).toUpperCase() + selectedPaymentMethod.slice(1)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex justify-between pt-4">
                                  <Button variant="outline" onClick={() => navigate("/cart")}>
                                    Return to Cart
                                  </Button>
                                  <Button type="submit">
                                    Complete Simulated Purchase
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          );
                        })()}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
