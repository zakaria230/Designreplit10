import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Settings,
  BarChart,
  LogOut,
  Menu,
  X,
  Store,
  FolderClosed
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";

type AdminLayoutProps = {
  children: ReactNode;
  activeTab?: string;
};

const navItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: ["admin", "designer"],
  },
  {
    title: "Products",
    href: "/admin/products",
    icon: <Package className="h-5 w-5" />,
    roles: ["admin", "designer"],
  },
  {
    title: "Categories",
    href: "/admin/categories",
    icon: <FolderClosed className="h-5 w-5" />,
    roles: ["admin", "designer"],
  },
  {
    title: "Orders",
    href: "/admin/orders",
    icon: <ShoppingCart className="h-5 w-5" />,
    roles: ["admin", "designer"],
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: <Users className="h-5 w-5" />,
    roles: ["admin"],
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: <BarChart className="h-5 w-5" />,
    roles: ["admin", "designer"],
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: <Settings className="h-5 w-5" />,
    roles: ["admin"],
  },
];

export function AdminLayout({ children, activeTab }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Redirect if not admin or designer
  if (!user || (user.role !== "admin" && user.role !== "designer")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center space-y-6 max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access the admin area.
          </p>
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/">Return to Homepage</Link>
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => logoutMutation.mutate()}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    return user?.username ? user.username.slice(0, 2).toUpperCase() : "U";
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar toggle */}
      <div className="md:hidden fixed top-4 left-4 z-30">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        >
          {mobileSidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </div>

      {/* Sidebar overlay for mobile */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-20 w-64 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-y-auto transition-transform duration-300 md:relative md:translate-x-0",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center p-4 h-16">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <Store className="h-6 w-6" />
              <span>DesignKorv</span>
            </Link>
          </div>

          <Separator />

          {/* Navigation links */}
          <nav className="flex-1 p-4 space-y-2">
            <div className="mb-2">
              <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Main Menu
              </h3>
              <div className="mt-1 h-px bg-gradient-to-r from-blue-500/20 to-transparent"></div>
            </div>
            {navItems
              .filter(item => item.roles?.includes(user.role))
              .map((item) => (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-all",
                      location === item.href
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium shadow-sm border-l-4 border-blue-500"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:translate-x-1"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-center",
                      location === item.href
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                    )}>
                      {item.icon}
                    </div>
                    <span>{item.title}</span>
                    {location === item.href && (
                      <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                        Active
                      </span>
                    )}
                  </div>
                </Link>
              ))}
          </nav>

          <Separator />

          {/* User & logout */}
          <div className="p-4 space-y-4">
            <div className="mb-3">
              <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Account
              </h3>
              <div className="mt-1 h-px bg-gradient-to-r from-blue-500/20 to-transparent"></div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-blue-200 dark:border-blue-800">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white dark:from-blue-600 dark:to-blue-800 text-lg font-medium">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{user.username}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </span>
                  <span className="mt-1 text-xs px-2 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full w-fit">
                    {user.role === "admin" ? "Administrator" : "Designer"}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 justify-center bg-white dark:bg-gray-800 shadow-sm"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 justify-center bg-white dark:bg-gray-800 shadow-sm"
                  asChild
                >
                  <Link href="/">
                    <div className="flex items-center gap-2 justify-center w-full">
                      <Store className="h-4 w-4" />
                      View Store
                    </div>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 md:ml-0">
        {children}
      </main>
    </div>
  );
}