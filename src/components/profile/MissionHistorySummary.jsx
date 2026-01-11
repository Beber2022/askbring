import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Briefcase, Star, TrendingUp, Calendar, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

export default function MissionHistorySummary({ user }) {
  const [missions, setMissions] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    avgRating: 0,
    totalEarnings: 0,
    thisMonth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const isIntervenant = user.user_type === 'intervenant';
      const query = isIntervenant
        ? { intervenant_email: user.email, status: 'completed' }
        : { client_email: user.email, status: 'completed' };

      const completedMissions = await base44.entities.Mission.filter(query, '-completed_time', 10);
      setMissions(completedMissions);

      // Calculate stats
      const total = completedMissions.length;
      const thisMonthStart = moment().startOf('month');
      const thisMonth = completedMissions.filter(m => moment(m.completed_time).isAfter(thisMonthStart)).length;

      if (isIntervenant) {
        const ratings = completedMissions
          .filter(m => m.rating)
          .map(m => m.rating);
        const avgRating = ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
          : 0;

        const totalEarnings = completedMissions.reduce((sum, m) => sum + (m.service_fee || 0) + (m.tip || 0), 0);

        setStats({ total, avgRating, totalEarnings, thisMonth });
      } else {
        setStats({ total, thisMonth });
      }
    } catch (error) {
      console.error('Error loading missions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 text-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  const isIntervenant = user.user_type === 'intervenant';

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-600" />
            Historique des missions
          </CardTitle>
          <Link to={createPageUrl('MissionHistory')}>
            <Button variant="ghost" size="sm">
              Voir tout
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-gray-600">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>

          {isIntervenant && (
            <>
              <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-yellow-600" />
                  <span className="text-xs text-gray-600">Note moy.</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.avgRating.toFixed(1)}</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-gray-600">Gains</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEarnings.toFixed(0)}€</p>
              </div>
            </>
          )}

          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-gray-600">Ce mois</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
          </div>
        </div>

        {/* Recent Missions */}
        {missions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucune mission terminée</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Missions récentes</h4>
            {missions.slice(0, 5).map((mission) => (
              <motion.div
                key={mission.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{mission.store_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {moment(mission.completed_time).format('DD MMM YYYY')}
                      </span>
                      {isIntervenant && mission.rating && (
                        <Badge variant="outline" className="text-xs">
                          <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-600" />
                          {mission.rating}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {isIntervenant && (
                    <span className="text-sm font-semibold text-emerald-600">
                      +{((mission.service_fee || 0) + (mission.tip || 0)).toFixed(2)}€
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <Link to={createPageUrl('MissionHistory')}>
          <Button variant="outline" className="w-full">
            Voir l'historique complet
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}