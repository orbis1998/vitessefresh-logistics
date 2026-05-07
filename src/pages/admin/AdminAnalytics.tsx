import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Package, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  MapPin,
  Truck,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatsCard from "@/components/ui/stats-card";
import ProgressIndicator from "@/components/ui/progress-indicator";

interface AnalyticsData {
  totalOrders: number;
  activeDrivers: number;
  totalUsers: number;
  revenue: number;
  orderGrowth: number;
  userGrowth: number;
  driverGrowth: number;
  revenueGrowth: number;
  ordersByStatus: {
    pending: number;
    confirmed: number;
    in_delivery: number;
    delivered: number;
    cancelled: number;
  };
  ordersByCommune: Record<string, number>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  topDrivers: Array<{
    name: string;
    deliveries: number;
    rating: number;
    revenue: number;
  }>;
  deliveryTimes: {
    average: number;
    fastest: number;
    slowest: number;
  };
}

const AdminAnalytics = () => {
  const [timeRange, setTimeRange] = useState("7d");
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  // Mock analytics data
  const mockAnalyticsData: AnalyticsData = {
    totalOrders: 1247,
    activeDrivers: 89,
    totalUsers: 3421,
    revenue: 8750000,
    orderGrowth: 12.5,
    userGrowth: 8.3,
    driverGrowth: 15.7,
    revenueGrowth: 18.2,
    ordersByStatus: {
      pending: 45,
      confirmed: 127,
      in_delivery: 89,
      delivered: 934,
      cancelled: 52
    },
    ordersByCommune: {
      "Gombe": 234,
      "Limete": 189,
      "Masina": 156,
      "Kalamu": 134,
      "Matete": 123,
      "Mont-Ngafula": 98,
      "Ngiri-Ngiri": 87,
      "Kintambo": 76,
      "Ngaliema": 65,
      "Lemba": 54,
      "Bumbu": 43
    },
    revenueByMonth: [
      { month: "Jan", revenue: 1250000, orders: 180 },
      { month: "Fév", revenue: 1380000, orders: 198 },
      { month: "Mar", revenue: 1420000, orders: 205 },
      { month: "Avr", revenue: 1560000, orders: 225 },
      { month: "Mai", revenue: 1680000, orders: 242 },
      { month: "Juin", revenue: 1450000, orders: 209 }
    ],
    topDrivers: [
      { name: "Jean Mukendi", deliveries: 127, rating: 4.9, revenue: 381000 },
      { name: "Pierre N'Tumba", deliveries: 118, rating: 4.8, revenue: 354000 },
      { name: "Marie Kabongo", deliveries: 109, rating: 4.9, revenue: 327000 },
      { name: "Thomas Mbuyi", deliveries: 98, rating: 4.7, revenue: 294000 },
      { name: "Sophie Kanza", deliveries: 87, rating: 4.8, revenue: 261000 }
    ],
    deliveryTimes: {
      average: 42,
      fastest: 18,
      slowest: 78
    }
  };

  useEffect(() => {
    // Simulate loading analytics data
    setTimeout(() => {
      setAnalyticsData(mockAnalyticsData);
      setIsLoading(false);
    }, 1500);
  }, [timeRange]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analyticsData) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-poppins font-bold">
              Tableau de Bord <span className="text-primary">Analytique</span>
            </h1>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Dernières 24h</SelectItem>
                <SelectItem value="7d">Derniers 7 jours</SelectItem>
                <SelectItem value="30d">Derniers 30 jours</SelectItem>
                <SelectItem value="90d">Derniers 90 jours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Commandes totales"
              value={analyticsData.totalOrders.toLocaleString()}
              change={{ value: analyticsData.orderGrowth, type: "increase", period: "vs période précédente" }}
              icon={Package}
            />
            <StatsCard
              title="Utilisateurs actifs"
              value={analyticsData.totalUsers.toLocaleString()}
              change={{ value: analyticsData.userGrowth, type: "increase", period: "vs période précédente" }}
              icon={Users}
            />
            <StatsCard
              title="Livreurs en ligne"
              value={analyticsData.activeDrivers}
              change={{ value: analyticsData.driverGrowth, type: "increase", period: "vs période précédente" }}
              icon={Truck}
            />
            <StatsCard
              title="Revenus générés"
              value={`${(analyticsData.revenue / 1000000).toFixed(1)}M FC`}
              change={{ value: analyticsData.revenueGrowth, type: "increase", period: "vs période précédente" }}
              icon={DollarSign}
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Orders by Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-background rounded-2xl border border-border p-6"
            >
              <h3 className="text-xl font-poppins font-semibold mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Commandes par statut
              </h3>
              <div className="space-y-4">
                {Object.entries(analyticsData.ordersByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-muted-foreground capitalize">
                      {status === "pending" && "En attente"}
                      {status === "confirmed" && "Confirmées"}
                      {status === "in_delivery" && "En livraison"}
                      {status === "delivered" && "Livrées"}
                      {status === "cancelled" && "Annulées"}
                    </span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Orders by Commune */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-background rounded-2xl border border-border p-6"
            >
              <h3 className="text-xl font-poppins font-semibold mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Commandes par commune
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {Object.entries(analyticsData.ordersByCommune)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 10)
                  .map(([commune, count]) => (
                    <div key={commune} className="flex items-center justify-between">
                      <span className="text-muted-foreground">{commune}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${(count / 234) * 100}%` }}
                          />
                        </div>
                        <span className="font-medium text-sm w-12 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>

            {/* Delivery Performance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-background rounded-2xl border border-border p-6"
            >
              <h3 className="text-xl font-poppins font-semibold mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Performance de livraison
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground">Temps moyen</span>
                    <span className="font-semibold">{analyticsData.deliveryTimes.average} min</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: "65%" }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground">Plus rapide</span>
                    <span className="font-semibold text-green-600">{analyticsData.deliveryTimes.fastest} min</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: "30%" }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground">Plus lent</span>
                    <span className="font-semibold text-red-600">{analyticsData.deliveryTimes.slowest} min</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: "90%" }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Top Drivers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 bg-background rounded-2xl border border-border p-6"
          >
            <h3 className="text-xl font-poppins font-semibold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Meilleurs livreurs
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4">Livreurs</th>
                    <th className="text-center py-3 px-4">Livraisons</th>
                    <th className="text-center py-3 px-4">Note</th>
                    <th className="text-right py-3 px-4">Revenus</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.topDrivers.map((driver, index) => (
                    <tr key={index} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 font-medium">{driver.name}</td>
                      <td className="text-center py-3 px-4">{driver.deliveries}</td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(driver.rating)
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              >
                                ★
                              </div>
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground ml-1">{driver.rating}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 font-medium">
                        {(driver.revenue / 1000).toFixed(0)}K FC
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 bg-background rounded-2xl border border-border p-6"
          >
            <h3 className="text-xl font-poppins font-semibold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Évolution des revenus
            </h3>
            <div className="h-64 flex items-end justify-between gap-4">
              {analyticsData.revenueByMonth.map((data, index) => (
                <div key={data.month} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-primary/20 rounded-t relative">
                    <div 
                      className="w-full bg-primary rounded-t transition-all duration-500"
                      style={{ 
                        height: `${(data.revenue / 1680000) * 200}px`,
                        animationDelay: `${index * 100}ms`
                      }}
                    />
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-background px-2 py-1 rounded text-xs font-medium opacity-0 hover:opacity-100 transition-opacity">
                      {(data.revenue / 1000000).toFixed(1)}M FC
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground mt-2">{data.month}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
