import { createContext, ReactNode, useContext, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Product, CartItem } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  isLoading: boolean;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | null>(null);

// Load cart from localStorage
const loadCartFromStorage = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      return JSON.parse(storedCart);
    }
  } catch (error) {
    console.error("Failed to load cart from localStorage", error);
  }
  return [];
};

// Save cart to localStorage
const saveCartToStorage = (items: CartItem[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('cart', JSON.stringify(items));
  } catch (error) {
    console.error("Failed to save cart to localStorage", error);
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Local cart (used when not logged in)
  const localCart = loadCartFromStorage();
  
  // Server cart (used when logged in)
  const {
    data: serverCart,
    isLoading: isLoadingCart,
    refetch: refetchCart,
  } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !!user, // Only fetch if user is logged in
  });
  
  // Sync mutations to handle cart updates on the server
  const syncCartMutation = useMutation({
    mutationFn: async (items: CartItem[]) => {
      await apiRequest("POST", "/api/cart", { items });
      return items;
    },
    onError: (error) => {
      toast({
        title: "Failed to update cart",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Determine current cart items based on auth state
  const items: CartItem[] = user ? (serverCart?.items || []) : localCart;
  
  // Calculate cart totals
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0
  );
  
  // Sync localStorage cart with server when user logs in
  useEffect(() => {
    if (user && localCart.length > 0) {
      syncCartMutation.mutate(localCart);
      // Clear localStorage cart after syncing
      saveCartToStorage([]);
    }
  }, [user]);
  
  // Cart operations
  const addItem = (product: Product, quantity = 1) => {
    const newItem: CartItem = {
      productId: product.id,
      quantity,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl || '',
      },
    };
    
    const existingItemIndex = items.findIndex(
      (item) => item.productId === product.id
    );
    
    let updatedItems: CartItem[];
    
    if (existingItemIndex >= 0) {
      // Update existing item
      updatedItems = [...items];
      updatedItems[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      updatedItems = [...items, newItem];
    }
    
    // Update storage based on auth state
    if (user) {
      syncCartMutation.mutate(updatedItems);
    } else {
      saveCartToStorage(updatedItems);
      queryClient.setQueryData(["/api/cart"], { items: updatedItems });
    }
    
    toast({
      title: "Added to cart",
      description: `${product.name} added to your cart`,
    });
  };
  
  const removeItem = (productId: number) => {
    const updatedItems = items.filter((item) => item.productId !== productId);
    
    // Update storage based on auth state
    if (user) {
      syncCartMutation.mutate(updatedItems);
    } else {
      saveCartToStorage(updatedItems);
      queryClient.setQueryData(["/api/cart"], { items: updatedItems });
    }
    
    toast({
      title: "Removed from cart",
      description: "Item removed from your cart",
    });
  };
  
  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    
    const updatedItems = items.map((item) =>
      item.productId === productId
        ? { ...item, quantity }
        : item
    );
    
    // Update storage based on auth state
    if (user) {
      syncCartMutation.mutate(updatedItems);
    } else {
      saveCartToStorage(updatedItems);
      queryClient.setQueryData(["/api/cart"], { items: updatedItems });
    }
  };
  
  const clearCart = () => {
    // Update storage based on auth state
    if (user) {
      syncCartMutation.mutate([]);
    } else {
      saveCartToStorage([]);
      queryClient.setQueryData(["/api/cart"], { items: [] });
    }
    
    toast({
      title: "Cart cleared",
      description: "All items have been removed from your cart",
    });
  };
  
  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isLoading: isLoadingCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
