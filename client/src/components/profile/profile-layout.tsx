import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { 
  User, 
  ShoppingBag, 
  Download, 
  Settings, 
  ChevronRight,
  Receipt,
  LogOut
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProfileLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

interface SidebarLinkProps {
  href: string;
  icon: ReactNode;
  label: string;
  isActive: boolean;
}

function SidebarLink({ href, icon, label, isActive }: SidebarLinkProps) {
  return (
    <Link href={href}>
      <a
        className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
          isActive
            ? "bg-primary text-primary-foreground"
            : "hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
      >
        {icon}
        <span>{label}</span>
      </a>
    </Link>
  );
}

export function ProfileLayout({ children, title, description }: ProfileLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const isMobile = useIsMobile();
  
  const navLinks = [
    {
      href: "/profile",
      icon: <User className="h-5 w-5" />,
      label: "Overview",
    },
    {
      href: "/profile/orders",
      icon: <ShoppingBag className="h-5 w-5" />,
      label: "Orders",
    },
    {
      href: "/profile/purchases",
      icon: <Receipt className="h-5 w-5" />,
      label: "Purchases",
    },
    {
      href: "/profile/downloads",
      icon: <Download className="h-5 w-5" />,
      label: "Downloads",
    },
    {
      href: "/profile/settings",
      icon: <Settings className="h-5 w-5" />,
      label: "Settings",
    },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-20 space-y-1">
            <div className="mb-6">
              <h3 className="font-medium text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">
                Account
              </h3>
            </div>
            
            {navLinks.map((link) => (
              <SidebarLink
                key={link.href}
                href={link.href}
                icon={link.icon}
                label={link.label}
                isActive={location === link.href}
              />
            ))}
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-3 py-2 rounded-md transition-colors w-full text-left hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-500 mt-8"
            >
              <LogOut className="h-5 w-5" />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile Navigation */}
        {isMobile && (
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">{title}</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Menu
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {navLinks.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link href={link.href}>
                      <a className="flex items-center cursor-pointer">
                        {link.icon}
                        <span className="ml-2">{link.label}</span>
                      </a>
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem
                  className="text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-950"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1">
          {!isMobile && (
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">{title}</h1>
              {description && (
                <p className="text-gray-500 dark:text-gray-400">{description}</p>
              )}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}