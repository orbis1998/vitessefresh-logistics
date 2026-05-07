import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, MessageCircle, Clock, Send, Building, Users, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simuler l'envoi du formulaire
    setTimeout(() => {
      toast({
        title: "Message envoyé avec succès !",
        description: "Nous vous répondrons dans les plus brefs délais.",
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: ""
      });
      setIsSubmitting(false);
    }, 1500);
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "Téléphone",
      value: "+243 81 234 5678",
      description: "Disponible 24/7 pour les urgences",
      action: "Appeler"
    },
    {
      icon: Mail,
      title: "Email",
      value: "contact@vitaexpress.com",
      description: "Réponse sous 2 heures",
      action: "Envoyer un email"
    },
    {
      icon: MapPin,
      title: "Adresse",
      value: "Gombe, Avenue du Commerce N°45",
      description: "Kinshasa, RD Congo",
      action: "Voir sur la carte"
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      value: "+243 81 234 5678",
      description: "Support instantané",
      action: "Discuter"
    }
  ];

  const departments = [
    {
      icon: Users,
      name: "Support Client",
      email: "support@vitaexpress.com",
      phone: "+243 81 234 5678",
      hours: "24/7",
      description: "Questions sur vos commandes, suivi, et assistance générale"
    },
    {
      icon: Building,
      name: "Service Commercial",
      email: "commercial@vitaexpress.com",
      phone: "+243 81 234 5679",
      hours: "Lun-Ven 8h-18h",
      description: "Devis personnalisés, forfaits entreprises, partenariats"
    },
    {
      icon: Headphones,
      name: "Support Technique",
      email: "tech@vitaexpress.com",
      phone: "+243 81 234 5680",
      hours: "Lun-Ven 9h-17h",
      description: "Problèmes techniques, API, intégrations"
    }
  ];

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
              Contactez<span className="text-primary">-nous</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
              Notre équipe est à votre disposition pour répondre à toutes vos questions. 
              Trouvez le contact adapté à votre besoin ou envoyez-nous un message.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick Contact */}
      <section className="py-16">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-background rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300 text-center group"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary transition-all duration-300">
                  <info.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{info.title}</h3>
                <p className="text-primary font-medium mb-1">{info.value}</p>
                <p className="text-muted-foreground text-sm mb-4">{info.description}</p>
                <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {info.action}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Departments */}
      <section className="py-20 bg-muted/30">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="bg-background rounded-2xl border border-border p-8">
                <h2 className="text-3xl font-poppins font-bold mb-6">
                  Envoyez-nous un <span className="text-primary">message</span>
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Nom complet</label>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Votre nom"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="votre@email.com"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Téléphone</label>
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+243 XX XXX XXXX"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Sujet</label>
                    <Input
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Sujet de votre message"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <Textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Décrivez votre demande en détail..."
                      rows={6}
                      required
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full group"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        Envoyer le message
                        <Send className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </motion.div>

            {/* Departments */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-3xl font-poppins font-bold mb-6">
                  Nos <span className="text-primary">départements</span>
                </h2>
                <p className="text-muted-foreground mb-8">
                  Contactez directement le département concerné pour une réponse plus rapide.
                </p>
              </div>

              {departments.map((dept, index) => (
                <motion.div
                  key={dept.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-background rounded-2xl border border-border p-6 hover:border-primary/30 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <dept.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{dept.name}</h3>
                      <p className="text-muted-foreground text-sm mb-3">{dept.description}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span>{dept.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{dept.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{dept.hours}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container-custom max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-poppins font-bold mb-4">
              Questions <span className="text-primary">Fréquentes</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Trouvez rapidement les réponses à vos questions
            </p>
          </motion.div>

          <div className="space-y-6">
            {[
              {
                q: "Quels sont vos horaires de livraison ?",
                a: "Nos livreurs sont disponibles 24/7. Le service standard fonctionne de 6h à 22h, avec un service prioritaire disponible 24h/24."
              },
              {
                q: "Comment calculer le prix d'une livraison ?",
                a: "Le prix dépend de la distance, du poids du colis et du type de service choisi. Utilisez notre calculateur en ligne pour obtenir un devis instantané."
              },
              {
                q: "Puis-je suivre ma livraison en temps réel ?",
                a: "Oui ! Toutes nos livraisons incluent le suivi GPS en temps réel. Vous recevrez un lien de suivi par SMS et email."
              },
              {
                q: "Mes colis sont-ils assurés ?",
                a: "Tous nos colis sont couverts par une assurance de base jusqu'à 50 000 FC. Une assurance premium est disponible pour les colis de valeur supérieure."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-background rounded-xl border border-border p-6 hover:border-primary/30 transition-all duration-300"
              >
                <h4 className="font-semibold text-lg mb-3">{faq.q}</h4>
                <p className="text-muted-foreground">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
