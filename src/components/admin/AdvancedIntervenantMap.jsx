import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { 
  MapPin, 
  History, 
  Shield, 
  Filter, 
  RefreshCw,
  Eye,
  EyeOff,
  Clock,
  Navigation,
  AlertTriangle
} from 'lucide-react';

const activeIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxNiIgZmlsbD0iIzEwYjk4MSIvPjwvc3ZnPg==',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15]
});

const inactiveIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxNiIgZmlsbD0iIzljOWNhYyIvPjwvc3ZnPg==',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15]
});

const deliveryIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxNiIgZmlsbD0iI2VmNDQ0NCIvPjwvc3ZnPg==',
  iconSize: [25, 25],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

// Zones prédéfinies (geofencing)
const GEOFENCE_ZONES = [
  { id: 'zone1', name: 'Centre-ville', lat: 48.8566, lng: 2.3522, radius: 2000, color: '#3b82f6' },
  { id: 'zone2', name: 'Zone Nord', lat: 48.8800, lng: 2.3522, radius: 1500, color: '#10b981' },
  { id: 'zone3', name: 'Zone Sud', lat: 48.8330, lng: 2.3522, radius: 1500, color: '#f59e0b' },
  { id: 'zone4', name: 'Zone Est', lat: 48.8566, lng: 2.3900, radius: 1500, color: '#8b5cf6' }
];

function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

