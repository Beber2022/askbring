import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  Star, 
  Briefcase, 
  TrendingUp,
  MapPin,
  Clock,
  CheckCircle,
  ArrowRight,
  Zap,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

export default function IntervenantDashboard() {
  const [user, setUser] = useState(null);
  const [missions, setMissions] = useState([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // Get geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => console.log('Geolocation error:', error)
      );
    }
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      const userMissions = await base44.entities.Mission.filter(
        { intervenant_email: userData.email },
        '-created_date'
      );
      setMissions(userMissions);

      // Check existing location record
      const locations = await base44.entities.IntervenantLocation.filter(
        { user_email: userData.email }
      );
      if (locations.length > 0) {
        setIsAvailable(locations[0].is_available);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (available) => {
    setIsAvailable(available);
    try {
      const existingLocations = await base44.entities.IntervenantLocation.filter(
        { user_email: user.email }
      );

      if (existingLocations.length > 0) {
        await base44.entities.IntervenantLocation.update(existingLocations[0].id, {
          is_available: available,
          latitude: location?.latitude || 0,
          longitude: location?.longitude || 0
        });
      } else {
        await base44.entities.IntervenantLocation.create({
          user_email: user.email,
          user_name: user.full_name,
          is_available: available,
          latitude: location?.latitude || 0,
          longitude: location?.longitude || 0
        });
      }
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  const completedMissions = missions.filter(m => m.status === 'completed');
  const activeMissions = missions.filter(m => !['completed', 'cancelled'].includes(m.status));
  const totalEarnings = completedMissions.reduce((sum, m) => sum + (m.service_fee || 0) + (m.tip || 0), 0);
  const avgRating = user?.average_rating || 0;

  const stats = [
    { 
      title: 'Gains totaux', 
      value: `${totalEarnings.toFixed(2)}€`, 
      icon: Wallet, 
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-100'
    },
    { 
      title: 'Missions réalisées', 
      value: completedMissions.length, 
      icon: Briefcase, 
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-blue-100'
    },
    { 
      title: 'Note moyenne', 
      value: avgRating ? avgRating.toFixed(1) : '-', 
      icon: Star, 
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-100'
    },
    { 
      title: 'En cours', 
      value: activeMissions.length, 
      icon: Clock, 
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-100'
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bonjour, {user?.full_name?.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-600 mt-1">
              {moment().format('dddd DD MMMM YYYY')}
            </p>
          </div>
          
          {/* Availability Toggle */}
          <Card className={`border-0 shadow-lg ${isAvailable ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gray-100'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isAvailable ? 'bg-white/20' : 'bg-gray-200'}`}>
                  <Zap className={`w-5 h-5 ${isAvailable ? 'text-white' : 'text-gray-500'}`} />
                </div>
                <div>
                  <Label className={isAvailable ? 'text-white font-medium' : 'text-gray-700 font-medium'}>
                    {isAvailable ? 'Disponible' : 'Indisponible'}
                  </Label>
                  <p className={`text-xs ${isAvailable ? 'text-white/70' : 'text-gray-500'}`}>
                    {isAvailable ? 'Vous recevez des missions' : 'En pause'}
                  </p>
                </div>
                <Switch
                  checked={isAvailable}
                  onCheckedChange={toggleAvailability}
                  className="data-[state=checked]:bg-white/30"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                      <stat.icon className={`w-5 h-5 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} style={{ WebkitTextStroke: '0.5px currentColor' }} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Active Missions */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-emerald-600" />
                    Missions actives
                  </CardTitle>
                  <Link to={createPageUrl('AvailableMissions')}>
                    <Button variant="ghost" size="sm" className="text-emerald-600">
                      Voir plus
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {activeMissions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Pas de mission active</h3>
                    <p className="text-gray-500 text-sm mb-4">
                      Consultez les missions disponibles près de vous
                    </p>
                    <Link to={createPageUrl('AvailableMissions')}>
                      <Button className="bg-gradient-to-r from-emerald-500 to-teal-600">
                        Voir les missions
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeMissions.slice(0, 3).map((mission) => (
                      <div
                        key={mission.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{mission.store_name}</h4>
                            <p className="text-sm text-gray-500">{mission.client_name}</p>
                          </div>
                        </div>
                        <Link to={createPageUrl('MissionDetails') + `?id=${mission.id}`}>
                          <Button variant="outline" size="sm">
                            Gérer
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Progress */}
          <div className="space-y-6">
            {/* Weekly Progress */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Objectif hebdo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">Missions</span>
                      <span className="font-medium">{completedMissions.length}/10</span>
                    </div>
                    <Progress value={(completedMissions.length / 10) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">Gains</span>
                      <span className="font-medium">{totalEarnings.toFixed(0)}€/100€</span>
                    </div>
                    <Progress value={(totalEarnings / 100) * 100} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to={createPageUrl('AvailableMissions')} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <MapPin className="w-4 h-4 mr-2 text-emerald-600" />
                    Missions disponibles
                  </Button>
                </Link>
                <Link to={createPageUrl('IntervenantMissions')} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Briefcase className="w-4 h-4 mr-2 text-blue-600" />
                    Mes missions
                  </Button>
                </Link>
                <Link to={createPageUrl('Profile')} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Star className="w-4 h-4 mr-2 text-yellow-600" />
                    Mon profil
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}