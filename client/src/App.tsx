import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/hooks/use-cart";
import { Layout } from "@/components/layout/layout";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ShopPage from "@/pages/shop-page";
import ProductPage from "@/pages/product-page";
import CartPage from "@/pages/cart-page";
import CheckoutPage from "@/pages/checkout-page";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminProductManagement from "@/pages/admin/product-management";
import AdminOrderManagement from "@/pages/admin/order-management";
import { ProtectedRoute } from "./lib/protected-route";
import { HelmetProvider } from "react-helmet-async";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/shop" component={ShopPage} />
        <Route path="/product/:slug" component={ProductPage} />
        <ProtectedRoute path="/cart" component={CartPage} />
        <ProtectedRoute path="/checkout" component={CheckoutPage} />
        
        {/* Admin Routes */}
        <ProtectedRoute 
          path="/admin" 
          component={AdminDashboard} 
          adminOnly={true} 
        />
        <ProtectedRoute 
          path="/admin/products" 
          component={AdminProductManagement} 
          adminOnly={true} 
        />
        <ProtectedRoute 
          path="/admin/orders" 
          component={AdminOrderManagement} 
          adminOnly={true} 
        />
        
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
