import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Search, MapPin, Clock, Package, CheckCircle, Truck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import MapView from "@/components/MapView";

const Tracking = () => {
  const [trackingCode, setTrackingCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [orderData, setOrderData] = useState(null);

  const mockOrderData = {
    id: "VIT-2024-001234",
    status: "en_livraison",
    estimatedDelivery: "15:30",
    currentLocation: "Avenue des Huileries, Gombe",
    driver: {
      name: "Jean Mukendi",
      phone: "+243 81 234 5678",
      photo: "/api/placeholder/60/60",
      rating: 4.8
    },
    timeline: [
      {
        time: "14:15",
        status: "commande_confirmée",
        title: "Commande confirmée",
        description: "Votre commande a été confirmée et assignée à un livreur"
      },
      {
        time: "14:20",
        status: "ramassage",
        title: "Livreur en route pour ramassage",
        description: "Le livreur est en route pour récupérer votre colis"
      },
      {
        time: "14:35",
        status: "colis_ramassé",
        title: "Colis ramassé",
        description: "Votre colis a été ramassé avec succès"
      },
      {
        time: "14:40",
        status: "en_livraison",
        title: "En cours de livraison",
        description: "Votre colis est en cours de livraison"
      }
    ],
    addresses: {
      pickup: "Gombe, Avenue du Commerce N°45",
      delivery: "Limete, Résidentiel Bloc A N°12"
    }
  };

  const handleSearch = () => {
    if (!trackingCode.trim()) return;
    
    setIsSearching(true);
    // Simuler une recherche API
    setTimeout(() => {
      setOrderData(mockOrderData);
      setIsSearching(false);
    }, 1500);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "commande_confirmée":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "ramassage":
        return <Truck className="w-5 h-5 text-blue-500" />;
      case "colis_ramassé":
        return <Package className="w-5 h-5 text-purple-500" />;
      case "en_livraison":
        return <MapPin className="w-5 h-5 text-orange-500" />;
      case "livré":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-poppins font-bold mb-6">
              Suivi de <span className="text-primary">Livraison</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
              Suivez votre colis en temps réel et restez informé à chaque étape de sa livraison.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-12">
        <div className="container-custom max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-background rounded-2xl border border-border p-8 shadow-lg"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Entrez votre code de suivi (ex: VIT-2024-001234)"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                className="flex-1 h-12 text-base"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || !trackingCode.trim()}
                size="lg"
                className="px-8"
              >
                {isSearching ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Recherche...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Suivre
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tracking Results */}
      {orderData && (
        <section className="py-12">
          <div className="container-custom">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Tracking Info */}
              <div className="lg:col-span-2 space-y-8">
                {/* Order Status Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-background rounded-2xl border border-border p-8"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-poppins font-bold mb-2">
                        Commande {orderData.id}
                      </h3>
                      <p className="text-muted-foreground">
                        Livraison estimée à {orderData.estimatedDelivery}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium">En livraison</span>
                      </div>
                    </div>
                  </div>

                  {/* Addresses */}
                  <div className="grid sm:grid-cols-2 gap-6 mb-8">
                    <div className="bg-muted/50 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Package className="w-5 h-5 text-primary" />
                        <span className="font-medium">Ramassage</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {orderData.addresses.pickup}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        <span className="font-medium">Livraison</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {orderData.addresses.delivery}
                      </p>
                    </div>
                  </div>

                  {/* Driver Info */}
                  <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
                    <h4 className="font-semibold mb-4">Votre livreur</h4>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{orderData.driver.name}</p>
                        <p className="text-muted-foreground">{orderData.driver.phone}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(orderData.driver.rating)
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              >
                                ★
                              </div>
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {orderData.driver.rating}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <User className="w-4 h-4 mr-2" />
                          Appeler
                        </Button>
                        <Button size="sm">
                          <MapPin className="w-4 h-4 mr-2" />
                          Voir
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Timeline */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-background rounded-2xl border border-border p-8"
                >
                  <h3 className="text-xl font-poppins font-semibold mb-6">Historique de livraison</h3>
                  <div className="space-y-6">
                    {orderData.timeline.map((event, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            {getStatusIcon(event.status)}
                          </div>
                          {index < orderData.timeline.length - 1 && (
                            <div className="w-0.5 h-16 bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-semibold">{event.title}</h4>
                            <span className="text-sm text-muted-foreground">{event.time}</span>
                          </div>
                          <p className="text-muted-foreground text-sm">{event.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Map */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-background rounded-2xl border border-border overflow-hidden h-[400px] lg:h-[600px] sticky top-24"
                >
                  <MapView />
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Help Section */}
      {!orderData && (
        <section className="py-20 bg-muted/30">
          <div className="container-custom text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="text-3xl font-poppins font-bold mb-6">
                Besoin d'<span className="text-primary">aide</span> ?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Notre équipe support est disponible pour vous aider à suivre votre commande 
                et répondre à toutes vos questions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="group">
                  Contacter le support
                  <User className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline" size="lg">
                  Voir la FAQ
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Tracking;
