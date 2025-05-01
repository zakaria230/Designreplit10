import { useCart } from "@/hooks/use-cart";
import { CartItem } from "../cart/cart-item";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ShoppingCart, ArrowRight, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, totalItems, totalPrice, isLoading, clearCart } = useCart();

  // Format total price to display with 2 decimal places
  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(totalPrice);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="flex flex-col w-full sm:max-w-lg">
        <SheetHeader className="px-1">
          <SheetTitle className="flex items-center text-xl">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Your Cart ({totalItems})
          </SheetTitle>
        </SheetHeader>
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : totalItems === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <ShoppingCart className="h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Your cart is empty</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Button onClick={onClose} asChild>
              <Link href="/shop">
                Start Shopping
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <CartItem key={item.productId} item={item} />
                ))}
              </div>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-800 pt-4 pb-2">
              <div className="flex justify-between text-base font-medium text-gray-900 dark:text-white mb-1">
                <span>Subtotal</span>
                <span>{formattedTotal}</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Digital downloads only. No shipping fees.
              </p>
              <SheetFooter className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  className="sm:flex-1 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                  onClick={() => clearCart()}
                >
                  Clear Cart
                </Button>
                <Button 
                  asChild 
                  className="sm:flex-1 text-white dark:text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
                >
                  <Link href="/checkout" onClick={onClose}>
                    Checkout <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </SheetFooter>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
