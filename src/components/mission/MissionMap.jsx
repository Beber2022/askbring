import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigation, MapPin as MapPinIcon } from 'lucide-react';

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

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function MissionMap({ mission, height = '400px', showLiveIndicator = true }) {
  const [intervenantLocation, setIntervenantLocation] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (!mission?.intervenant_email) return;

    const loadLocation = async () => {
      try {
        const locations = await base44.entities.IntervenantLocation.filter({
          user_email: mission.intervenant_email
        });
        if (locations.length > 0) {
          setIntervenantLocation(locations[0]);
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.error('Error loading location:', error);
      }
    };

    // Load immediately
    loadLocation();

    // Poll every 10 seconds
    const interval = setInterval(loadLocation, 10000);
    return () => clearInterval(interval);
  }, [mission?.intervenant_email]);

  const defaultCenter = [48.8566, 2.3522]; // Paris
  const mapCenter = intervenantLocation 
    ? [intervenantLocation.latitude, intervenantLocation.longitude]
    : mission?.delivery_lat && mission?.delivery_lng
    ? [mission.delivery_lat, mission.delivery_lng]
    : defaultCenter;

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardContent className="p-0 relative">
        {showLiveIndicator && intervenantLocation && (
          <div className="absolute top-4 right-4 z-[1000]">
            <Badge className="bg-emerald-500 text-white shadow-lg flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              EN DIRECT
              {lastUpdate && (
                <span className="text-xs opacity-80">
                  • Mis à jour il y a {Math.floor((new Date() - lastUpdate) / 1000)}s
                </span>
              )}
            </Badge>
          </div>
        )}

        <div style={{ height }}>
          <MapContainer
            center={mapCenter}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
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
                  <div className="text-center p-2">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Navigation className="w-4 h-4 text-emerald-600" />
                      <p className="font-semibold text-gray-900">{mission.intervenant_name}</p>
                    </div>
                    <p className="text-sm text-gray-600">Votre intervenant</p>
                    <Badge className="mt-2 bg-emerald-100 text-emerald-700 text-xs">
                      En déplacement
                    </Badge>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Delivery marker */}
            {mission?.delivery_lat && mission?.delivery_lng && (
              <Marker 
                position={[mission.delivery_lat, mission.delivery_lng]}
                icon={deliveryIcon}
              >
                <Popup>
                  <div className="text-center p-2">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <MapPinIcon className="w-4 h-4 text-red-600" />
                      <p className="font-semibold text-gray-900">Destination</p>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{mission.delivery_address}</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {!intervenantLocation && mission?.intervenant_email && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[999]">
            <div className="bg-white rounded-xl p-4 shadow-xl text-center">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-600">Localisation de l'intervenant...</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}