export default function AdvancedIntervenantMap({ locations, missions }) {
  const [showHistory, setShowHistory] = useState(false);
  const [showGeofences, setShowGeofences] = useState(true);
  const [selectedIntervenant, setSelectedIntervenant] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMission, setFilterMission] = useState('all');
  const [filterZone, setFilterZone] = useState('all');
  const [zoneAlerts, setZoneAlerts] = useState([]);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(12);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedIntervenant) {
      loadLocationHistory(selectedIntervenant);
    }
  }, [selectedIntervenant]);

  useEffect(() => {
    checkGeofenceAlerts();
  }, [locations]);

  const loadLocationHistory = async (email) => {
    try {
      const history = await base44.entities.LocationHistory.filter(
        { user_email: email },
        '-created_date',
        100
      );
      setLocationHistory(history);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const checkGeofenceAlerts = () => {
    const alerts = [];
    
    locations.forEach(location => {
      GEOFENCE_ZONES.forEach(zone => {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          zone.lat,
          zone.lng
        );
        
        const isInZone = distance * 1000 <= zone.radius;
        
        if (isInZone && location.is_available) {
          alerts.push({
            intervenant: location.user_name,
            zone: zone.name,
            type: 'in_zone'
          });
        }
      });
    });
    
    setZoneAlerts(alerts);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getFilteredLocations = () => {
    let filtered = locations;

    if (filterStatus === 'active') {
      filtered = filtered.filter(l => l.is_available);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(l => !l.is_available);
    }

    if (filterMission === 'with_mission') {
      filtered = filtered.filter(l => missions.some(m => m.intervenant_email === l.user_email));
    } else if (filterMission === 'no_mission') {
      filtered = filtered.filter(l => !missions.some(m => m.intervenant_email === l.user_email));
    }

    if (filterZone !== 'all') {
      const zone = GEOFENCE_ZONES.find(z => z.id === filterZone);
      if (zone) {
        filtered = filtered.filter(l => {
          const distance = calculateDistance(l.latitude, l.longitude, zone.lat, zone.lng);
          return distance * 1000 <= zone.radius;
        });
      }
    }

    return filtered;
  };

  const handleIntervenantClick = (location) => {
    setSelectedIntervenant(location.user_email);
    setShowHistory(true);
    setMapCenter([location.latitude, location.longitude]);
    setMapZoom(14);
  };

  const filteredLocations = getFilteredLocations();
  const validLocations = filteredLocations.filter(l => l.latitude && l.longitude);

  if (!locations || locations.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune localisation disponible</p>
        </CardContent>
      </Card>
    );
  }

  const defaultCenter = validLocations.length > 0
    ? [
        validLocations.reduce((sum, l) => sum + l.latitude, 0) / validLocations.length,
        validLocations.reduce((sum, l) => sum + l.longitude, 0) / validLocations.length
      ]
    : [48.8566, 2.3522];

  return (
    <div className="space-y-4">
      {/* Filtres et contrôles */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtres et Options
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <History className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGeofences(!showGeofences)}
              >
                {showGeofences ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <Shield className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Statut</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actifs uniquement</SelectItem>
                  <SelectItem value="inactive">Inactifs uniquement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Mission</label>
              <Select value={filterMission} onValueChange={setFilterMission}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes missions</SelectItem>
                  <SelectItem value="with_mission">Avec mission</SelectItem>
                  <SelectItem value="no_mission">Sans mission</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Zone</label>
              <Select value={filterZone} onValueChange={setFilterZone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les zones</SelectItem>
                  {GEOFENCE_ZONES.map(zone => (
                    <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {zoneAlerts.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Alertes zones actives ({zoneAlerts.length})
              </p>
              <div className="space-y-1">
                {zoneAlerts.slice(0, 3).map((alert, i) => (
                  <p key={i} className="text-xs text-blue-600">
                    • {alert.intervenant} est dans {alert.zone}
                  </p>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Carte */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardContent className="p-0 h-[600px]">
          <MapContainer
            center={mapCenter || defaultCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
          >
            <MapUpdater center={mapCenter} zoom={mapZoom} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />

            {/* Zones de geofencing */}
            {showGeofences && GEOFENCE_ZONES.map(zone => (
              <Circle
                key={zone.id}
                center={[zone.lat, zone.lng]}
                radius={zone.radius}
                pathOptions={{
                  color: zone.color,
                  fillColor: zone.color,
                  fillOpacity: 0.1,
                  weight: 2
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <h4 className="font-semibold mb-1">🛡️ {zone.name}</h4>
                    <p className="text-xs text-gray-600">Rayon: {zone.radius}m</p>
                  </div>
                </Popup>
              </Circle>
            ))}

            {/* Historique de position */}
            {showHistory && selectedIntervenant && locationHistory.length > 1 && (
              <Polyline
                positions={locationHistory.map(h => [h.latitude, h.longitude])}
                pathOptions={{
                  color: '#6366f1',
                  weight: 3,
                  opacity: 0.7,
                  dashArray: '10, 10'
                }}
              />
            )}

            {/* Points de l'historique */}
            {showHistory && selectedIntervenant && locationHistory.map((point, index) => (
              <CircleMarker
                key={point.id}
                center={[point.latitude, point.longitude]}
                radius={4}
                pathOptions={{
                  color: '#6366f1',
                  fillColor: '#6366f1',
                  fillOpacity: 0.8
                }}
              >
                <Popup>
                  <div className="text-xs">
                    <p className="font-semibold">Point #{locationHistory.length - index}</p>
                    <p className="text-gray-600">
                      {new Date(point.created_date).toLocaleString('fr-FR')}
                    </p>
                    {point.speed && <p>Vitesse: {(point.speed * 3.6).toFixed(1)} km/h</p>}
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* Intervenants */}
            {validLocations.map(location => {
              const assignedMission = missions.find(m => m.intervenant_email === location.user_email);
              const icon = location.is_available ? activeIcon : inactiveIcon;

              return (
                <React.Fragment key={location.id}>
                  <Marker
                    position={[location.latitude, location.longitude]}
                    icon={icon}
                    eventHandlers={{
                      click: () => handleIntervenantClick(location)
                    }}
                  >
                    <Popup>
                      <div className="text-sm space-y-2 min-w-[250px]">
                        <div>
                          <h4 className="font-semibold text-gray-900">{location.user_name}</h4>
                          <Badge className={location.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}>
                            {location.is_available ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>

                        <div className="text-xs space-y-1">
                          <p className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Mis à jour: {new Date(location.updated_date).toLocaleTimeString('fr-FR')}
                          </p>
                        </div>

                        {assignedMission && (
                          <div className="border-t pt-2 space-y-2">
                            <div className="bg-blue-50 p-2 rounded">
                              <p className="text-xs font-medium text-blue-700">📍 Mission</p>
                              <p className="font-semibold text-gray-900 text-xs">{assignedMission.store_name}</p>
                              <Badge className="text-xs mt-1">
                                {assignedMission.status}
                              </Badge>
                            </div>
                          </div>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => handleIntervenantClick(location)}
                        >
                          <History className="w-3 h-3 mr-2" />
                          Voir historique
                        </Button>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Points de livraison */}
                  {assignedMission && assignedMission.delivery_lat && assignedMission.delivery_lng && (
                    <Marker
                      position={[assignedMission.delivery_lat, assignedMission.delivery_lng]}
                      icon={deliveryIcon}
                    >
                      <Popup>
                        <div className="text-sm">
                          <h4 className="font-semibold mb-1">🎯 Livraison</h4>
                          <p className="text-xs text-gray-600">{assignedMission.delivery_address}</p>
                          <p className="text-xs text-gray-500 mt-1">Client: {assignedMission.client_name}</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </React.Fragment>
              );
            })}
          </MapContainer>
        </CardContent>
      </Card>

      {/* Stats rapides */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-0 shadow">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Intervenants affichés</p>
            <p className="text-2xl font-bold text-gray-900">{filteredLocations.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">En mission</p>
            <p className="text-2xl font-bold text-emerald-600">
              {filteredLocations.filter(l => missions.some(m => m.intervenant_email === l.user_email)).length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Alertes zones</p>
            <p className="text-2xl font-bold text-blue-600">{zoneAlerts.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Historique affiché</p>
            <p className="text-2xl font-bold text-indigo-600">
              {showHistory && locationHistory.length > 0 ? locationHistory.length : 0}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}