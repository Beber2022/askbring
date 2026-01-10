import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

const statusConfig = {
  in_progress: { label: 'En cours', color: '#8B5CF6' },
  shopping: { label: 'En courses', color: '#3B82F6' },
  delivering: { label: 'En livraison', color: '#10B981' },
  late: { label: 'En retard', color: '#EF4444' }
};

export default function ClientMissionTracker({ mission, user }) {
  const [intervenantLocation, setIntervenantLocation] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLate, setIsLate] = useState(false);
  const [eta, setEta] = useState(null);

  useEffect(() => {
    loadTrackingData();
    const interval = setInterval(loadTrackingData, 5000);
    return () => clearInterval(interval);
  }, [mission]);

  const loadTrackingData = async () => {
    try {
      // Get intervenant current location
      if (mission.intervenant_email) {
        const locations = await base44.entities.IntervenantLocation.filter({
          user_email: mission.intervenant_email
        }, '-updated_date', 1);

        if (locations.length > 0) {
          setIntervenantLocation(locations[0]);
          checkForLate(locations[0]);
        }
      }

      // Get location history for route visualization
      const history = await base44.entities.LocationHistory.filter(
        { mission_id: mission.id },
        '-created_date',
        50
      );
      setLocationHistory(history);
    } catch (error) {
      console.error('Error loading tracking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateETA = (lat1, lon1, lat2, lon2, speed = 15) => {
    const distance = calculateDistance(lat1, lon1, lat2, lon2);
    const timeInHours = distance / speed;
    const minutes = Math.round(timeInHours * 60);
    return minutes;
  };

  const checkForLate = async (currentLocation) => {
    if (!mission.delivery_lat || !mission.delivery_lng || !mission.scheduled_time) {
      return;
    }

    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      mission.delivery_lat,
      mission.delivery_lng
    );

    const estimatedMinutes = calculateETA(
      currentLocation.latitude,
      currentLocation.longitude,
      mission.delivery_lat,
      mission.delivery_lng,
      currentLocation.speed || 15
    );

    const scheduledTime = new Date(mission.scheduled_time);
    const currentTime = new Date();
    const minutesUntilScheduled = (scheduledTime - currentTime) / (1000 * 60);

    // Mark as late if ETA exceeds scheduled time by more than 15 minutes
    if (estimatedMinutes > minutesUntilScheduled + 15 && mission.status !== 'late') {
      setIsLate(true);
      
      // Auto-update mission status to late
      try {
        await base44.entities.Mission.update(mission.id, {
          status: 'late'
        });

        // Create notification
        await base44.entities.Notification.create({
          user_email: mission.client_email,
          title: 'Mission en retard',
          message: `Votre intervenant sera en retard de ${estimatedMinutes - minutesUntilScheduled} minutes environ`,
          type: 'urgent',
          mission_id: mission.id
        });
      } catch (error) {
        console.error('Error updating mission status:', error);
      }
    } else if (estimatedMinutes <= minutesUntilScheduled + 15) {
      setIsLate(false);
    }

    setEta(estimatedMinutes);
  };

  if (loading || !intervenantLocation) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mr-2" />
          <span className="text-gray-600">Chargement de la position...</span>
        </CardContent>
      </Card>
    );
  }

  const distance = calculateDistance(
    intervenantLocation.latitude,
    intervenantLocation.longitude,
    mission.delivery_lat,
    mission.delivery_lng
  );

  const statusInfo = statusConfig[mission.status] || statusConfig.delivering;
  const routeCoordinates = locationHistory.map(loc => [loc.latitude, loc.longitude]).reverse();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Late Alert */}
      {isLate && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            ⚠️ Votre intervenant sera en retard d'environ {eta - ((new Date(mission.scheduled_time) - new Date()) / 60000)} minutes
          </AlertDescription>
        </Alert>
      )}

      {/* Map Card */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              Position en temps réel
            </CardTitle>
            <Badge style={{ backgroundColor: statusInfo.color }} className="text-white">
              {statusInfo.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl overflow-hidden h-[400px] border border-gray-200 mb-4">
            <MapContainer
              center={[intervenantLocation.latitude, intervenantLocation.longitude]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />

              {/* Intervenant Location */}
              <Marker
                position={[intervenantLocation.latitude, intervenantLocation.longitude]}
                icon={L.icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41]
                })}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-medium">{mission.intervenant_name}</p>
                    <p className="text-xs text-gray-600">Position actuelle</p>
                  </div>
                </Popup>
              </Marker>

              {/* Destination */}
              <Marker
                position={[mission.delivery_lat, mission.delivery_lng]}
                icon={L.icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41]
                })}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-medium">Votre adresse</p>
                    <p className="text-xs text-gray-600">{mission.delivery_address}</p>
                  </div>
                </Popup>
              </Marker>

              {/* Route trace */}
              {routeCoordinates.length > 1 && (
                <Polyline
                  positions={routeCoordinates}
                  color="#10b981"
                  weight={3}
                  opacity={0.7}
                  dashArray="5, 5"
                />
              )}

              {/* Current location circle */}
              <CircleMarker
                center={[intervenantLocation.latitude, intervenantLocation.longitude]}
                radius={50}
                color="#10b981"
                fillColor="#10b981"
                fillOpacity={0.1}
                weight={2}
              />
            </MapContainer>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-emerald-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-emerald-600">{distance.toFixed(1)}</div>
              <div className="text-xs text-gray-600">km restants</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <div className="flex items-center justify-center gap-1">
                <Clock className="w-4 h-4 text-blue-600" />
                <div className="text-2xl font-bold text-blue-600">{eta}</div>
              </div>
              <div className="text-xs text-gray-600">min estimés</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">
                {intervenantLocation.speed ? Math.round(intervenantLocation.speed * 3.6) : '0'}
              </div>
              <div className="text-xs text-gray-600">km/h</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Update */}
      <div className="text-xs text-gray-500 text-center">
        Dernière mise à jour: {new Date(intervenantLocation.updated_date).toLocaleTimeString('fr-FR')}
      </div>
    </motion.div>
  );
}