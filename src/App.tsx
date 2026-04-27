import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { HelpProvider } from "@/contexts/HelpContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { AppLayout } from "@/components/AppLayout";
import { OnboardingWalkthrough } from "@/components/help/OnboardingWalkthrough";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Deals from "./pages/Deals";
import NewDeal from "./pages/NewDeal";
import Analysis from "./pages/Analysis";
import ContractIQ from "./pages/ContractIQ";
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

const App = () => (
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
              element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout><Index /></AppLayout>
                </ProtectedRoute>
              }
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
              path="/deals"
              element={
                <ProtectedRoute>
                  <AppLayout><Deals /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/deals/new"
              element={
                <ProtectedRoute>
                  <AppLayout><NewDeal /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analysis/:dealId?"
              element={
                <ProtectedRoute>
                  <AppLayout><Analysis /></AppLayout>
                </ProtectedRoute>
              }
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
);

export default App;
