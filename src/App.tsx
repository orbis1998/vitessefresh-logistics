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
import Callback from "./pages/auth/Callback";
import Dashboard from "./pages/dashboard/Dashboard";
import Orders from "./pages/dashboard/Orders";
import OrdersList from "./pages/dashboard/OrdersList";
import Tracking from "./pages/dashboard/Tracking";
import DriverDashboard from "./pages/livreur/DriverDashboard";
import AvailableCourses from "./pages/livreur/AvailableCourses";
import MyDeliveries from "./pages/livreur/MyDeliveries";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDrivers from "./pages/admin/AdminDrivers";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminLiveMap from "./pages/admin/AdminLiveMap";
import AdminTracking from "./pages/admin/AdminTracking";
import AdminOrgs from "./pages/admin/AdminOrgs";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminFinance from "./pages/admin/AdminFinance";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminTeam from "./pages/admin/AdminTeam";
import AdminWhatsApp from "./pages/admin/AdminWhatsApp";
import AdminSettings from "./pages/admin/AdminSettings";
import EntrepriseDashboard from "./pages/entreprise/EntrepriseDashboard";
import EntrepriseCourses from "./pages/entreprise/EntrepriseCourses";
import EntrepriseTeam from "./pages/entreprise/EntrepriseTeam";
import EntreprisePlan from "./pages/entreprise/EntreprisePlan";
import ClientSupport from "./pages/dashboard/Support";
import Services from "./pages/Services";
import Forfaits from "./pages/Forfaits";
import TrackingPage from "./pages/Tracking";
import Contact from "./pages/Contact";
import Privacy from "./pages/legal/Privacy";
import Terms from "./pages/legal/Terms";
import Mentions from "./pages/legal/Mentions";
import Cookies from "./pages/legal/Cookies";
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
            <Route path="/confidentialite" element={<Privacy />} />
            <Route path="/cgu" element={<Terms />} />
            <Route path="/mentions-legales" element={<Mentions />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/callback" element={<Callback />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />

            {/* Client */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/order" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/dashboard/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/dashboard/orders-list" element={<ProtectedRoute><OrdersList /></ProtectedRoute>} />
            <Route path="/dashboard/tracking" element={<ProtectedRoute><Tracking /></ProtectedRoute>} />
            <Route path="/dashboard/support" element={<ProtectedRoute><ClientSupport /></ProtectedRoute>} />

            {/* Livreur */}
            <Route path="/livreur" element={<ProtectedRoute requireRole="livreur"><DriverDashboard /></ProtectedRoute>} />
            <Route path="/livreur/courses" element={<ProtectedRoute requireRole="livreur"><AvailableCourses /></ProtectedRoute>} />
            <Route path="/livreur/livraisons" element={<ProtectedRoute requireRole="livreur"><MyDeliveries /></ProtectedRoute>} />

            {/* Entreprise */}
            <Route path="/entreprise" element={<ProtectedRoute requireRole="entreprise"><EntrepriseDashboard /></ProtectedRoute>} />
            <Route path="/entreprise/courses" element={<ProtectedRoute requireRole="entreprise"><EntrepriseCourses /></ProtectedRoute>} />
            <Route path="/entreprise/equipe" element={<ProtectedRoute requireRole="entreprise"><EntrepriseTeam /></ProtectedRoute>} />
            <Route path="/entreprise/forfait" element={<ProtectedRoute requireRole="entreprise"><EntreprisePlan /></ProtectedRoute>} />

            {/* Ops */}
            <Route path="/admin" element={<ProtectedRoute requireStaff><AdminOverview /></ProtectedRoute>} />
            <Route path="/admin/carte" element={<ProtectedRoute requireStaff><AdminLiveMap /></ProtectedRoute>} />
            <Route path="/admin/commandes" element={<ProtectedRoute requireStaff><AdminOrders /></ProtectedRoute>} />
            <Route path="/admin/suivi" element={<ProtectedRoute requireStaff><AdminTracking /></ProtectedRoute>} />
            <Route path="/admin/livreurs" element={<ProtectedRoute requireStaff><AdminDrivers /></ProtectedRoute>} />
            <Route path="/admin/utilisateurs" element={<ProtectedRoute requireStaff><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/entreprises" element={<ProtectedRoute requireStaff><AdminOrgs /></ProtectedRoute>} />
            <Route path="/admin/abonnements" element={<ProtectedRoute requireStaff><AdminSubscriptions /></ProtectedRoute>} />
            <Route path="/admin/finance" element={<ProtectedRoute requireStaff><AdminFinance /></ProtectedRoute>} />
            <Route path="/admin/support" element={<ProtectedRoute requireStaff><AdminSupport /></ProtectedRoute>} />
            <Route path="/admin/equipe" element={<ProtectedRoute requireRole="admin"><AdminTeam /></ProtectedRoute>} />
            <Route path="/admin/whatsapp" element={<ProtectedRoute requireRole="admin"><AdminWhatsApp /></ProtectedRoute>} />
            <Route path="/admin/parametres" element={<ProtectedRoute requireStaff><AdminSettings /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
