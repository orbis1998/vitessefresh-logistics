import { motion } from "framer-motion";
import { MapPin, Navigation } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Tracking = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-poppins font-bold">Suivi en direct</h1>
          <p className="text-muted-foreground">
            Suivez vos livraisons en temps réel
          </p>
        </div>

        {/* Map Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-background rounded-2xl border border-border overflow-hidden"
        >
          <div className="h-96 bg-muted/50 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-poppins font-semibold mb-2">
                Carte interactive
              </h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-4">
                La carte de suivi sera disponible lorsque vous aurez une 
                livraison en cours.
              </p>
              <Link to="/dashboard/order">
                <Button>Créer une commande</Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Active Deliveries */}
        <div className="bg-background rounded-2xl border border-border p-6">
          <h2 className="font-poppins font-semibold mb-4">
            Livraisons en cours
          </h2>
          <div className="text-center py-8">
            <Navigation className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              Aucune livraison en cours
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Tracking;
