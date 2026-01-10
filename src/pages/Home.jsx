import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  MapPin, 
  Clock, 
  CreditCard, 
  Star, 
  ArrowRight,
  CheckCircle,
  Users,
  Zap,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        const userData = await base44.auth.me();
        setUser(userData);
        
        // Handle referral code from URL
        const params = new URLSearchParams(window.location.search);
        const refCode = params.get('ref');
        if (refCode && !userData.referred_by && refCode !== userData.referral_code) {
          try {
            // Award 50 points to new user
            await base44.auth.updateMe({ 
              referred_by: refCode,
              loyalty_points: (userData.loyalty_points || 0) + 50
            });
            
            // Update referrer's total referrals count
            const allUsers = await base44.entities.User.filter({ referral_code: refCode });
            if (allUsers.length > 0) {
              const referrer = allUsers[0];
              await base44.entities.User.update(referrer.id, {
                total_referrals: (referrer.total_referrals || 0) + 1
              });
            }
          } catch (error) {
            console.error('Error processing referral:', error);
          }
        }
      }
    };
    checkAuth();
  }, []);

  const features = [
    {
      icon: MapPin,
      title: "Géolocalisation en temps réel",
      description: "Suivez votre intervenant en direct pendant qu'il fait vos courses"
    },
    {
      icon: CreditCard,
      title: "Cartes de fidélité",
      description: "Utilisez vos cartes de magasin pour cumuler des points"
    },
    {
      icon: Clock,
      title: "Livraison rapide",
      description: "Recevez vos courses en moins d'une heure"
    },
    {
      icon: Shield,
      title: "Paiement sécurisé",
      description: "Transactions 100% sécurisées et transparentes"
    }
  ];

  const stats = [
    { value: "10K+", label: "Utilisateurs" },
    { value: "50K+", label: "Missions réalisées" },
    { value: "4.9", label: "Note moyenne" },
    { value: "15min", label: "Temps moyen" }
  ];

  const howItWorks = [
    {
      step: "01",
      title: "Créez votre liste",
      description: "Ajoutez les articles dont vous avez besoin"
    },
    {
      step: "02",
      title: "Un intervenant accepte",
      description: "Un shopper proche de vous prend en charge votre demande"
    },
    {
      step: "03",
      title: "Suivez en temps réel",
      description: "Visualisez l'avancement de vos courses sur la carte"
    },
    {
      step: "04",
      title: "Recevez vos courses",
      description: "Livraison à domicile avec paiement sécurisé"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full text-emerald-700 text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                Nouveau: Suivi GPS en temps réel
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Vos courses livrées{' '}
                <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                  en un clic
                </span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-lg">
                AskBring connecte les clients avec des intervenants de confiance pour faire vos courses. 
                Suivez en temps réel et payez en toute sécurité.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {isAuthenticated ? (
                  <>
                    {user?.user_type === 'intervenant' ? (
                      <Link to={createPageUrl('IntervenantDashboard')}>
                        <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xl shadow-emerald-500/25">
                          Mon Dashboard
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                      </Link>
                    ) : (
                      <Link to={createPageUrl('NewMission')}>
                        <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xl shadow-emerald-500/25">
                          Commander maintenant
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <Button 
                      size="lg" 
                      onClick={() => base44.auth.redirectToLogin()}
                      className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xl shadow-emerald-500/25"
                    >
                      Commencer
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="w-full sm:w-auto border-2"
                    >
                      Devenir intervenant
                    </Button>
                  </>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl p-1 shadow-2xl shadow-emerald-500/30">
                <div className="bg-white rounded-[22px] p-6">
                  <img 
                    src="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&h=400&fit=crop"
                    alt="Shopping"
                    className="rounded-2xl w-full h-64 object-cover"
                  />
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">En route</p>
                          <p className="text-sm text-gray-500">Arrivée dans 12 min</p>
                        </div>
                      </div>
                      <span className="text-emerald-600 font-semibold">En direct</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating cards */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute -left-8 top-20 bg-white rounded-2xl shadow-xl p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">4.9/5</p>
                    <p className="text-xs text-gray-500">2,847 avis</p>
                  </div>
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="absolute -right-4 bottom-32 bg-white rounded-2xl shadow-xl p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">50K+</p>
                    <p className="text-xs text-gray-500">Missions réussies</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white/50 backdrop-blur-sm border-y border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-gray-600 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Pourquoi choisir AskBring ?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Une expérience de shopping simplifiée et personnalisée
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm group">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <feature.icon className="w-7 h-7 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gradient-to-b from-white to-emerald-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              4 étapes simples pour recevoir vos courses
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-2xl font-bold mb-4 shadow-lg shadow-emerald-500/30">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {item.description}
                  </p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-emerald-300 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-8 sm:p-12 lg:p-16"
          >
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200')] opacity-10 bg-cover bg-center" />
            <div className="relative z-10 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Prêt à simplifier vos courses ?
              </h2>
              <p className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto">
                Rejoignez des milliers d'utilisateurs satisfaits et économisez votre temps précieux
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={() => base44.auth.redirectToLogin()}
                  className="bg-white text-emerald-600 hover:bg-emerald-50 shadow-xl"
                >
                  Créer mon compte gratuit
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}