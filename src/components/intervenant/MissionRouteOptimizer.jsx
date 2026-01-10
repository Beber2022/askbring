import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Route, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function MissionRouteOptimizer({ missions, userLocation }) {
  const [optimizedRoute, setOptimizedRoute] = useState([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    if (missions.length > 0 && userLocation) {
      optimizeRoute();
    }
  }, [missions, userLocation]);

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

  const optimizeRoute = () => {
    const missionsWithDistance = missions
      .filter(m => m.delivery_lat && m.delivery_lng)
      .map(mission => ({
        ...mission,
        distanceFromUser: calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          mission.delivery_lat,
          mission.delivery_lng
        )
      }))
      .sort((a, b) => a.distanceFromUser - b.distanceFromUser);

    let totalDist = 0;
    let totalMin = 0;
    const newWarnings = [];

    const route = missionsWithDistance.map((mission, index) => {
      let prevLat = userLocation.latitude;
      let prevLng = userLocation.longitude;

      if (index > 0) {
        prevLat = missionsWithDistance[index - 1].delivery_lat;
        prevLng = missionsWithDistance[index - 1].delivery_lng;
      }

      const distance = calculateDistance(prevLat, prevLng, mission.delivery_lat, mission.delivery_lng);
      const travelTime = Math.round((distance / 5) * 20 + 5);
      const shoppingTime = Math.round((mission.shopping_list?.length || 0) * 3 + 10);

      totalDist += distance;
      totalMin += travelTime + shoppingTime;

      if (distance > 10) {
        newWarnings.push(`Mission ${index + 1}: Distance importante (${distance.toFixed(1)}km)`);
      }

      return {
        ...mission,
        order: index + 1,
        distance: distance.toFixed(1),
        travelTime,
        shoppingTime,
        totalTime: travelTime + shoppingTime
      };
    });

    setOptimizedRoute(route);
    setTotalDistance(totalDist.toFixed(1));
    setTotalTime(totalMin);
    setWarnings(newWarnings);
  };

  if (optimizedRoute.length === 0) {
    return null;
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Route className="w-5 h-5 text-blue-600" />
            Route optimisée
          </CardTitle>
          <Badge className="bg-blue-600">
            {optimizedRoute.length} mission{optimizedRoute.length > 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-white/60 rounded-lg backdrop-blur">
          <div className="text-center">
            <p className="text-xs text-gray-600 font-medium">Distance totale</p>
            <p className="text-lg font-bold text-blue-600">{totalDistance} km</p>
          </div>
          <div className="text-center border-l border-r border-gray-200">
            <p className="text-xs text-gray-600 font-medium">Temps estimé</p>
            <p className="text-lg font-bold text-blue-600">
              {Math.floor(totalTime / 60)}h{totalTime % 60}m
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 font-medium">Km par mission</p>
            <p className="text-lg font-bold text-blue-600">
              {(totalDistance / optimizedRoute.length).toFixed(1)} km
            </p>
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                {warnings.map((warning, idx) => (
                  <p key={idx} className="text-xs text-amber-700">{warning}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Route Timeline */}
        <div className="space-y-2">
          {optimizedRoute.map((mission, index) => (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-400 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    {mission.order}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{mission.store_name}</h4>
                    <p className="text-xs text-gray-500">{mission.delivery_address}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 text-xs">
                {index > 0 && (
                  <Badge variant="outline" className="bg-blue-50">
                    <MapPin className="w-3 h-3 mr-1" />
                    {mission.distance}km • {mission.travelTime}m
                  </Badge>
                )}
                <Badge variant="outline" className="bg-indigo-50">
                  <Clock className="w-3 h-3 mr-1" />
                  {mission.shoppingTime}m courses
                </Badge>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pro Tip */}
        <div className="p-3 bg-white/60 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700">
            <CheckCircle className="w-3 h-3 inline mr-1" />
            Cette route est optimisée pour minimiser la distance. Acceptez les missions dans cet ordre pour maximiser vos gains !
          </p>
        </div>
      </CardContent>
    </Card>
  );
}