import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Clock, CheckCircle, AlertCircle, MapPin, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useNotifications } from '@/components/notifications/NotificationProvider';

const statusConfig = {
  pending: { icon: MapPin, color: '#EAB308', label: 'En attente', bgColor: '#FEF3C7' },
  accepted: { icon: Clock, color: '#3B82F6', label: 'Acceptée', bgColor: '#DBEAFE' },
  in_progress: { icon: Clock, color: '#8B5CF6', label: 'En cours', bgColor: '#EDE9FE' },
  delivering: { icon: Clock, color: '#10B981', label: 'En livraison', bgColor: '#D1FAE5' },
  completed: { icon: CheckCircle, color: '#06B6D4', label: 'Terminée', bgColor: '#CFFAFE' },
  late: { icon: AlertCircle, color: '#EF4444', label: 'En retard', bgColor: '#FEE2E2' }
};

export default function IntervenantMapDashboard({ user, missions }) {
  const [userLocation, setUserLocation] = useState(null);
  const [activeMissions, setActiveMissions] = useState([]);
  const [selectedMission, setSelectedMission] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { showNotification } = useNotifications();

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserLocation(location);

          // Update intervenant location in database
          updateIntervenantLocation(location);
        },
        (error) => console.log('Geolocation error:', error),
        { enableHighAccuracy: true, maximumAge: 30000 }
      );
    }

    // Filter active missions
    const active = missions.filter(m => 
      ['accepted', 'in_progress', 'delivering'].includes(m.status)
    );
    setActiveMissions(active);
  }, [missions]);

  const updateIntervenantLocation = async (location) => {
    try {
      // Update or create intervenant location record
      const existing = await base44.entities.IntervenantLocation.filter({
        user_email: user.email
      });

      if (existing.length > 0) {
        await base44.entities.IntervenantLocation.update(existing[0].id, {
          latitude: location.latitude,
          longitude: location.longitude,
          user_name: user.full_name
        });
      } else {
        await base44.entities.IntervenantLocation.create({
          user_email: user.email,
          user_name: user.full_name,
          latitude: location.latitude,
          longitude: location.longitude
        });
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const updateMissionStatus = async (mission, newStatus) => {
    setLoading(true);
    try {
      const updateData = { status: newStatus };
      
      if (newStatus === 'completed') {
        updateData.completed_time = new Date().toISOString();
      }

      await base44.entities.Mission.update(mission.id, updateData);
      
      // Update local state
      setActiveMissions(prev => prev.map(m => 
        m.id === mission.id ? { ...m, status: newStatus } : m
      ));

      // Notify client
      showNotification('Statut de mission mis à jour', {
        body: `${mission.store_name} - ${statusConfig[newStatus].label}`,
        type: 'statusUpdate'
      });

      // Create notification in database
      await base44.entities.Notification.create({
        user_email: mission.client_email,
        title: `Statut de mission: ${statusConfig[newStatus].label}`,
        message: `Votre mission au ${mission.store_name} est maintenant ${statusConfig[newStatus].label.toLowerCase()}`,
        type: 'mission_update',
        mission_id: mission.id
      });

      toast({
        title: 'Statut mis à jour',
        description: `Mission marquée comme ${statusConfig[newStatus].label}`
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsLate = async (mission) => {
    await updateMissionStatus(mission, 'late');
  };

  if (!userLocation) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 text-emerald-600 animate-spin mr-2" />
          <span className="text-gray-600">Localisation en cours...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            Carte des missions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl overflow-hidden h-[500px] border border-gray-200">
            <MapContainer
              center={[userLocation.latitude, userLocation.longitude]}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />

              {/* User Location */}
              <Marker
                position={[userLocation.latitude, userLocation.longitude]}
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
                  <div className="text-sm font-medium">Vous êtes ici</div>
                </Popup>
              </Marker>

              {/* Coverage Area */}
              <Circle
                center={[userLocation.latitude, userLocation.longitude]}
                radius={5000}
                color="emerald"
                fillColor="emerald"
                fillOpacity={0.1}
              />

              {/* Missions */}
              {activeMissions.map((mission) => {
                if (!mission.delivery_lat || !mission.delivery_lng) return null;
                
                const statusInfo = statusConfig[mission.status] || statusConfig.pending;
                
                return (
                  <Marker
                    key={mission.id}
                    position={[mission.delivery_lat, mission.delivery_lng]}
                    icon={L.icon({
                      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${
                        mission.status === 'completed' ? 'blue' : 
                        mission.status === 'delivering' ? 'green' : 
                        'orange'
                      }.png`,
                      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                      popupAnchor: [1, -34],
                      shadowSize: [41, 41]
                    })}
                    onClick={() => setSelectedMission(mission)}
                  >
                    <Popup>
                      <div className="w-48">
                        <p className="font-semibold text-gray-900">{mission.store_name}</p>
                        <p className="text-sm text-gray-600">{mission.client_name}</p>
                        <Badge className="mt-1" style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color }}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Mission Status Manager */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            Missions actives ({activeMissions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeMissions.map((mission) => {
              const statusInfo = statusConfig[mission.status] || statusConfig.pending;
              
              return (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{mission.store_name}</h3>
                      <p className="text-sm text-gray-600">{mission.client_name}</p>
                      <p className="text-xs text-gray-500 mt-1">{mission.delivery_address}</p>
                    </div>
                    <Badge style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color }}>
                      {statusInfo.label}
                    </Badge>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {mission.status === 'accepted' && (
                      <Button
                        size="sm"
                        onClick={() => updateMissionStatus(mission, 'in_progress')}
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        Démarrer
                      </Button>
                    )}

                    {['in_progress', 'accepted'].includes(mission.status) && (
                      <Button
                        size="sm"
                        onClick={() => updateMissionStatus(mission, 'delivering')}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <MapPin className="w-3 h-3 mr-1" />
                        En livraison
                      </Button>
                    )}

                    {['delivering', 'in_progress'].includes(mission.status) && (
                      <Button
                        size="sm"
                        onClick={() => updateMissionStatus(mission, 'completed')}
                        disabled={loading}
                        className="bg-cyan-600 hover:bg-cyan-700"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Terminée
                      </Button>
                    )}

                    {['in_progress', 'delivering'].includes(mission.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsLate(mission)}
                        disabled={loading}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Signaler retard
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {activeMissions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Aucune mission active pour le moment</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}