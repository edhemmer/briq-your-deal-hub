import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useAdminData";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { data: isAdmin, isLoading } = useIsAdmin();

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
