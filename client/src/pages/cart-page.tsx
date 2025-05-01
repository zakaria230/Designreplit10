import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { Loader2, ShoppingCart, ArrowRight, XCircle, Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function CartPage() {
  const { user } = useAuth();
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart, isLoading } = useCart();
  const [, navigate] = useLocation();

  // Format price to display with 2 decimal places
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Handle quantity adjustments
  const handleIncreaseQuantity = (productId: number, currentQuantity: number) => {
    updateQuantity(productId, currentQuantity + 1);
  };

  const handleDecreaseQuantity = (productId: number, currentQuantity: number) => {
    if (currentQuantity > 1) {
      updateQuantity(productId, currentQuantity - 1);
    }
  };

  // Handle item removal
  const handleRemoveItem = (productId: number) => {
    removeItem(productId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Empty cart state
  if (totalItems === 0) {
    return (
      <>
        <Helmet>
          <title>Your Cart | DesignKorv</title>
          <meta name="description" content="View and manage items in your shopping cart." />
        </Helmet>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-600 mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Your Cart is Empty
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Button size="lg" asChild>
              <Link href="/shop">
                Browse Products
              </Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Your Cart | DesignKorv</title>
        <meta name="description" content="View and manage items in your shopping cart." />
      </Helmet>
      <div className="bg-white dark:bg-gray-900 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Your Cart
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Cart items section */}
            <div className="lg:col-span-2">
              <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                {items.map((item) => (
                  <li key={item.productId} className="py-6 flex">
                    {/* Product image */}
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 dark:border-gray-800">
                      {item.product.imageUrl ? (
                        <img 
                          src={item.product.imageUrl} 
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-xs text-gray-400 dark:text-gray-500">No image</span>
                        </div>
                      )}
                    </div>

                    {/* Product details */}
                    <div className="ml-4 flex flex-1 flex-col">
                      <div>
                        <div className="flex justify-between text-base font-medium text-gray-900 dark:text-white">
                          <h3>
                            <Link href={`/product/${item.productId}`} className="hover:text-primary-600 dark:hover:text-primary-400">
                              {item.product.name}
                            </Link>
                          </h3>
                          <p className="ml-4">{formatPrice(item.product.price * item.quantity)}</p>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {formatPrice(item.product.price)} each
                        </p>
                      </div>
                      <div className="flex flex-1 items-end justify-between mt-4">
                        {/* Quantity controls */}
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDecreaseQuantity(item.productId, item.quantity)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          
                          <span className="px-2 w-8 text-center text-gray-900 dark:text-white">
                            {item.quantity}
                          </span>
                          
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleIncreaseQuantity(item.productId, item.quantity)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        {/* Remove button */}
                        <Button 
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 px-2"
                          onClick={() => handleRemoveItem(item.productId)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Action buttons */}
              <div className="flex justify-between items-center mt-8">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                  onClick={() => clearCart()}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Clear Cart
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                  asChild
                >
                  <Link href="/shop">
                    Continue Shopping
                  </Link>
                </Button>
              </div>
            </div>

            {/* Order summary section */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                  Order Summary
                </h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Subtotal ({totalItems} items)</span>
                    <span className="text-gray-900 dark:text-white font-medium">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Discount</span>
                    <span className="text-gray-900 dark:text-white font-medium">{formatPrice(0)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-gray-900 dark:text-white">{formatPrice(totalPrice)}</span>
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <Button className="w-full text-white dark:text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600" size="lg" asChild>
                    <Link href="/checkout">
                      Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  
                  {!user && (
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                      <p>Already have an account?</p>
                      <Button variant="link" asChild className="p-0 h-auto">
                        <Link href="/auth">
                          Sign in for a faster checkout
                        </Link>
                      </Button>
                    </div>
                  )}
                  
                  {user && (
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>Signed in as {user.username}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
