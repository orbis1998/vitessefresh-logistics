import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, Package, User, Phone, Navigation, CheckCircle, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import MapView from "@/components/MapView";
import ProgressIndicator from "@/components/ui/progress-indicator";
import { useToast } from "@/hooks/use-toast";

interface DriverLocation {
  coordinates: [number, number];
  heading: number;
  speed: number;
  lastUpdate: number;
}

interface OrderData {
  id: string;
  trackingCode: string;
  status: "commande_confirmée" | "ramassage" | "colis_ramassé" | "en_livraison" | "livré";
  estimatedDelivery: string;
  currentLocation?: string;
  driver?: {
    name: string;
    phone: string;
    photo: string;
    rating: number;
    vehicle: string;
    plateNumber: string;
  };
  pickupAddress: string;
  deliveryAddress: string;
  timeline: Array<{
    time: string;
    status: string;
    title: string;
    description: string;
  }>;
}

const TrackingImproved = () => {
  const { toast } = useToast();
  const [trackingCode, setTrackingCode] = useState("");
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [route, setRoute] = useState<Array<[number, number]>>([]);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveTracking, setIsLiveTracking] = useState(false);

  // Mock order data for demonstration
  const mockOrderData: OrderData = {
    id: "order-123",
    trackingCode: "VIT-2024-001234",
    status: "en_livraison",
    estimatedDelivery: "15:30",
    currentLocation: "Avenue des Huileries, Gombe",
    driver: {
      name: "Jean Mukendi",
      phone: "+243 81 234 5678",
      photo: "/api/placeholder/60/60",
      rating: 4.8,
      vehicle: "Moto",
      plateNumber: "RD-1234-AB"
    },
    pickupAddress: "Gombe, Avenue du Commerce N°45",
    deliveryAddress: "Limete, Résidentiel Bloc A N°12",
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
    ]
  };

  // Simulate driver location updates
  useEffect(() => {
    if (!isLiveTracking || !orderData) return;

    const interval = setInterval(() => {
      // Simulate movement along route
      setDriverLocation(prev => {
        if (!prev) return null;
        
        // Simple simulation: move slightly towards destination
        const newCoordinates: [number, number] = [
          prev.coordinates[0] + (Math.random() - 0.5) * 0.001,
          prev.coordinates[1] + (Math.random() - 0.5) * 0.001
        ];
        
        return {
          coordinates: newCoordinates,
          heading: Math.random() * 360,
          speed: 20 + Math.random() * 30,
          lastUpdate: Date.now()
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isLiveTracking, orderData]);

  const handleSearch = () => {
    if (!trackingCode.trim()) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setOrderData(mockOrderData);
      
      // Set initial driver location
      setDriverLocation({
        coordinates: [15.2663, -4.4419],
        heading: 45,
        speed: 25,
        lastUpdate: Date.now()
      });
      
      // Set mock route
      setRoute([
        [15.2663, -4.4419],
        [15.2700, -4.4450],
        [15.2750, -4.4500],
        [15.2800, -4.4550],
        [15.2850, -4.4600]
      ]);
      
      // Set estimated time
      setEstimatedTime(25);
      
      setIsLoading(false);
      setIsLiveTracking(true);
      
      toast({
        title: "Suivi activé",
        description: "Le suivi en temps réel est maintenant actif"
      });
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
        return <Navigation className="w-5 h-5 text-orange-500" />;
      case "livré":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const currentStepIndex = orderData?.timeline.findIndex(item => item.status === orderData.status) || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          <h1 className="text-3xl font-poppins font-bold mb-8">
            Suivi de <span className="text-primary">Livraison</span>
          </h1>

          {/* Search Section */}
          {!orderData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-background rounded-2xl border border-border p-8 max-w-2xl mx-auto mb-8"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Entrez votre code de suivi (ex: VIT-2024-001234)"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  className="flex-1 h-12 text-base px-4 rounded-lg border border-border bg-background"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button
                  onClick={handleSearch}
                  disabled={isLoading || !trackingCode.trim()}
                  size="lg"
                  className="px-8"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : null}
                  Suivre
                </Button>
              </div>
            </motion.div>
          )}

          {orderData && (
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
                        Commande {orderData.trackingCode}
                      </h3>
                      <p className="text-muted-foreground">
                        Livraison estimée à {orderData.estimatedDelivery}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium">
                          {orderData.status === "en_livraison" ? "En livraison" : 
                           orderData.status === "livré" ? "Livrée" : "En préparation"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="mb-8">
                    <ProgressIndicator
                      steps={orderData.timeline.map(item => item.title)}
                      currentStep={currentStepIndex}
                    />
                  </div>

                  {/* Addresses */}
                  <div className="grid sm:grid-cols-2 gap-6 mb-8">
                    <div className="bg-muted/50 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Package className="w-5 h-5 text-primary" />
                        <span className="font-medium">Ramassage</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {orderData.pickupAddress}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        <span className="font-medium">Livraison</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {orderData.deliveryAddress}
                      </p>
                    </div>
                  </div>

                  {/* Driver Info */}
                  {orderData.driver && (
                    <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        Votre livreur
                      </h4>
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
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>{orderData.driver.vehicle}</span>
                            <span>•</span>
                            <span>{orderData.driver.plateNumber}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Phone className="w-4 h-4 mr-2" />
                            Appeler
                          </Button>
                          <Button size="sm">
                            <Navigation className="w-4 h-4 mr-2" />
                            Suivre
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Timeline */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-background rounded-2xl border border-border p-8"
                >
                  <h3 className="text-xl font-poppins font-semibold mb-6">
                    Historique de livraison
                  </h3>
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
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-background rounded-2xl border border-border overflow-hidden sticky top-24"
                  style={{ height: "600px" }}
                >
                  <MapView
                    markers={
                      [
                        {
                          coordinates: [15.2663, -4.4419],
                          type: "pickup" as const,
                          popup: "Point de ramassage"
                        },
                        {
                          coordinates: [15.2850, -4.4600],
                          type: "delivery" as const,
                          popup: "Point de livraison"
                        }
                      ]
                    }
                    showDriverLocation={isLiveTracking}
                    driverLocation={driverLocation?.coordinates}
                    route={route}
                    estimatedTime={estimatedTime}
                    readonly={true}
                  />
                  
                  {/* Live tracking indicator */}
                  {isLiveTracking && (
                    <div className="absolute top-4 left-4 z-10 bg-green-500 text-white px-3 py-2 rounded-lg flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-sm font-medium">Suivi en direct</span>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TrackingImproved;
