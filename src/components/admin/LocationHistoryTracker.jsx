import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock } from 'lucide-react';
import moment from 'moment';

export default function LocationHistoryTracker({ intervenantEmail, intervenantName }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    loadHistory();
  }, [startDate, endDate, intervenantEmail]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const allHistory = await base44.entities.LocationHistory.filter(
        { user_email: intervenantEmail },
        '-created_date'
      );

      // Filtrer par date
      const filtered = allHistory.filter(loc => {
        const locDate = new Date(loc.created_date);
        return locDate >= new Date(startDate) && locDate <= new Date(endDate + 'T23:59:59');
      });

      setHistory(filtered.slice(0, 500)); // Limiter à 500 points
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: history.length,
    distance: calculateTotalDistance(history),
    avgSpeed: calculateAvgSpeed(history)
  };

  function calculateTotalDistance(points) {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      const R = 6371;
      const dLat = (points[i].latitude - points[i-1].latitude) * Math.PI / 180;
      const dLon = (points[i].longitude - points[i-1].longitude) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(points[i-1].latitude * Math.PI / 180) * Math.cos(points[i].latitude * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      total += R * c;
    }
    return total;
  }

  function calculateAvgSpeed(points) {
    if (points.length < 2) return 0;
    const speedSum = points.reduce((sum, p) => sum + (p.speed || 0), 0);
    return (speedSum / points.length * 3.6).toFixed(1); // m/s to km/h
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600" />
          Historique de positions - {intervenantName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtres de date */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Du</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Au</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">&nbsp;</label>
            <Button
              onClick={loadHistory}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600"
            >
              {loading ? 'Chargement...' : 'Charger'}
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 font-medium">Points tracés</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg">
            <p className="text-xs text-emerald-600 font-medium">Distance</p>
            <p className="text-xl font-bold text-emerald-700 mt-1">{stats.distance.toFixed(1)} km</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600 font-medium">Vitesse moyenne</p>
            <p className="text-xl font-bold text-blue-700 mt-1">{stats.avgSpeed} km/h</p>
          </div>
        </div>

        {/* Timeline */}
        {history.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {history.slice(0, 20).map((loc, idx) => (
              <div key={loc.id} className="p-3 bg-gray-50 rounded-lg flex items-start gap-3">
                <div className="mt-1">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {moment(loc.created_date).format('HH:mm:ss')}
                    </Badge>
                    {loc.speed && (
                      <Badge variant="outline" className="text-xs">
                        {(loc.speed * 3.6).toFixed(1)} km/h
                      </Badge>
                    )}
                    {loc.accuracy && (
                      <Badge variant="outline" className="text-xs">
                        ±{loc.accuracy.toFixed(0)}m
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {history.length > 20 && (
              <p className="text-xs text-gray-500 text-center py-2">
                +{history.length - 20} autres points
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Aucune donnée pour cette période</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}