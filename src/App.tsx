import { HelmetProvider } from "react-helmet-async";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { HelpProvider } from "@/contexts/HelpContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { AppLayout } from "@/components/AppLayout";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { OnboardingWalkthrough } from "@/components/help/OnboardingWalkthrough";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import FindIQ from "./pages/FindIQ";
import NewDeal from "./pages/NewDeal";
import DealCompare from "./pages/DealCompare";
import Analysis from "./pages/Analysis";
import OfferIQ from "./pages/OfferIQ";
import PipelineIQ from "./pages/PipelineIQ";
import PortfolioIQ from "./pages/PortfolioIQ";
import ContractIQ from "./pages/ContractIQ";
import ContractAnalysis from "./pages/ContractAnalysis";
import Reports from "./pages/Reports";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const LegacyAnalysisRedirect = () => {
  const { dealId } = useParams();
  return <Navigate to={`/dealiq/${dealId ?? ""}`} replace />;
};

function ProtectedAppPage({ children, routeName }: { children: ReactNode; routeName: string }) {
  return (
    <ProtectedRoute>
      <RouteErrorBoundary routeName={routeName}>
        <AppLayout>{children}</AppLayout>
      </RouteErrorBoundary>
    </ProtectedRoute>
  );
}

function AdminAppPage({ children, routeName }: { children: ReactNode; routeName: string }) {
  return (
    <AdminRoute>
      <RouteErrorBoundary routeName={routeName}>
        <AppLayout>{children}</AppLayout>
      </RouteErrorBoundary>
    </AdminRoute>
  );
}

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <HelpProvider>
          <OnboardingWalkthrough />
          <Routes>
            {/* Public landing page */}
            <Route path="/landing" element={<Landing />} />

            {/* Public auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Root redirects to /dashboard */}
            <Route
              path="/"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route
              path="/dashboard"
              element={<ProtectedAppPage routeName="dashboard"><Index /></ProtectedAppPage>}
            />
            <Route
              path="/findiq"
              element={<ProtectedAppPage routeName="findiq"><FindIQ /></ProtectedAppPage>}
            />
            <Route
              path="/dealiq/compare"
              element={<ProtectedAppPage routeName="dealiq-compare"><DealCompare /></ProtectedAppPage>}
            />
            <Route
              path="/dealiq/new"
              element={<ProtectedAppPage routeName="dealiq-new"><NewDeal /></ProtectedAppPage>}
            />
            <Route
              path="/dealiq/:dealId?"
              element={<ProtectedAppPage routeName="dealiq"><Analysis /></ProtectedAppPage>}
            />
            <Route
              path="/offeriq"
              element={<ProtectedAppPage routeName="offeriq"><OfferIQ /></ProtectedAppPage>}
            />
            <Route
              path="/pipelineiq"
              element={<ProtectedAppPage routeName="pipelineiq"><PipelineIQ /></ProtectedAppPage>}
            />
            <Route
              path="/portfolioiq"
              element={<ProtectedAppPage routeName="portfolioiq"><PortfolioIQ /></ProtectedAppPage>}
            />
            <Route
              path="/contractiq"
              element={<ProtectedAppPage routeName="contractiq"><ContractIQ /></ProtectedAppPage>}
            />
            <Route
              path="/contractiq/:contractId"
              element={<ProtectedAppPage routeName="contract-analysis"><ContractAnalysis /></ProtectedAppPage>}
            />
            {/* Legacy redirects: /deals -> /dealiq */}
            <Route path="/deals" element={<Navigate to="/dealiq" replace />} />
            <Route path="/deals/new" element={<Navigate to="/dealiq/new" replace />} />
            {/* Legacy redirect: /analysis -> /dealiq */}
            <Route
              path="/analysis"
              element={<Navigate to="/dealiq" replace />}
            />
            <Route
              path="/analysis/:dealId"
              element={<LegacyAnalysisRedirect />}
            />
            <Route
              path="/reports"
              element={<ProtectedAppPage routeName="reports"><Reports /></ProtectedAppPage>}
            />
            <Route
              path="/account"
              element={<ProtectedAppPage routeName="account"><Account /></ProtectedAppPage>}
            />
            <Route
              path="/settings"
              element={<ProtectedAppPage routeName="settings"><Account /></ProtectedAppPage>}
            />
            <Route
              path="/admin"
              element={<AdminAppPage routeName="admin"><Admin /></AdminAppPage>}
            />
            <Route
              path="/help"
              element={<ProtectedAppPage routeName="help"><Help /></ProtectedAppPage>}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </HelpProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
