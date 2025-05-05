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
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
          isActive
            ? "bg-primary/10 text-primary font-medium shadow-sm border-l-4 border-primary"
            : "hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:translate-x-1"
        }`}
      >
        <div className={`${isActive ? "text-primary" : "text-gray-500"}`}>
          {icon}
        </div>
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
      href: "/profile/purchases",
      icon: <Receipt className="h-5 w-5" />,
      label: "My Purchases",
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
          <div className="sticky top-20 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 space-y-3 overflow-hidden">
            <div className="mb-5">
              <h3 className="font-semibold text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">
                ACCOUNT
              </h3>
              <div className="mt-4 h-0.5 bg-gradient-to-r from-primary/20 to-transparent rounded-full"></div>
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
            
            <div className="pt-5 mt-5 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-left transition-all text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:shadow-sm"
              >
                <div className="text-red-500">
                  <LogOut className="h-5 w-5" />
                </div>
                <span className="font-medium">Log Out</span>
              </button>
            </div>
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