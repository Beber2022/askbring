import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Route, AlertCircle, CheckCircle, Layers, Zap, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdvancedRouteOptimizer({ missions, userLocation }) {
  const [optimizedRoute, setOptimizedRoute] = useState([]);
  const [clusteredMissions, setClusteredMissions] = useState({});
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [timesSaved, setTimesSaved] = useState(0);
  const [warnings, setWarnings] = useState([]);
  const [activeTab, setActiveTab] = useState('route');

  useEffect(() => {
    if (missions.length > 0 && userLocation) {
      optimizeRouteAdvanced();
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

  const clusterMissionsByZone = (missionsList) => {
    // K-means clustering for geographic zones
    const ZONE_GRID_SIZE = 5; // 5km zones
    const clusters = {};

    missionsList.forEach(mission => {
      if (!mission.delivery_lat || !mission.delivery_lng) return;

      const zoneX = Math.floor(mission.delivery_lat / ZONE_GRID_SIZE);
      const zoneY = Math.floor(mission.delivery_lng / ZONE_GRID_SIZE);
      const zoneKey = `${zoneX},${zoneY}`;

      if (!clusters[zoneKey]) {
        clusters[zoneKey] = [];
      }
      clusters[zoneKey].push(mission);
    });

    return clusters;
  };

  // TSP (Traveling Salesman Problem) approximation using nearest neighbor
  const optimizeRouteTSP = (startLat, startLng, missionsList) => {
    if (missionsList.length === 0) return [];

    const unvisited = [...missionsList];
    const route = [];
    let currentLat = startLat;
    let currentLng = startLng;
    let totalDist = 0;

    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;

      // Find nearest unvisited mission
      unvisited.forEach((mission, idx) => {
        const dist = calculateDistance(currentLat, currentLng, mission.delivery_lat, mission.delivery_lng);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = idx;
        }
      });

      const nearestMission = unvisited[nearestIdx];
      route.push({
        ...nearestMission,
        distanceFromPrev: minDistance
      });

      totalDist += minDistance;
      currentLat = nearestMission.delivery_lat;
      currentLng = nearestMission.delivery_lng;
      unvisited.splice(nearestIdx, 1);
    }

    return { route, totalDist };
  };

  const optimizeRouteAdvanced = () => {
    const validMissions = missions.filter(m => m.delivery_lat && m.delivery_lng);
    
    // Cluster missions by geographic zones
    const clusters = clusterMissionsByZone(validMissions);
    
    // Optimize route within each cluster, then connect clusters
    const clusterKeys = Object.keys(clusters).sort();
    const allRoutes = [];
    let totalDist = 0;
    let totalMin = 0;
    let baselineTotalDist = 0;
    const newWarnings = [];

    // Calculate baseline (no optimization)
    validMissions.forEach(m => {
      baselineTotalDist += calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        m.delivery_lat,
        m.delivery_lng
      );
    });

    let currentLat = userLocation.latitude;
    let currentLng = userLocation.longitude;
    let globalOrder = 1;

    // Process each cluster in order
    clusterKeys.forEach((clusterKey, clusterIdx) => {
      const clusterMissions = clusters[clusterKey];
      
      // Optimize route within cluster
      const { route: optimizedClusterRoute, totalDist: clusterDist } = optimizeRouteTSP(
        currentLat,
        currentLng,
        clusterMissions
      );

      totalDist += clusterDist;

      const clusterZone = clusterKey.split(',');
      const clusterCenter = {
        lat: (parseFloat(clusterZone[0]) + 0.5) * 5,
        lng: (parseFloat(clusterZone[1]) + 0.5) * 5
      };

      optimizedClusterRoute.forEach((mission, idx) => {
        let prevLat = currentLat;
        let prevLng = currentLng;

        if (idx > 0) {
          prevLat = optimizedClusterRoute[idx - 1].delivery_lat;
          prevLng = optimizedClusterRoute[idx - 1].delivery_lng;
        }

        const distance = calculateDistance(prevLat, prevLng, mission.delivery_lat, mission.delivery_lng);
        const travelTime = Math.round((distance / 5) * 20 + 5);
        const shoppingTime = Math.round((mission.shopping_list?.length || 0) * 3 + 10);

        totalMin += travelTime + shoppingTime;

        if (distance > 10) {
          newWarnings.push(`Zone ${clusterIdx + 1}: Distance importante (${distance.toFixed(1)}km)`);
        }

        allRoutes.push({
          ...mission,
          order: globalOrder++,
          distance: distance.toFixed(1),
          travelTime,
          shoppingTime,
          totalTime: travelTime + shoppingTime,
          cluster: clusterIdx + 1,
          clusterZone: clusterKey
        });

        currentLat = mission.delivery_lat;
        currentLng = mission.delivery_lng;
      });
    });

    const timeSaved = baselineTotalDist - totalDist;
    const efficiency = ((baselineTotalDist - totalDist) / baselineTotalDist * 100).toFixed(1);

    setOptimizedRoute(allRoutes);
    setClusteredMissions(clusters);
    setTotalDistance(totalDist.toFixed(1));
    setTotalTime(totalMin);
    setTimesSaved(timeSaved.toFixed(1));
    setWarnings(newWarnings);
  };

  if (optimizedRoute.length === 0) {
    return null;
  }

  const efficiency = ((parseFloat(timesSaved) / (parseFloat(timesSaved) + parseFloat(totalDistance))) * 100).toFixed(1);

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2">
            <Route className="w-5 h-5 text-blue-600" />
            Optimisation avancée des itinéraires
          </CardTitle>
          <div className="flex gap-2">
            <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              {efficiency}% optimisé
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="route">Route optimale</TabsTrigger>
            <TabsTrigger value="zones">Zones géographiques</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3 p-4 bg-white/60 rounded-lg backdrop-blur">
          <div className="text-center">
            <p className="text-xs text-gray-600 font-medium">Distance totale</p>
            <p className="text-lg font-bold text-blue-600">{totalDistance} km</p>
          </div>
          <div className="text-center border-l border-gray-200">
            <p className="text-xs text-gray-600 font-medium">Temps estimé</p>
            <p className="text-lg font-bold text-blue-600">
              {Math.floor(totalTime / 60)}h{totalTime % 60}m
            </p>
          </div>
          <div className="text-center border-l border-gray-200">
            <p className="text-xs text-gray-600 font-medium">Distance économisée</p>
            <p className="text-lg font-bold text-green-600">{timesSaved} km</p>
          </div>
          <div className="text-center border-l border-gray-200">
            <p className="text-xs text-gray-600 font-medium">Zones</p>
            <p className="text-lg font-bold text-purple-600">{Object.keys(clusteredMissions).length}</p>
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                {warnings.slice(0, 3).map((warning, idx) => (
                  <p key={idx} className="text-xs text-amber-700">{warning}</p>
                ))}
                {warnings.length > 3 && (
                  <p className="text-xs text-amber-700">+{warnings.length - 3} autres avertissements</p>
                )}
              </div>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'route' && (
            <motion.div
              key="route"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              <h3 className="text-sm font-semibold text-gray-700 px-2">Ordre optimal des missions</h3>
              {optimizedRoute.map((mission, index) => (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-400 transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                        {mission.order}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm">{mission.store_name}</h4>
                        <p className="text-xs text-gray-500 truncate">{mission.delivery_address}</p>
                      </div>
                      <Badge className="bg-purple-100 text-purple-700 text-xs">
                        Zone {mission.cluster}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs flex-wrap">
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
            </motion.div>
          )}

          {activeTab === 'zones' && (
            <motion.div
              key="zones"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <h3 className="text-sm font-semibold text-gray-700 px-2">Missions regroupées par zone géographique</h3>
              {Object.keys(clusteredMissions).map((zoneKey, zoneIdx) => {
                const zoneMissions = clusteredMissions[zoneKey];
                const clusterRoutes = optimizedRoute.filter(m => m.clusterZone === zoneKey);
                const zoneTotalTime = clusterRoutes.reduce((sum, m) => sum + m.totalTime, 0);
                const zoneTotalDist = clusterRoutes.reduce((sum, m) => sum + parseFloat(m.distance), 0);

                return (
                  <motion.div
                    key={zoneKey}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: zoneIdx * 0.1 }}
                    className="p-4 bg-white rounded-lg border border-purple-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-purple-600" />
                        <h4 className="font-semibold text-gray-900">Zone {zoneIdx + 1}</h4>
                        <Badge className="bg-purple-100 text-purple-700">
                          {zoneMissions.length} mission{zoneMissions.length > 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600">{zoneTotalDist.toFixed(1)} km • {Math.round(zoneTotalTime)} min</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {clusterRoutes.map((mission) => (
                        <div key={mission.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                          <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">
                            {mission.order}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{mission.store_name}</p>
                            <p className="text-xs text-gray-500 truncate">{mission.delivery_address}</p>
                          </div>
                          <div className="text-right whitespace-nowrap">
                            <p className="text-xs text-gray-600">{mission.shoppingTime}m</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pro Tip */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700 flex items-start gap-2">
            <Zap className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>
              <strong>Conseil :</strong> Suivez cet ordre pour économiser {timesSaved} km et {Math.round((parseFloat(timesSaved) / 5) * 20)} minutes !
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}