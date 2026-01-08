import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Clock, 
  ShoppingCart,
  Store,
  ChevronRight,
  Wallet,
  Navigation,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

export default function AvailableMissions() {
  const { showNotification } = useNotifications();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    // Get geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => console.log('Geolocation error:', error)
      );
    }
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      // Get all pending missions
      const pendingMissions = await base44.entities.Mission.filter(
        { status: 'pending' },
        '-created_date'
      );
      setMissions(pendingMissions);
    } catch (error) {
      console.error('Error loading missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const acceptMission = async (mission) => {
    try {
      await base44.entities.Mission.update(mission.id, {
        intervenant_email: user.email,
        intervenant_name: user.full_name,
        status: 'accepted'
      });
      
      toast({
        title: "Mission acceptée !",
        description: "Vous pouvez maintenant commencer les courses"
      });

      // Notify client
      showNotification('Mission acceptée', {
        body: `Vous avez accepté la mission au ${mission.store_name}`,
        type: 'acceptance'
      });

      // Remove from list
      setMissions(prev => prev.filter(m => m.id !== mission.id));
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'accepter cette mission",
        variant: "destructive"
      });
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Missions Disponibles</h1>
            <p className="text-gray-600 mt-1">{missions.length} mission(s) près de vous</p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {missions.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <MapPin className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune mission disponible</h3>
              <p className="text-gray-500 text-center mb-6">
                Revenez plus tard ou activez les notifications
              </p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {missions.map((mission, index) => {
                const distance = location ? 
                  calculateDistance(
                    location.latitude, 
                    location.longitude, 
                    mission.delivery_lat, 
                    mission.delivery_lng
                  ) : null;

                return (
                  <motion.div
                    key={mission.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                                <Store className="w-7 h-7 text-emerald-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 text-lg">{mission.store_name}</h3>
                                <p className="text-sm text-gray-500">
                                  Par {mission.client_name}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-emerald-600">
                                {(mission.service_fee || 5).toFixed(2)}€
                              </p>
                              <p className="text-xs text-gray-500">Rémunération</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <ShoppingCart className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">
                                {mission.shopping_list?.length || 0} articles
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Wallet className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">
                                Budget: ~{mission.estimated_budget || 0}€
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">
                                {moment(mission.created_date).fromNow()}
                              </span>
                            </div>
                            {distance && (
                              <div className="flex items-center gap-2 text-sm">
                                <Navigation className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">
                                  ~{distance} km
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl mb-4">
                            <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-600">{mission.delivery_address}</span>
                          </div>

                          {mission.notes && (
                            <p className="text-sm text-gray-500 italic mb-4">
                              "{mission.notes}"
                            </p>
                          )}

                          <div className="flex gap-3">
                            <Button
                              onClick={() => acceptMission(mission)}
                              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                            >
                              Accepter la mission
                            </Button>
                            <Link to={createPageUrl('MissionDetails') + `?id=${mission.id}`}>
                              <Button variant="outline">
                                Détails
                                <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}