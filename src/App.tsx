import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { HelpProvider } from "@/contexts/HelpContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { AppLayout } from "@/components/AppLayout";
import { OnboardingWalkthrough } from "@/components/help/OnboardingWalkthrough";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import NewDeal from "./pages/NewDeal";
import Analysis from "./pages/Analysis";
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

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
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
              element={<AppLayout><Index /></AppLayout>}
            />
            <Route
              path="/dealiq/:dealId?"
              element={
                <ProtectedRoute>
                  <AppLayout><Analysis /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/contractiq"
              element={
                <ProtectedRoute>
                  <AppLayout><ContractIQ /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/contractiq/:contractId"
              element={
                <ProtectedRoute>
                  <AppLayout><ContractAnalysis /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dealiq/new"
              element={
                <ProtectedRoute>
                  <AppLayout><NewDeal /></AppLayout>
                </ProtectedRoute>
              }
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
              element={
                <ProtectedRoute>
                  <AppLayout><Reports /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <AppLayout><Account /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppLayout><Account /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AppLayout><Admin /></AppLayout>
                </AdminRoute>
              }
            />
            <Route
              path="/help"
              element={
                <ProtectedRoute>
                  <AppLayout><Help /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </HelpProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
