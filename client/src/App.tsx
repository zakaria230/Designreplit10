import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/hooks/use-cart";
import { SiteSettingsProvider } from "@/hooks/use-site-settings";
import { Layout } from "@/components/layout/layout";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ShopPage from "@/pages/shop-page";
import ProductPage from "@/pages/product-page";
import CartPage from "@/pages/cart-page";
import CheckoutPage from "@/pages/checkout-page";
import ThankYouPage from "@/pages/thank-you-page";
import CategoriesPage from "@/pages/categories-page";
import AboutPage from "@/pages/about-page";
import BlogPage from "@/pages/blog-page";
import CareersPage from "@/pages/careers-page";
import ContactPage from "@/pages/contact-page";
import HelpCenterPage from "@/pages/help-center-page";
import FAQPage from "@/pages/faq-page";
import TermsPage from "@/pages/terms-page";
import PrivacyPage from "@/pages/privacy-page";
import ProfilePage from "@/pages/profile/profile-page";
import OrdersPage from "@/pages/profile/orders-page";
import PurchasesPage from "@/pages/profile/purchases-page";
import DownloadsPage from "@/pages/profile/downloads-page";
import ReviewsPage from "@/pages/profile/reviews-page";
import SettingsPage from "@/pages/profile/settings-page";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminProductManagement from "@/pages/admin/product-management";
import AdminOrderManagement from "@/pages/admin/order-management";
import AdminUsers from "@/pages/admin/users";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminSettings from "@/pages/admin/settings";
import CategoryManagement from "@/pages/admin/category-management";
import ReviewManagement from "@/pages/admin/review-management";
import { ProtectedRoute } from "./lib/protected-route";
import { HelmetProvider } from "react-helmet-async";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/shop" component={ShopPage} />
        <Route path="/categories" component={CategoriesPage} />
        <Route path="/categories/:slug" component={CategoriesPage} />
        <Route path="/product/:slug" component={ProductPage} />
        <ProtectedRoute path="/cart" component={CartPage} />
        <ProtectedRoute path="/checkout" component={CheckoutPage} />
        <ProtectedRoute path="/thank-you" component={ThankYouPage} />
        
        {/* Company Pages */}
        <Route path="/about" component={AboutPage} />
        <Route path="/blog" component={BlogPage} />
        <Route path="/careers" component={CareersPage} />
        <Route path="/contact" component={ContactPage} />
        
        {/* Support Pages */}
        <Route path="/help" component={HelpCenterPage} />
        <Route path="/faq" component={FAQPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/privacy" component={PrivacyPage} />
        
        {/* Profile Routes */}
        <ProtectedRoute path="/profile" component={PurchasesPage} />
        <ProtectedRoute path="/profile/purchases" component={PurchasesPage} />
        <ProtectedRoute path="/profile/downloads" component={DownloadsPage} />
        <ProtectedRoute path="/profile/reviews" component={ReviewsPage} />
        <ProtectedRoute path="/profile/settings" component={SettingsPage} />
        
        {/* Admin Routes */}
        <ProtectedRoute 
          path="/admin" 
          component={AdminDashboard} 
          allowedRoles={["admin", "designer"]} 
        />
        <ProtectedRoute 
          path="/admin/products" 
          component={AdminProductManagement} 
          allowedRoles={["admin", "designer"]} 
        />
        <ProtectedRoute 
          path="/admin/orders" 
          component={AdminOrderManagement} 
          allowedRoles={["admin", "designer"]} 
        />
        <ProtectedRoute 
          path="/admin/users" 
          component={AdminUsers} 
          allowedRoles="admin" 
        />
        <ProtectedRoute 
          path="/admin/analytics" 
          component={AdminAnalytics} 
          allowedRoles={["admin", "designer"]} 
        />
        <ProtectedRoute 
          path="/admin/settings" 
          component={AdminSettings} 
          allowedRoles="admin" 
        />
        <ProtectedRoute 
          path="/admin/categories" 
          component={CategoryManagement} 
          allowedRoles={["admin", "designer"]} 
        />
        <ProtectedRoute 
          path="/admin/reviews" 
          component={ReviewManagement} 
          allowedRoles={["admin", "designer"]} 
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
          <SiteSettingsProvider>
            <AuthProvider>
              <CartProvider>
                <TooltipProvider>
                  <Toaster />
                  <Router />
                </TooltipProvider>
              </CartProvider>
            </AuthProvider>
          </SiteSettingsProvider>
        </ThemeProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
