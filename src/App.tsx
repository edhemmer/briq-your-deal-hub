import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense, type ReactNode } from "react";
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
const Index = lazy(() => import("./pages/Index"));
const Landing = lazy(() => import("./pages/Landing"));
const FindIQ = lazy(() => import("./pages/FindIQ"));
const NewDeal = lazy(() => import("./pages/NewDeal"));
const DealCompare = lazy(() => import("./pages/DealCompare"));
const Analysis = lazy(() => import("./pages/Analysis"));
const OfferIQ = lazy(() => import("./pages/OfferIQ"));
const PipelineIQ = lazy(() => import("./pages/PipelineIQ"));
const PortfolioIQ = lazy(() => import("./pages/PortfolioIQ"));
const ContractIQ = lazy(() => import("./pages/ContractIQ"));
const ContractAnalysis = lazy(() => import("./pages/ContractAnalysis"));
const Reports = lazy(() => import("./pages/Reports"));
const Account = lazy(() => import("./pages/Account"));
const Admin = lazy(() => import("./pages/Admin"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Help = lazy(() => import("./pages/Help"));
const Privacy = lazy(() => import("./pages/Privacy"));
const NotFound = lazy(() => import("./pages/NotFound"));

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

function RouteLoading() {
  return (
    <div className="flex min-h-[45vh] items-center justify-center bg-background px-4 text-sm font-medium text-muted-foreground">
      Loading BRIX...
    </div>
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
          <Suspense fallback={<RouteLoading />}>
          <Routes>
            {/* Public landing page */}
            <Route path="/landing" element={<Landing />} />

            {/* Public auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy" element={<Privacy />} />

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
          </Suspense>
          </HelpProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
