import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

type AllowedRoles = "admin" | "designer" | string[];

export function ProtectedRoute({
  path,
  component: Component,
  adminOnly = false,
  allowedRoles,
}: {
  path: string;
  component: () => React.JSX.Element;
  adminOnly?: boolean;
  allowedRoles?: AllowedRoles;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // For backwards compatibility
  if (adminOnly && user.role !== "admin") {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  // Check against allowed roles if specified
  if (allowedRoles) {
    const allowedRolesArray = Array.isArray(allowedRoles) 
      ? allowedRoles 
      : [allowedRoles];
    
    if (!allowedRolesArray.includes(user.role)) {
      return (
        <Route path={path}>
          <Redirect to="/" />
        </Route>
      );
    }
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}
