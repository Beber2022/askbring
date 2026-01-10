import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Package
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7days');
  const [metrics, setMetrics] = useState({
    activeMissions: 0,
    completedToday: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalIntervenants: 0,
    pendingMissions: 0,
    avgRating: 0,
    revenueChange: 0
  });
  const [chartData, setChartData] = useState({
    revenue: [],
    missions: [],
    categories: []
  });
  const [topPerformers, setTopPerformers] = useState([]);
  const [recentMissions, setRecentMissions] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const now = moment();
      const periodStart = getPeriodStart(period);

      // Parallel data fetching
      const [allMissions, allUsers, allIntervenants] = await Promise.all([
        base44.entities.Mission.list('-created_date', 500),
        base44.entities.User.filter({ user_type: 'client' }),
        base44.entities.User.filter({ user_type: 'intervenant' })
      ]);

      // Calculate metrics
      const activeMissions = allMissions.filter(m => 
        ['accepted', 'in_progress', 'shopping', 'delivering'].includes(m.status)
      ).length;

      const completedToday = allMissions.filter(m => 
        m.status === 'completed' && moment(m.completed_time).isSame(now, 'day')
      ).length;

      const completedMissions = allMissions.filter(m => m.status === 'completed');
      const totalRevenue = completedMissions.reduce((sum, m) => sum + (m.total_paid || 0), 0);

      const pendingMissions = allMissions.filter(m => m.status === 'pending').length;

      const ratings = completedMissions.filter(m => m.rating).map(m => m.rating);
      const avgRating = ratings.length > 0 
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
        : 0;

      // Revenue change (compare to previous period)
      const previousPeriodStart = moment(periodStart).subtract(getDaysInPeriod(period), 'days');
      const currentRevenue = completedMissions
        .filter(m => moment(m.completed_time).isAfter(periodStart))
        .reduce((sum, m) => sum + (m.total_paid || 0), 0);
      const previousRevenue = completedMissions
        .filter(m => moment(m.completed_time).isBetween(previousPeriodStart, periodStart))
        .reduce((sum, m) => sum + (m.total_paid || 0), 0);
      const revenueChange = previousRevenue > 0 
        ? ((currentRevenue - previousRevenue) / previousRevenue * 100)
        : 0;

      setMetrics({
        activeMissions,
        completedToday,
        totalRevenue,
        totalUsers: allUsers.length,
        totalIntervenants: allIntervenants.length,
        pendingMissions,
        avgRating,
        revenueChange
      });

      // Generate chart data
      generateChartData(allMissions, periodStart);

      // Top performers
      const intervenantStats = {};
      completedMissions.forEach(m => {
        if (m.intervenant_email) {
          if (!intervenantStats[m.intervenant_email]) {
            intervenantStats[m.intervenant_email] = {
              email: m.intervenant_email,
              name: m.intervenant_name,
              missions: 0,
              totalEarned: 0,
              avgRating: 0,
              ratings: []
            };
          }
          intervenantStats[m.intervenant_email].missions++;
          intervenantStats[m.intervenant_email].totalEarned += (m.service_fee || 0) + (m.tip || 0);
          if (m.rating) {
            intervenantStats[m.intervenant_email].ratings.push(m.rating);
          }
        }
      });

      const topPerformersData = Object.values(intervenantStats)
        .map(stat => ({
          ...stat,
          avgRating: stat.ratings.length > 0
            ? stat.ratings.reduce((a, b) => a + b, 0) / stat.ratings.length
            : 0
        }))
        .sort((a, b) => b.totalEarned - a.totalEarned)
        .slice(0, 10);

      setTopPerformers(topPerformersData);

      // Recent missions
      setRecentMissions(allMissions.slice(0, 5));

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodStart = (period) => {
    const now = moment();
    switch (period) {
      case '24h': return now.subtract(1, 'day');
      case '7days': return now.subtract(7, 'days');
      case '30days': return now.subtract(30, 'days');
      case '90days': return now.subtract(90, 'days');
      default: return now.subtract(7, 'days');
    }
  };

  const getDaysInPeriod = (period) => {
    switch (period) {
      case '24h': return 1;
      case '7days': return 7;
      case '30days': return 30;
      case '90days': return 90;
      default: return 7;
    }
  };

  const generateChartData = (missions, periodStart) => {
    const completedMissions = missions.filter(m => 
      m.status === 'completed' && moment(m.completed_time).isAfter(periodStart)
    );

    // Revenue by day
    const revenueByDay = {};
    completedMissions.forEach(m => {
      const day = moment(m.completed_time).format('DD MMM');
      revenueByDay[day] = (revenueByDay[day] || 0) + (m.total_paid || 0);
    });

    const revenueData = Object.keys(revenueByDay).map(day => ({
      date: day,
      revenue: revenueByDay[day]
    }));

    // Missions by day
    const missionsByDay = {};
    completedMissions.forEach(m => {
      const day = moment(m.completed_time).format('DD MMM');
      missionsByDay[day] = (missionsByDay[day] || 0) + 1;
    });

    const missionsData = Object.keys(missionsByDay).map(day => ({
      date: day,
      missions: missionsByDay[day]
    }));

    // Missions by category
    const categoryCount = {};
    completedMissions.forEach(m => {
      const cat = m.category || 'autre';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const categoryLabels = {
      courses_alimentaires: 'Courses',
      livraison_urgente: 'Urgente',
      taches_menageres: 'Ménage',
      bricolage: 'Bricolage',
      jardinage: 'Jardinage',
      autre: 'Autre'
    };

    const categoriesData = Object.keys(categoryCount).map(cat => ({
      name: categoryLabels[cat] || cat,
      value: categoryCount[cat]
    }));

    setChartData({
      revenue: revenueData,
      missions: missionsData,
      categories: categoriesData
    });
  };

  const statusConfig = {
    pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
    accepted: { label: 'Acceptée', color: 'bg-blue-100 text-blue-700' },
    in_progress: { label: 'En cours', color: 'bg-purple-100 text-purple-700' },
    completed: { label: 'Terminée', color: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-700' },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <LayoutDashboard className="w-8 h-8 text-emerald-600" />
              Tableau de bord Admin
            </h1>
            <p className="text-gray-600 mt-1">Vue d'ensemble des opérations</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Dernières 24h</SelectItem>
              <SelectItem value="7days">7 derniers jours</SelectItem>
              <SelectItem value="30days">30 derniers jours</SelectItem>
              <SelectItem value="90days">90 derniers jours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Briefcase className="w-8 h-8 text-emerald-600" />
                <Badge className="bg-emerald-100 text-emerald-700">
                  {metrics.activeMissions}
                </Badge>
              </div>
              <h3 className="text-sm text-gray-600">Missions actives</h3>
              <p className="text-2xl font-bold text-gray-900">{metrics.activeMissions}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-8 h-8 text-blue-600" />
                <Badge className="bg-blue-100 text-blue-700">
                  Aujourd'hui
                </Badge>
              </div>
              <h3 className="text-sm text-gray-600">Missions complétées</h3>
              <p className="text-2xl font-bold text-gray-900">{metrics.completedToday}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-purple-600" />
                {metrics.revenueChange !== 0 && (
                  <div className={`flex items-center gap-1 text-sm ${metrics.revenueChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics.revenueChange > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {Math.abs(metrics.revenueChange).toFixed(1)}%
                  </div>
                )}
              </div>
              <h3 className="text-sm text-gray-600">Revenus totaux</h3>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalRevenue.toFixed(2)}€</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-orange-600" />
                <Badge className="bg-orange-100 text-orange-700">
                  {metrics.totalIntervenants} Bringeurs
                </Badge>
              </div>
              <h3 className="text-sm text-gray-600">Utilisateurs totaux</h3>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalUsers}</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">En attente</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.pendingMissions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Note moyenne</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.avgRating.toFixed(1)}/5</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Taux de complétion</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {((metrics.totalRevenue / (metrics.totalRevenue + metrics.pendingMissions * 30) * 100) || 0).toFixed(0)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="revenue" className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="revenue">Revenus</TabsTrigger>
            <TabsTrigger value="missions">Missions</TabsTrigger>
            <TabsTrigger value="categories">Catégories</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Évolution des revenus</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.revenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenus (€)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="missions">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Missions complétées par jour</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.missions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="missions" fill="#3b82f6" name="Missions" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Répartition par catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.categories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Top 10 Bringeurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPerformers.map((performer, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{performer.name}</p>
                        <p className="text-sm text-gray-500">{performer.missions} missions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">{performer.totalEarned.toFixed(2)}€</p>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        {performer.avgRating.toFixed(1)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Missions */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Missions récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentMissions.map((mission) => (
                  <Link key={mission.id} to={createPageUrl('MissionDetails') + `?id=${mission.id}`}>
                    <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{mission.store_name}</span>
                        </div>
                        <Badge className={statusConfig[mission.status]?.color}>
                          {statusConfig[mission.status]?.label}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{mission.client_name}</span>
                        <span className="text-gray-600">
                          {moment(mission.created_date).format('DD/MM HH:mm')}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg mt-6">
          <CardHeader>
            <CardTitle>Accès rapide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to={createPageUrl('AdminUsers')}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <Users className="w-4 h-4 mr-2" />
                  Gérer les utilisateurs
                </Button>
              </Link>
              <Link to={createPageUrl('AdminMissions')}>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Gérer les missions
                </Button>
              </Link>
              <Link to={createPageUrl('AdminIntervenants')}>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  <Star className="w-4 h-4 mr-2" />
                  Gérer les Bringeurs
                </Button>
              </Link>
              <Link to={createPageUrl('AdminReports')}>
                <Button className="w-full bg-orange-600 hover:bg-orange-700">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Rapports détaillés
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}