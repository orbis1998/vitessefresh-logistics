import { motion } from "framer-motion";
import { Package, Clock, CheckCircle, Truck } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Orders = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-poppins font-bold">Mes commandes</h1>
            <p className="text-muted-foreground">
              Historique de vos livraisons
            </p>
          </div>
        </div>

        {/* Empty State */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-background rounded-2xl border border-border p-12 text-center"
        >
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-poppins font-semibold mb-2">
            Aucune commande
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Vous n'avez pas encore passé de commande. Créez votre première 
            livraison pour la voir apparaître ici.
          </p>
          <Link to="/dashboard/order">
            <Button size="lg">Créer une commande</Button>
          </Link>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Orders;
