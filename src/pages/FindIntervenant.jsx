import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Star, 
  Navigation,
  Zap,
  Car,
  Bike,
  Bus,
  Award,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icon for available intervenants
const createIntervenantIcon = (isOnline) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position: relative;">
        <div style="
          width: 40px;
          height: 40px;
          background: ${isOnline ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#9ca3af'};
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        ${isOnline ? `
          <div style="
            position: absolute;
            top: -2px;
            right: -2px;
            width: 12px;
            height: 12px;
            background: #10b981;
            border: 2px solid white;
            border-radius: 50%;
            animation: pulse 2s infinite;
          "></div>
        ` : ''}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
};

const transportIcons = {
  'vélo': Bike,
  'voiture': Car,
  'bus': Bus,
  'moto': Car,
  'trottinette': Bike,
  'à pied': Navigation
};

export default function FindIntervenant() {
  const [intervenants, setIntervenants] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchRadius, setSearchRadius] = useState(5);
  const [mapCenter, setMapCenter] = useState([48.8566, 2.3522]); // Paris default

  useEffect(() => {
    loadData();
    // Refresh every 15 seconds
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserLocation(location);
          setMapCenter([location.latitude, location.longitude]);
        },
        (error) => console.log('Geolocation error:', error)
      );
    }
  }, []);

  const loadData = async () => {
    try {
      // Get all available intervenants
      const locations = await base44.entities.IntervenantLocation.filter(
        { is_available: true },
        '-updated_date'
      );

      // Get user details for each intervenant
      const intervenantsWithDetails = await Promise.all(
        locations.map(async (loc) => {
          const users = await base44.entities.User.filter({ email: loc.user_email });
          const user = users[0] || {};
          return {
            ...loc,
            full_name: user.full_name || loc.user_name,
            average_rating: user.average_rating || 0,
            total_missions: user.total_missions || 0,
            transport_type: user.transport_type || '',
            bio: user.bio || ''
          };
        })
      );

      setIntervenants(intervenantsWithDetails);
    } catch (error) {
      console.error('Error loading intervenants:', error);
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

  const filteredIntervenants = userLocation
    ? intervenants.filter(int => {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          int.latitude,
          int.longitude
        );
        return distance <= searchRadius;
      })
    : intervenants;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Intervenants à proximité</h1>
              <p className="text-gray-600 text-sm">
                {filteredIntervenants.length} intervenant(s) disponible(s)
              </p>
            </div>
            <div className="flex items-center gap-4">
              {userLocation && (
                <div className="flex items-center gap-3">
                  <Label className="text-sm whitespace-nowrap">Rayon: {searchRadius} km</Label>
                  <Slider
                    value={[searchRadius]}
                    onValueChange={(value) => setSearchRadius(value[0])}
                    min={1}
                    max={20}
                    step={1}
                    className="w-32"
                  />
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Actualiser
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Map and List */}
      <div className="flex-1 grid lg:grid-cols-3">
        {/* Map */}
        <div className="lg:col-span-2 relative">
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* User location circle */}
            {userLocation && (
              <>
                <Circle
                  center={[userLocation.latitude, userLocation.longitude]}
                  radius={searchRadius * 1000}
                  pathOptions={{
                    color: '#10b981',
                    fillColor: '#10b981',
                    fillOpacity: 0.1
                  }}
                />
                <Marker
                  position={[userLocation.latitude, userLocation.longitude]}
                  icon={L.divIcon({
                    className: 'custom-marker',
                    html: `
                      <div style="
                        width: 20px;
                        height: 20px;
                        background: #3b82f6;
                        border: 3px solid white;
                        border-radius: 50%;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                      "></div>
                    `,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10],
                  })}
                >
                  <Popup>
                    <div className="p-2">
                      <p className="font-semibold">Votre position</p>
                    </div>
                  </Popup>
                </Marker>
              </>
            )}

            {/* Intervenant markers */}
            {filteredIntervenants.map((int) => (
              <Marker
                key={int.id}
                position={[int.latitude, int.longitude]}
                icon={createIntervenantIcon(int.is_available)}
              >
                <Popup>
                  <div className="p-3 min-w-[250px]">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-emerald-100 text-emerald-700">
                          {int.full_name?.charAt(0) || 'I'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900">{int.full_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            <Zap className="w-3 h-3 mr-1" />
                            Disponible
                          </Badge>
                          {int.transport_type && (
                            <Badge variant="outline" className="text-xs">
                              {int.transport_type}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {int.average_rating > 0 && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{int.average_rating.toFixed(1)}</span>
                        <span className="text-gray-400">•</span>
                        <span>{int.total_missions} missions</span>
                      </div>
                    )}
                    {int.bio && (
                      <p className="text-sm text-gray-600 mt-2">{int.bio}</p>
                    )}
                    {userLocation && (
                      <p className="text-xs text-gray-500 mt-2">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        {calculateDistance(
                          userLocation.latitude,
                          userLocation.longitude,
                          int.latitude,
                          int.longitude
                        ).toFixed(1)} km
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-[1000]">
            <h4 className="font-semibold text-sm mb-2">Légende</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                <span>Votre position</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                <span>Intervenant disponible</span>
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="bg-gray-50 overflow-y-auto border-l">
          <div className="p-4 space-y-4">
            {filteredIntervenants.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <MapPin className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Aucun intervenant disponible
                  </h3>
                  <p className="text-gray-500 text-center text-sm">
                    Augmentez le rayon de recherche ou réessayez plus tard
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredIntervenants.map((int) => {
                const TransportIcon = transportIcons[int.transport_type] || Navigation;
                const distance = userLocation
                  ? calculateDistance(
                      userLocation.latitude,
                      userLocation.longitude,
                      int.latitude,
                      int.longitude
                    ).toFixed(1)
                  : null;

                return (
                  <motion.div
                    key={int.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-emerald-100 text-emerald-700">
                              {int.full_name?.charAt(0) || 'I'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {int.full_name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge className="bg-green-100 text-green-700 text-xs">
                                <Zap className="w-3 h-3 mr-1" />
                                En ligne
                              </Badge>
                              {distance && (
                                <Badge variant="outline" className="text-xs">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {distance} km
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {int.average_rating > 0 && (
                          <div className="flex items-center gap-3 mb-2 text-sm">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-medium">{int.average_rating.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-500">
                              <Award className="w-4 h-4" />
                              <span>{int.total_missions} missions</span>
                            </div>
                          </div>
                        )}

                        {int.transport_type && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <TransportIcon className="w-4 h-4" />
                            <span>{int.transport_type}</span>
                          </div>
                        )}

                        {int.bio && (
                          <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                            {int.bio}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}