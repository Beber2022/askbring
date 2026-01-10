import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Navigation,
  Filter,
  DollarSign,
  Clock,
  Package,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const missionIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAzMCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNMTUgMEMxMC44NTc5IDAgNi44NjI1MSAxLjY0MjU2IDMuOTM1OTggNC41NjkwOUMxLjAwOTQ2IDcuNDk1NjIgLTAuNjMzMDE3IDExLjQ5MDkgLTAuNjMzMDE3IDE1LjYzM0MtMC42MzMwMTcgMjMuMzE1IDcuMDQ2OTggMzMuNTYyIDE1IDQwQzIyLjk1MyAzMy41NjIgMzAuNjMzIDIzLjMxNSAzMC42MzMgMTUuNjMzQzMwLjYzMyAxMS40OTA5IDI4Ljk5MDUgNy40OTU2MiAyNi4wNjQgNC41NjkwOUMyMy4xMzc1IDEuNjQyNTYgMTkuMTQyMSAwIDE1IDBaIiBmaWxsPSIjMTBiOTgxIi8+CiAgPGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iOCIgZmlsbD0id2hpdGUiLz4KICA8cGF0aCBkPSJNMTUgMTBMMTggMTVIMTJMMTUgMTBaIiBmaWxsPSIjMTBiOTgxIi8+Cjwvc3ZnPg==',
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -40],
});

const userIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSIxNSIgY3k9IjE1IiByPSIxNSIgZmlsbD0iIzM3ODJmNiIvPgogIDxjaXJjbGUgY3g9IjE1IiBjeT0iMTUiIHI9IjgiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg==',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

export default function MissionMap() {
  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [missions, setMissions] = useState([]);
  const [filteredMissions, setFilteredMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(10);
  const [minFee, setMinFee] = useState(0);
  const [selectedMission, setSelectedMission] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterMissions();
  }, [missions, radius, minFee, userLocation]);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      // Get user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => {
            console.error('Geolocation error:', error);
            setUserLocation({ lat: 48.8566, lng: 2.3522 }); // Default to Paris
          }
        );
      }

      // Load available missions
      const pendingMissions = await base44.entities.Mission.filter(
        { status: 'pending' },
        '-created_date',
        50
      );
      setMissions(pendingMissions.filter(m => m.delivery_lat && m.delivery_lng));
    } catch (error) {
      console.error('Error loading data:', error);
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

  const filterMissions = () => {
    if (!userLocation) {
      setFilteredMissions(missions);
      return;
    }

    const filtered = missions.filter(m => {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        m.delivery_lat,
        m.delivery_lng
      );
      return distance <= radius && (m.service_fee || 0) >= minFee;
    });

    setFilteredMissions(filtered);
  };

  const acceptMission = async (mission) => {
    try {
      await base44.entities.Mission.update(mission.id, {
        status: 'accepted',
        intervenant_email: user.email,
        intervenant_name: user.full_name
      });

      toast({
        title: "Mission acceptée !",
        description: "La mission a été ajoutée à votre liste"
      });

      await loadData();
    } catch (error) {
      toast({
        title: "Erreur",
        variant: "destructive"
      });
    }
  };

  const getOptimizedRoute = async (mission) => {
    if (!userLocation) return;

    try {
      const prompt = `Je suis un Bringeur à ${userLocation.lat},${userLocation.lng}. 
      Je dois aller chercher des courses au magasin ${mission.store_name} à ${mission.store_address || 'adresse inconnue'} 
      puis livrer à ${mission.delivery_address}.
      
      Donne-moi:
      1. Le meilleur itinéraire en tenant compte du trafic actuel
      2. Temps de trajet estimé
      3. Informations sur le trafic (fluide, dense, saturé)
      4. Conseils de navigation`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            route_description: { type: "string" },
            estimated_time: { type: "string" },
            traffic_status: { type: "string" },
            tips: { type: "string" }
          }
        }
      });

      setSelectedMission({
        ...mission,
        routeInfo: response
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de calculer l'itinéraire",
        variant: "destructive"
      });
    }
  };

  if (loading || !userLocation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-sm px-4 py-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-emerald-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Missions à proximité</h1>
            <p className="text-sm text-gray-600">{filteredMissions.length} disponibles</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={radius.toString()} onValueChange={(v) => setRadius(parseInt(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 km</SelectItem>
              <SelectItem value="10">10 km</SelectItem>
              <SelectItem value="20">20 km</SelectItem>
              <SelectItem value="50">50 km</SelectItem>
            </SelectContent>
          </Select>

          <Select value={minFee.toString()} onValueChange={(v) => setMinFee(parseInt(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Tous frais</SelectItem>
              <SelectItem value="3">≥ 3€</SelectItem>
              <SelectItem value="5">≥ 5€</SelectItem>
              <SelectItem value="7">≥ 7€</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <div className="flex-1 relative">
        <MapContainer
          center={[userLocation.lat, userLocation.lng]}
          zoom={12}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={[userLocation.lat, userLocation.lng]} zoom={12} />

          {/* User location */}
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div className="p-2">
                <p className="font-semibold">Votre position</p>
              </div>
            </Popup>
          </Marker>

          {/* Radius circle */}
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={radius * 1000}
            pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.1 }}
          />

          {/* Mission markers */}
          {filteredMissions.map((mission) => {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              mission.delivery_lat,
              mission.delivery_lng
            );

            return (
              <Marker
                key={mission.id}
                position={[mission.delivery_lat, mission.delivery_lng]}
                icon={missionIcon}
              >
                <Popup maxWidth={300}>
                  <div className="p-3">
                    <h3 className="font-bold text-gray-900 mb-2">{mission.store_name}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-500" />
                        <span>{mission.shopping_list?.length || 0} articles</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold text-emerald-600">
                          {(mission.service_fee || 0).toFixed(2)}€
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-blue-600" />
                        <span>{distance.toFixed(1)} km</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>{moment(mission.created_date).fromNow()}</span>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <Button
                        onClick={() => getOptimizedRoute(mission)}
                        className="w-full"
                        variant="outline"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Optimiser trajet
                      </Button>
                      <Button
                        onClick={() => acceptMission(mission)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                      >
                        Accepter la mission
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Route info overlay */}
        {selectedMission?.routeInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 right-4 z-[1000]"
          >
            <Card className="border-0 shadow-2xl">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-gray-900">{selectedMission.store_name}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMission(null)}
                  >
                    ✕
                  </Button>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Temps estimé:</span>
                    <span className="ml-2">{selectedMission.routeInfo.estimated_time}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Trafic:</span>
                    <Badge className="ml-2" variant={
                      selectedMission.routeInfo.traffic_status?.includes('fluide') ? 'default' :
                      selectedMission.routeInfo.traffic_status?.includes('dense') ? 'secondary' : 'destructive'
                    }>
                      {selectedMission.routeInfo.traffic_status}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Itinéraire:</p>
                    <p className="text-gray-600">{selectedMission.routeInfo.route_description}</p>
                  </div>
                  {selectedMission.routeInfo.tips && (
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-900">{selectedMission.routeInfo.tips}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}