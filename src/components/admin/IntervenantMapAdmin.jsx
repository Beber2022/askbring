import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const defaultIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

const activeIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxNiIgZmlsbD0iIzEwYjk4MSIvPjwvc3ZnPg==',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
  tooltipAnchor: [16, -28]
});

const inactiveIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxNiIgZmlsbD0iIzljOWNhYyIvPjwvc3ZnPg==',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
  tooltipAnchor: [16, -28]
});

export default function IntervenantMapAdmin({ locations, missions }) {
  if (!locations || locations.length === 0) {
    return (
      <Card className="border-0 shadow-lg h-96 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Aucune localisation disponible</p>
        </div>
      </Card>
    );
  }

  // Calculer le centre de la carte (moyenne des latitudes/longitudes)
  const validLocations = locations.filter(l => l.latitude && l.longitude);
  if (validLocations.length === 0) {
    return (
      <Card className="border-0 shadow-lg h-96 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Données de localisation invalides</p>
        </div>
      </Card>
    );
  }

  const centerLat = validLocations.reduce((sum, l) => sum + l.latitude, 0) / validLocations.length;
  const centerLng = validLocations.reduce((sum, l) => sum + l.longitude, 0) / validLocations.length;

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardContent className="p-0 h-96">
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          {/* Afficher les intervenants */}
          {validLocations.map((location) => {
            const assignedMission = missions.find(m => m.intervenant_email === location.user_email);
            const icon = location.is_available ? activeIcon : inactiveIcon;

            return (
              <React.Fragment key={location.id}>
                {/* Marker de l'intervenant */}
                <Marker
                  position={[location.latitude, location.longitude]}
                  icon={icon}
                >
                  <Popup className="w-72">
                    <div className="text-sm space-y-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{location.user_name}</h4>
                        <Badge className={location.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}>
                          {location.is_available ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                      
                      {assignedMission && (
                        <div className="border-t pt-2 space-y-2">
                          <div className="bg-blue-50 p-2 rounded">
                            <p className="text-xs font-medium text-blue-700 mb-1">📍 Mission en cours</p>
                            <p className="font-semibold text-gray-900">{assignedMission.store_name}</p>
                            <p className="text-xs text-gray-600 mt-1">Client: {assignedMission.client_name}</p>
                          </div>
                          
                          <div className="bg-emerald-50 p-2 rounded">
                            <p className="text-xs font-medium text-emerald-700 mb-1">🎯 Adresse de livraison</p>
                            <p className="text-xs text-gray-600">{assignedMission.delivery_address}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-yellow-50 p-2 rounded">
                              <p className="text-xs font-medium text-yellow-700">📦 Articles</p>
                              <p className="text-sm font-bold text-gray-900">{assignedMission.shopping_list?.length || 0}</p>
                            </div>
                            <div className="bg-purple-50 p-2 rounded">
                              <p className="text-xs font-medium text-purple-700">💰 Rémunération</p>
                              <p className="text-sm font-bold text-gray-900">{(assignedMission.service_fee || 0).toFixed(2)}€</p>
                            </div>
                          </div>

                          <Badge className="text-xs">
                            Statut: {assignedMission.status === 'accepted' ? '✅ Acceptée' : 
                                    assignedMission.status === 'in_progress' ? '🛒 En courses' :
                                    assignedMission.status === 'shopping' ? '🛒 Courses' : '🚗 En livraison'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>

                {/* Cercle de couverture pour les actifs */}
                {location.is_available && (
                  <CircleMarker
                    center={[location.latitude, location.longitude]}
                    radius={500}
                    weight={1}
                    color="#10b981"
                    fillColor="#10b981"
                    fillOpacity={0.1}
                  />
                )}

                {/* Marker pour la livraison si mission en cours */}
                {assignedMission && assignedMission.delivery_lat && assignedMission.delivery_lng && (
                  <Marker
                    position={[assignedMission.delivery_lat, assignedMission.delivery_lng]}
                    icon={defaultIcon}
                  >
                    <Popup>
                      <div className="text-sm">
                        <h4 className="font-semibold mb-1">🎯 Point de livraison</h4>
                        <p className="text-gray-600 text-xs">{assignedMission.delivery_address}</p>
                        <p className="text-xs text-gray-500 mt-2">Magasin: {assignedMission.store_name}</p>
                        <p className="text-xs text-gray-500">Client: {assignedMission.client_name}</p>
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
  );
}