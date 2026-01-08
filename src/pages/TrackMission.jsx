import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { useLiveLocationTracking } from '@/components/mission/LiveLocationTracker';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  ShoppingCart,
  Truck,
  CheckCircle,
  Phone,
  MessageSquare,
  Navigation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const intervenantIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const statusSteps = [
  { status: 'accepted', label: 'Acceptée', icon: CheckCircle },
  { status: 'in_progress', label: 'En route', icon: Navigation },
  { status: 'shopping', label: 'En courses', icon: ShoppingCart },
  { status: 'delivering', label: 'En livraison', icon: Truck },
  { status: 'completed', label: 'Livrée', icon: CheckCircle },
];

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 14);
    }
  }, [center, map]);
  return null;
}

export default function TrackMission() {
  const [mission, setMission] = useState(null);
  const [intervenantLocation, setIntervenantLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [lastLocationUpdate, setLastLocationUpdate] = useState(null);

  useEffect(() => {
    loadData();
    // Poll for location updates every 10 seconds
    const interval = setInterval(() => {
      const params = new URLSearchParams(window.location.search);
      const missionId = params.get('id');
      
      if (mission?.intervenant_email) {
        base44.entities.IntervenantLocation.filter({
          user_email: mission.intervenant_email
        }).then(locations => {
          if (locations.length > 0) {
            setIntervenantLocation(locations[0]);
            setLastLocationUpdate(new Date());
          }
        }).catch(err => console.error('Error updating location:', err));
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [mission?.intervenant_email]);

  // Track intervenant location if they are viewing their own mission
  const isIntervenant = user?.email === mission?.intervenant_email;
  const activeMissionId = isIntervenant && ['in_progress', 'shopping', 'delivering'].includes(mission?.status)
    ? mission?.id
    : null;
  useLiveLocationTracking(user, activeMissionId);

  const loadData = async () => {
    const params = new URLSearchParams(window.location.search);
    const missionId = params.get('id');

    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const missions = await base44.entities.Mission.filter({ id: missionId });
      if (missions.length > 0) {
        setMission(missions[0]);
        
        // Get intervenant location
        if (missions[0].intervenant_email) {
          const locations = await base44.entities.IntervenantLocation.filter({
            user_email: missions[0].intervenant_email
          });
          if (locations.length > 0) {
            setIntervenantLocation(locations[0]);
            setLastLocationUpdate(new Date());
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStepIndex = () => {
    return statusSteps.findIndex(s => s.status === mission?.status);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Mission non trouvée</p>
      </div>
    );
  }

  const defaultCenter = [48.8566, 2.3522]; // Paris
  const mapCenter = intervenantLocation 
    ? [intervenantLocation.latitude, intervenantLocation.longitude]
    : mission.delivery_lat && mission.delivery_lng
    ? [mission.delivery_lat, mission.delivery_lng]
    : defaultCenter;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to={createPageUrl('MissionDetails') + `?id=${mission.id}`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="font-semibold text-gray-900">Suivi en direct</h1>
                <p className="text-sm text-gray-500">{mission.store_name}</p>
              </div>
            </div>
            {mission.intervenant_name && (
              <Link to={createPageUrl('Messages') + `?mission=${mission.id}`}>
                <Button variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="h-[50vh] relative">
        <MapContainer
          center={mapCenter}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={mapCenter} />
          
          {/* Intervenant marker */}
          {intervenantLocation && (
            <Marker 
              position={[intervenantLocation.latitude, intervenantLocation.longitude]}
              icon={intervenantIcon}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-semibold">{mission.intervenant_name}</p>
                  <p className="text-sm text-gray-500">Votre intervenant</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Delivery marker */}
          {mission.delivery_lat && mission.delivery_lng && (
            <Marker 
              position={[mission.delivery_lat, mission.delivery_lng]}
              icon={deliveryIcon}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-semibold">Point de livraison</p>
                  <p className="text-sm text-gray-500">{mission.delivery_address}</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Live indicator */}
        <div className="absolute top-4 right-4 z-[1000]">
          <Badge className="bg-emerald-500 text-white shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            EN DIRECT
            {lastLocationUpdate && (
              <span className="text-xs opacity-90">
                • {Math.floor((new Date() - lastLocationUpdate) / 1000)}s
              </span>
            )}
          </Badge>
        </div>
      </div>

      {/* Status & Info */}
      <div className="max-w-2xl mx-auto px-4 py-6 -mt-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Status Card */}
          <Card className="border-0 shadow-xl mb-6">
            <CardContent className="p-6">
              {/* Progress Steps */}
              <div className="flex items-center justify-between mb-6">
                {statusSteps.map((step, index) => {
                  const isActive = index <= getCurrentStepIndex();
                  const isCurrent = index === getCurrentStepIndex();
                  return (
                    <div key={step.status} className="flex flex-col items-center relative">
                      <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isActive 
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white' 
                            : 'bg-gray-100 text-gray-400'
                        } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}
                      >
                        <step.icon className="w-5 h-5" />
                      </div>
                      <span className={`text-xs mt-2 ${isActive ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                        {step.label}
                      </span>
                      {index < statusSteps.length - 1 && (
                        <div 
                          className={`absolute top-5 left-full w-full h-0.5 -translate-x-1/2 ${
                            index < getCurrentStepIndex() ? 'bg-emerald-500' : 'bg-gray-200'
                          }`}
                          style={{ width: 'calc(100% - 40px)', marginLeft: '20px' }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Current Status */}
              <div className="text-center p-4 bg-emerald-50 rounded-xl">
                <p className="text-sm text-emerald-600 mb-1">Statut actuel</p>
                <p className="text-xl font-bold text-gray-900">
                  {statusSteps.find(s => s.status === mission.status)?.label || mission.status}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Intervenant Info */}
          {mission.intervenant_name && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-14 h-14">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xl">
                        {mission.intervenant_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900">{mission.intervenant_name}</p>
                      <p className="text-sm text-gray-500">Votre intervenant</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link to={createPageUrl('Messages') + `?mission=${mission.id}`}>
                      <Button variant="outline" size="icon">
                        <MessageSquare className="w-5 h-5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}