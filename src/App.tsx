import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Dashboard from "./pages/dashboard/Dashboard";
import Orders from "./pages/dashboard/Orders";
import Tracking from "./pages/dashboard/Tracking";
import DriverDashboard from "./pages/livreur/DriverDashboard";
import AvailableCourses from "./pages/livreur/AvailableCourses";
import MyDeliveries from "./pages/livreur/MyDeliveries";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDrivers from "./pages/admin/AdminDrivers";
import AdminOrders from "./pages/admin/AdminOrders";
import Services from "./pages/Services";
import Forfaits from "./pages/Forfaits";
import TrackingPage from "./pages/Tracking";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/services" element={<Services />} />
            <Route path="/forfaits" element={<Forfaits />} />
            <Route path="/tracking" element={<TrackingPage />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />

            {/* Client */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/order" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/dashboard/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/dashboard/tracking" element={<ProtectedRoute><Tracking /></ProtectedRoute>} />

            {/* Livreur */}
            <Route path="/livreur" element={<ProtectedRoute requireRole="livreur"><DriverDashboard /></ProtectedRoute>} />
            <Route path="/livreur/courses" element={<ProtectedRoute requireRole="livreur"><AvailableCourses /></ProtectedRoute>} />
            <Route path="/livreur/livraisons" element={<ProtectedRoute requireRole="livreur"><MyDeliveries /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute requireRole="admin"><AdminOverview /></ProtectedRoute>} />
            <Route path="/admin/utilisateurs" element={<ProtectedRoute requireRole="admin"><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/livreurs" element={<ProtectedRoute requireRole="admin"><AdminDrivers /></ProtectedRoute>} />
            <Route path="/admin/commandes" element={<ProtectedRoute requireRole="admin"><AdminOrders /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
