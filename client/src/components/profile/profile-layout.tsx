import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout/layout";
import { 
  User, 
  Settings, 
  ShoppingBag, 
  Download, 
  CreditCard, 
  LogOut,
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProfileLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function ProfileLayout({ children, title, description }: ProfileLayoutProps) {
  const { user, isLoading, logoutMutation } = useAuth();
  const [location] = useLocation();

  const navigationItems = [
    {
      name: "Profile Overview",
      href: "/profile",
      icon: <User className="mr-2 h-4 w-4" />,
    },
    {
      name: "My Orders",
      href: "/profile/orders",
      icon: <ShoppingBag className="mr-2 h-4 w-4" />,
    },
    {
      name: "My Purchases",
      href: "/profile/purchases",
      icon: <CreditCard className="mr-2 h-4 w-4" />,
    },
    {
      name: "My Downloads",
      href: "/profile/downloads",
      icon: <Download className="mr-2 h-4 w-4" />,
    },
    {
      name: "Settings",
      href: "/profile/settings",
      icon: <Settings className="mr-2 h-4 w-4" />,
    },
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-center">
            You need to be signed in to access your profile.
          </p>
          <Link href="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>{title} | DesignKorv</title>
        <meta name="description" content={description || `Manage your ${title.toLowerCase()} and account settings.`} />
      </Helmet>
      <div className="container py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Account</CardTitle>
                <CardDescription>
                  {user.username}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="flex flex-col">
                  {navigationItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <a
                        className={`flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 ${
                          location === item.href
                            ? "bg-gray-100 dark:bg-gray-800 text-primary font-medium"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {item.icon}
                        {item.name}
                      </a>
                    </Link>
                  ))}
                  <button
                    onClick={() => logoutMutation.mutate()}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left border-t border-gray-200 dark:border-gray-700 mt-2"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </button>
                </nav>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content */}
          <div className="flex-1">
            <Card>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
              </CardHeader>
              <CardContent>
                {children}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}