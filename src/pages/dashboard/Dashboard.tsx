import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Plus, Package, Clock, MapPin, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const stats = [
  {
    icon: Package,
    label: "Commandes ce mois",
    value: "0",
    change: "",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Clock,
    label: "En cours",
    value: "0",
    change: "",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: MapPin,
    label: "Livrées",
    value: "0",
    change: "",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: TrendingUp,
    label: "Économies forfait",
    value: "0 FC",
    change: "",
    color: "bg-purple-100 text-purple-600",
  },
];

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Quick Actions Mobile */}
        <div className="lg:hidden">
          <Link to="/dashboard/order">
            <Button size="lg" className="w-full">
              <Plus className="w-5 h-5 mr-2" />
              Nouvelle commande
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-background rounded-2xl p-6 border border-border"
            >
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-background rounded-2xl border border-border p-12 text-center"
        >
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-poppins font-semibold mb-2">
            Aucune commande pour le moment
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Commencez à utiliser VitesseFresh en créant votre première commande 
            de livraison. C'est simple et rapide !
          </p>
          <Link to="/dashboard/order">
            <Button size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Créer ma première commande
            </Button>
          </Link>
        </motion.div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/dashboard/plans" className="group">
            <div className="bg-background rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all">
              <h3 className="font-poppins font-semibold mb-2">
                Découvrir les forfaits
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Économisez jusqu'à 15% avec nos packs de courses
              </p>
              <span className="text-primary font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                En savoir plus
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
          <Link to="/dashboard/tracking" className="group">
            <div className="bg-background rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all">
              <h3 className="font-poppins font-semibold mb-2">
                Suivi en temps réel
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Suivez vos livreurs sur la carte en direct
              </p>
              <span className="text-primary font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                Voir la carte
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
          <Link to="/dashboard/profile" className="group">
            <div className="bg-background rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all">
              <h3 className="font-poppins font-semibold mb-2">
                Compléter mon profil
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ajoutez vos adresses favorites pour commander plus vite
              </p>
              <span className="text-primary font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                Mon profil
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
