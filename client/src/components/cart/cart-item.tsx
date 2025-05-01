import { useState } from "react";
import { Link } from "wouter";
import { CartItem as CartItemType } from "@shared/schema";
import { useCart } from "@/hooks/use-cart";
import { Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { removeItem, updateQuantity } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);
  
  const handleRemove = () => {
    removeItem(item.productId);
  };
  
  const handleIncrement = () => {
    setIsUpdating(true);
    updateQuantity(item.productId, item.quantity + 1);
    setTimeout(() => setIsUpdating(false), 300);
  };
  
  const handleDecrement = () => {
    if (item.quantity > 1) {
      setIsUpdating(true);
      updateQuantity(item.productId, item.quantity - 1);
      setTimeout(() => setIsUpdating(false), 300);
    }
  };
  
  // Format item price to display with 2 decimal places
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(item.product.price);
  
  // Format item total price
  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(item.product.price * item.quantity);

  return (
    <div className="flex py-4 px-1">
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 dark:border-gray-800">
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
      
      <div className="ml-4 flex flex-1 flex-col">
        <div>
          <div className="flex justify-between text-base font-medium text-gray-900 dark:text-white">
            <h3>
              <Link href={`/product/${item.productId}`} className="hover:text-primary-600 dark:hover:text-primary-400">
                {item.product.name}
              </Link>
            </h3>
            <p className="ml-4">{formattedTotal}</p>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {formattedPrice} each
          </p>
        </div>
        
        <div className="flex flex-1 items-end justify-between text-sm">
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handleDecrement}
              disabled={item.quantity <= 1 || isUpdating}
            >
              <Minus className="h-3 w-3" />
              <span className="sr-only">Decrease quantity</span>
            </Button>
            
            <span className="px-2 w-8 text-center text-gray-900 dark:text-white">
              {item.quantity}
            </span>
            
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handleIncrement}
              disabled={isUpdating}
            >
              <Plus className="h-3 w-3" />
              <span className="sr-only">Increase quantity</span>
            </Button>
          </div>
          
          <Button 
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 px-2"
            onClick={handleRemove}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Remove</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
