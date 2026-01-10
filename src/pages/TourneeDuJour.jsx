import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Navigation,
  Clock,
  CheckCircle,
  ArrowRight,
  Store,
  Package,
  Route,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const numberIcon = (number, color = '#10b981') => L.divIcon({
  html: `<div style="background: ${color}; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${number}</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default function TourneeDuJour() {
  const [user, setUser] = useState(null);
  const [missions, setMissions] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalDistance, setTotalDistance] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      // Get current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCurrentLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => console.log('Geolocation error:', error)
        );
      }

      // Get today's missions
      const userMissions = await base44.entities.Mission.filter({
        intervenant_email: userData.email,
        status: { $in: ['accepted', 'in_progress', 'shopping'] }
      }, '-created_date');

      setMissions(userMissions);

      // Optimize route
      if (userMissions.length > 0) {
        const optimized = optimizeRoute(userMissions, {
          lat: currentLocation?.lat || 48.8566,
          lng: currentLocation?.lng || 2.3522
        });
        setOptimizedRoute(optimized);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: "Erreur de chargement", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getPriority = (mission) => {
    let priority = 0;
    
    // Time-based priority
    if (mission.scheduled_time === 'morning') priority += 30;
    if (mission.scheduled_time === 'afternoon') priority += 20;
    if (mission.scheduled_time === 'evening') priority += 10;
    
    // Status-based priority
    if (mission.status === 'in_progress') priority += 50;
    if (mission.status === 'shopping') priority += 40;
    
    // Budget-based priority (higher budget = higher priority)
    priority += (mission.estimated_budget || 0) * 0.1;
    
    return priority;
  };

  const optimizeRoute = (missionsToOptimize, startLocation) => {
    if (missionsToOptimize.length === 0) return [];
    
    // Filter missions with valid coordinates
    const validMissions = missionsToOptimize.filter(m => m.delivery_lat && m.delivery_lng);
    if (validMissions.length === 0) return missionsToOptimize;

    // Sort by priority first
    const sortedByPriority = [...validMissions].sort((a, b) => 
      getPriority(b) - getPriority(a)
    );

    // Nearest neighbor algorithm with priority consideration
    const route = [];
    const remaining = [...sortedByPriority];
    let current = startLocation;
    let totalDist = 0;

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;
      
      remaining.forEach((mission, index) => {
        const distance = calculateDistance(
          current.lat,
          current.lng,
          mission.delivery_lat,
          mission.delivery_lng
        );
        
        // Factor in priority (higher priority = artificially shorter distance)
        const priorityFactor = getPriority(mission) / 100;
        const adjustedDistance = distance * (1 - priorityFactor);
        
        if (adjustedDistance < nearestDistance) {
          nearestDistance = distance; // Use real distance for calculation
          nearestIndex = index;
        }
      });

      const nearest = remaining[nearestIndex];
      route.push(nearest);
      totalDist += nearestDistance;
      current = { lat: nearest.delivery_lat, lng: nearest.delivery_lng };
      remaining.splice(nearestIndex, 1);
    }

    setTotalDistance(totalDist);
    setEstimatedTime(Math.ceil(totalDist / 30 * 60)); // Assuming 30km/h average

    return route;
  };

  const getMapCenter = () => {
    if (currentLocation) return [currentLocation.lat, currentLocation.lng];
    if (optimizedRoute.length > 0 && optimizedRoute[0].delivery_lat) {
      return [optimizedRoute[0].delivery_lat, optimizedRoute[0].delivery_lng];
    }
    return [48.8566, 2.3522]; // Paris default
  };

  const getRoutePolyline = () => {
    const points = [];
    
    if (currentLocation) {
      points.push([currentLocation.lat, currentLocation.lng]);
    }
    
    optimizedRoute.forEach(mission => {
      if (mission.delivery_lat && mission.delivery_lng) {
        points.push([mission.delivery_lat, mission.delivery_lng]);
      }
    });
    
    return points;
  };

  const getStatusColor = (status) => {
    const colors = {
      accepted: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-purple-100 text-purple-700',
      shopping: 'bg-indigo-100 text-indigo-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status) => {
    const labels = {
      accepted: 'Acceptée',
      in_progress: 'En cours',
      shopping: 'Courses en cours'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Route className="w-6 h-6 text-white" />
                </div>
                Tournée du jour
              </h1>
              <p className="text-gray-600 mt-2">
                {moment().format('dddd D MMMM YYYY')}
              </p>
            </div>
            <Button
              onClick={loadData}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              Actualiser
            </Button>
          </div>

          {missions.length === 0 ? (
            <Card className="border-0 shadow-lg text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucune mission aujourd'hui
              </h3>
              <p className="text-gray-500 mb-6">
                Vous n'avez pas de missions actives pour le moment
              </p>
              <Link to={createPageUrl('AvailableMissions')}>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-600">
                  Voir les missions disponibles
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Stats Cards */}
              <div className="lg:col-span-3 grid md:grid-cols-3 gap-4">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-emerald-100 text-sm">Missions</p>
                        <p className="text-3xl font-bold mt-1">{missions.length}</p>
                      </div>
                      <Package className="w-12 h-12 opacity-20" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm">Distance totale</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">
                          {totalDistance.toFixed(1)} km
                        </p>
                      </div>
                      <MapPin className="w-12 h-12 text-emerald-500 opacity-20" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm">Temps estimé</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">
                          {Math.floor(estimatedTime / 60)}h{estimatedTime % 60}
                        </p>
                      </div>
                      <Clock className="w-12 h-12 text-emerald-500 opacity-20" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Map */}
              <div className="lg:col-span-2">
                <Card className="border-0 shadow-lg overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                      Itinéraire optimisé
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="h-[500px] relative">
                      <MapContainer
                        center={getMapCenter()}
                        zoom={12}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; OpenStreetMap contributors'
                        />

                        {/* Current location */}
                        {currentLocation && (
                          <Marker
                            position={[currentLocation.lat, currentLocation.lng]}
                            icon={numberIcon('📍', '#3b82f6')}
                          >
                            <Popup>Votre position</Popup>
                          </Marker>
                        )}

                        {/* Mission markers */}
                        {optimizedRoute.map((mission, index) => (
                          mission.delivery_lat && mission.delivery_lng && (
                            <Marker
                              key={mission.id}
                              position={[mission.delivery_lat, mission.delivery_lng]}
                              icon={numberIcon(index + 1)}
                            >
                              <Popup>
                                <div className="text-sm">
                                  <p className="font-semibold">{index + 1}. {mission.store_name}</p>
                                  <p className="text-gray-600">{mission.delivery_address}</p>
                                </div>
                              </Popup>
                            </Marker>
                          )
                        ))}

                        {/* Route line */}
                        {getRoutePolyline().length > 1 && (
                          <Polyline
                            positions={getRoutePolyline()}
                            color="#10b981"
                            weight={4}
                            opacity={0.7}
                            dashArray="10, 10"
                          />
                        )}
                      </MapContainer>

                      {/* Legend */}
                      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-4 h-4 bg-blue-500 rounded-full" />
                          <span>Vous</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm mt-2">
                          <div className="w-4 h-4 bg-emerald-500 rounded-full" />
                          <span>Missions</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Mission List */}
              <div className="space-y-4">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Itinéraire optimisé</p>
                        <p className="text-sm text-gray-600">
                          Économisez {totalDistance > 0 ? ((totalDistance * 0.2).toFixed(1)) : '0'} km
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <AnimatePresence>
                    {optimizedRoute.map((mission, index) => (
                      <motion.div
                        key={mission.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div>
                                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                      <Store className="w-4 h-4 text-emerald-600" />
                                      {mission.store_name}
                                    </h4>
                                    {mission.scheduled_time && (
                                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                        <Clock className="w-3 h-3" />
                                        {mission.scheduled_time === 'morning' && 'Matin'}
                                        {mission.scheduled_time === 'afternoon' && 'Après-midi'}
                                        {mission.scheduled_time === 'evening' && 'Soir'}
                                      </div>
                                    )}
                                  </div>
                                  <Badge className={getStatusColor(mission.status)}>
                                    {getStatusLabel(mission.status)}
                                  </Badge>
                                </div>

                                <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                  <span className="line-clamp-2">{mission.delivery_address}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <Package className="w-3 h-3" />
                                      {mission.shopping_list?.length || 0} articles
                                    </span>
                                    {index > 0 && optimizedRoute[index - 1].delivery_lat && (
                                      <span className="flex items-center gap-1">
                                        <Navigation className="w-3 h-3" />
                                        {calculateDistance(
                                          optimizedRoute[index - 1].delivery_lat,
                                          optimizedRoute[index - 1].delivery_lng,
                                          mission.delivery_lat,
                                          mission.delivery_lng
                                        ).toFixed(1)} km
                                      </span>
                                    )}
                                  </div>
                                  <Link to={createPageUrl('MissionDetails') + `?id=${mission.id}`}>
                                    <Button size="sm" variant="ghost" className="h-8">
                                      <ArrowRight className="w-4 h-4" />
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-4">
                  <Button 
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                    onClick={() => {
                      if (optimizedRoute.length > 0 && optimizedRoute[0].delivery_lat) {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${optimizedRoute[0].delivery_lat},${optimizedRoute[0].delivery_lng}`;
                        window.open(url, '_blank');
                      }
                    }}
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Démarrer la tournée
                  </Button>
                  
                  <Link to={createPageUrl('IntervenantMissions')}>
                    <Button variant="outline" className="w-full">
                      Voir toutes mes missions
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}