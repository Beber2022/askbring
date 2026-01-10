import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Clock, MapPin, AlertCircle, TrendingUp, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function NextMissionETA({ user, userLocation }) {
  const [nextMission, setNextMission] = useState(null);
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNextMission();
  }, [user, userLocation]);

  const loadNextMission = async () => {
    try {
      // Get next mission that's accepted or in_progress
      const missions = await base44.entities.Mission.filter({
        intervenant_email: user?.email,
        status: { $in: ['accepted', 'in_progress', 'shopping', 'delivering'] }
      }, 'created_date', 5);

      // Find the first not yet completed
      let next = null;
      for (const mission of missions) {
        if (!['completed', 'cancelled'].includes(mission.status)) {
          next = mission;
          break;
        }
      }

      if (next && userLocation && next.delivery_lat && next.delivery_lng) {
        const dist = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          next.delivery_lat,
          next.delivery_lng
        );
        setDistance(dist);

        // Calculate ETA based on current position and average speed
        const estimatedMinutes = calculateETA(
          userLocation.latitude,
          userLocation.longitude,
          next.delivery_lat,
          next.delivery_lng,
          18 // 18 km/h average speed
        );
        setEta(estimatedMinutes);
        setNextMission(next);
      }
    } catch (error) {
      console.error('Error loading next mission:', error);
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

  const calculateETA = (lat1, lon1, lat2, lon2, speed = 18) => {
    const distance = calculateDistance(lat1, lon1, lat2, lon2);
    const timeInHours = distance / speed;
    const minutes = Math.round(timeInHours * 60);
    return minutes;
  };

  if (loading || !nextMission) {
    return null;
  }

  const statusLabels = {
    accepted: 'À commencer',
    in_progress: 'En cours',
    shopping: 'En courses',
    delivering: 'En livraison'
  };

  const statusColors = {
    accepted: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-purple-100 text-purple-700',
    shopping: 'bg-indigo-100 text-indigo-700',
    delivering: 'bg-emerald-100 text-emerald-700'
  };

  const isVeryClose = distance < 0.5;
  const isClose = distance < 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className={`border-0 shadow-lg ${isVeryClose ? 'ring-2 ring-emerald-500' : ''}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-emerald-600" />
              Prochaine mission
            </CardTitle>
            <Badge className={statusColors[nextMission.status]}>
              {statusLabels[nextMission.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Alert for very close missions */}
          {isVeryClose && (
            <Alert className="border-emerald-200 bg-emerald-50">
              <Navigation className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-700">
                Vous êtes très proche ! Moins de 500 mètres.
              </AlertDescription>
            </Alert>
          )}

          {/* Mission Info */}
          <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 font-medium">Magasin</p>
                <p className="text-lg font-semibold text-gray-900">{nextMission.store_name}</p>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600 font-medium">Livraison</p>
                  <p className="text-sm text-gray-700">{nextMission.delivery_address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ETA Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className={`p-3 rounded-lg text-center ${isClose ? 'bg-emerald-100 border-2 border-emerald-500' : 'bg-emerald-50'}`}>
              <div className="flex items-center justify-center gap-1 mb-1">
                <MapPin className={`w-4 h-4 ${isClose ? 'text-emerald-700' : 'text-emerald-600'}`} />
              </div>
              <div className={`text-lg font-bold ${isClose ? 'text-emerald-700' : 'text-emerald-600'}`}>
                {distance.toFixed(1)} km
              </div>
              <div className="text-xs text-gray-600">Distance</div>
            </div>

            <div className={`p-3 rounded-lg text-center ${isClose ? 'bg-blue-100 border-2 border-blue-500' : 'bg-blue-50'}`}>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className={`w-4 h-4 ${isClose ? 'text-blue-700' : 'text-blue-600'}`} />
              </div>
              <div className={`text-lg font-bold ${isClose ? 'text-blue-700' : 'text-blue-600'}`}>
                {eta} min
              </div>
              <div className="text-xs text-gray-600">ETA</div>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-lg font-bold text-purple-600">
                {nextMission.shopping_list?.length || 0}
              </div>
              <div className="text-xs text-gray-600">Articles</div>
            </div>
          </div>

          {/* Tips */}
          {nextMission.notes && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700 font-medium mb-1">Notes du client:</p>
              <p className="text-sm text-amber-800">{nextMission.notes.substring(0, 100)}{nextMission.notes.length > 100 ? '...' : ''}</p>
            </div>
          )}

          {/* Estimated delivery time */}
          <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
            <p className="text-xs text-emerald-600 font-medium mb-1">Estimé pour la livraison</p>
            <p className="text-sm font-semibold text-emerald-700">
              {new Date(Date.now() + eta * 60000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}