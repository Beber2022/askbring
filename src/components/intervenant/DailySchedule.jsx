import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Clock, MapPin, ShoppingCart, Truck, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

export default function DailySchedule({ missions, user }) {
  const [schedule, setSchedule] = useState([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);

  useEffect(() => {
    if (missions.length > 0) {
      calculateSchedule();
    }
  }, [missions]);

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

  const calculateSchedule = () => {
    const activeMissions = missions.filter(m => 
      ['accepted', 'in_progress', 'shopping', 'delivering'].includes(m.status)
    ).sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

    if (activeMissions.length === 0) {
      setSchedule([]);
      setTotalDistance(0);
      setEstimatedTime(0);
      return;
    }

    let totalDist = 0;
    let totalMinutes = 0;
    const scheduleItems = activeMissions.map((mission, index) => {
      let distanceFromPrevious = 0;
      let travelTime = 0;

      if (index > 0) {
        const prevMission = activeMissions[index - 1];
        if (prevMission.delivery_lat && mission.delivery_lat) {
          distanceFromPrevious = calculateDistance(
            prevMission.delivery_lat,
            prevMission.delivery_lng,
            mission.delivery_lat,
            mission.delivery_lng
          );
          // Estimated travel time: 20 minutes per 5km + traffic
          travelTime = Math.round((distanceFromPrevious / 5) * 20 + 5);
        }
      }

      totalDist += distanceFromPrevious;
      // Shopping time: 15 minutes per 5 items + 10 minute base
      const shoppingTime = Math.round((mission.shopping_list?.length || 0) * 3 + 10);
      totalMinutes += travelTime + shoppingTime;

      return {
        ...mission,
        distanceFromPrevious: distanceFromPrevious.toFixed(1),
        travelTime,
        shoppingTime
      };
    });

    setSchedule(scheduleItems);
    setTotalDistance(totalDist.toFixed(1));
    setEstimatedTime(totalMinutes);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return Clock;
      case 'in_progress':
        return Truck;
      case 'shopping':
        return ShoppingCart;
      case 'delivering':
        return MapPin;
      default:
        return CheckCircle;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-blue-100 text-blue-700';
      case 'in_progress':
        return 'bg-purple-100 text-purple-700';
      case 'shopping':
        return 'bg-indigo-100 text-indigo-700';
      case 'delivering':
        return 'bg-emerald-100 text-emerald-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (schedule.length === 0) {
    return null;
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            Votre tournée du jour
          </div>
          <Badge variant="secondary">
            {schedule.length} mission{schedule.length > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-emerald-50 rounded-xl">
          <div className="text-center">
            <p className="text-sm text-emerald-600 font-medium">Distance totale</p>
            <p className="text-2xl font-bold text-emerald-700">{totalDistance} km</p>
          </div>
          <div className="text-center border-l border-r border-emerald-200">
            <p className="text-sm text-emerald-600 font-medium">Temps estimé</p>
            <p className="text-2xl font-bold text-emerald-700">
              {Math.floor(estimatedTime / 60)}h{estimatedTime % 60}m
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-emerald-600 font-medium">Missions</p>
            <p className="text-2xl font-bold text-emerald-700">{schedule.length}</p>
          </div>
        </div>

        {/* Schedule Timeline */}
        <div className="space-y-3">
          {schedule.map((mission, index) => {
            const StatusIcon = getStatusIcon(mission.status);
            
            return (
              <motion.div
                key={mission.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex gap-4">
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(mission.status)}`}>
                      <StatusIcon className="w-5 h-5" />
                    </div>
                    {index < schedule.length - 1 && (
                      <div className="w-1 h-16 bg-gradient-to-b from-emerald-300 to-transparent mt-1 mb-1" />
                    )}
                  </div>

                  {/* Mission Card */}
                  <div className="flex-1 pb-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{mission.store_name}</h4>
                          <p className="text-sm text-gray-500">Client: {mission.client_name}</p>
                        </div>
                        <Badge className={getStatusColor(mission.status)} variant="secondary">
                          {mission.status === 'accepted' && 'À démarrer'}
                          {mission.status === 'in_progress' && 'En route'}
                          {mission.status === 'shopping' && 'En courses'}
                          {mission.status === 'delivering' && 'Livraison'}
                        </Badge>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                        {mission.distanceFromPrevious > 0 && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <MapPin className="w-3 h-3" />
                            {mission.distanceFromPrevious} km
                          </div>
                        )}
                        {mission.travelTime > 0 && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Truck className="w-3 h-3" />
                            {mission.travelTime}m
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-gray-600">
                          <ShoppingCart className="w-3 h-3" />
                          {mission.shoppingTime}m
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-start gap-2 text-xs text-gray-600">
                        <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{mission.delivery_address}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}