import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Star,
  TrendingUp,
  DollarSign,
  Briefcase,
  Eye,
  Ban,
  CheckCircle,
  Award,
  Calendar,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

const statusConfig = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  accepted: { label: 'Acceptée', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'En cours', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Terminée', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-700' },
};

export default function AdminIntervenants() {
  const [intervenants, setIntervenants] = useState([]);
  const [filteredIntervenants, setFilteredIntervenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('missions');
  const [selectedIntervenant, setSelectedIntervenant] = useState(null);
  const [intervenantDetails, setIntervenantDetails] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadIntervenants();
  }, []);

  useEffect(() => {
    filterAndSort();
  }, [searchTerm, sortBy, intervenants]);

  const loadIntervenants = async () => {
    try {
      const users = await base44.entities.User.filter({ user_type: 'intervenant' });
      const missions = await base44.entities.Mission.list('-created_date', 1000);

      const intervenantsWithStats = users.map(user => {
        const userMissions = missions.filter(m => m.intervenant_email === user.email);
        const completedMissions = userMissions.filter(m => m.status === 'completed');
        
        const totalRevenue = completedMissions.reduce((sum, m) => 
          sum + (m.service_fee || 0) + (m.tip || 0), 0
        );

        const ratings = completedMissions.filter(m => m.rating).map(m => m.rating);
        const avgRating = ratings.length > 0 
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
          : 0;

        const activeMissions = userMissions.filter(m => 
          ['accepted', 'in_progress', 'shopping', 'delivering'].includes(m.status)
        ).length;

        return {
          ...user,
          totalMissions: completedMissions.length,
          totalRevenue,
          avgRating,
          activeMissions,
          allMissions: userMissions
        };
      });

      setIntervenants(intervenantsWithStats);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les Bringeurs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSort = () => {
    let filtered = intervenants;

    if (searchTerm) {
      filtered = filtered.filter(i =>
        i.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'missions':
          return b.totalMissions - a.totalMissions;
        case 'revenue':
          return b.totalRevenue - a.totalRevenue;
        case 'rating':
          return b.avgRating - a.avgRating;
        case 'recent':
          return new Date(b.created_date) - new Date(a.created_date);
        default:
          return 0;
      }
    });

    setFilteredIntervenants(filtered);
  };

  const toggleIntervenantStatus = async (intervenant) => {
    try {
      await base44.entities.User.update(intervenant.id, {
        is_active: !intervenant.is_active
      });
      await loadIntervenants();
      toast({
        title: intervenant.is_active ? "Bringeur désactivé" : "Bringeur activé"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        variant: "destructive"
      });
    }
  };

  const loadIntervenantDetails = async (intervenant) => {
    setSelectedIntervenant(intervenant);
    setIntervenantDetails({
      missions: intervenant.allMissions,
      stats: {
        totalMissions: intervenant.totalMissions,
        totalRevenue: intervenant.totalRevenue,
        avgRating: intervenant.avgRating,
        activeMissions: intervenant.activeMissions
      }
    });
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
          <Users className="w-8 h-8 text-emerald-600" />
          Gestion des Bringeurs
        </h1>

        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-6 mb-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Bringeurs</p>
                  <p className="text-2xl font-bold text-gray-900">{intervenants.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Missions complétées</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {intervenants.reduce((sum, i) => sum + i.totalMissions, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Revenus générés</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {intervenants.reduce((sum, i) => sum + i.totalRevenue, 0).toFixed(0)}€
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Note moyenne</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(intervenants.reduce((sum, i) => sum + i.avgRating, 0) / intervenants.length || 0).toFixed(1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher un Bringeur..."
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="missions">Plus de missions</SelectItem>
                  <SelectItem value="revenue">Plus de revenus</SelectItem>
                  <SelectItem value="rating">Meilleure note</SelectItem>
                  <SelectItem value="recent">Plus récents</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Intervenants List */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Liste des Bringeurs ({filteredIntervenants.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <AnimatePresence>
                {filteredIntervenants.map((intervenant) => (
                  <motion.div
                    key={intervenant.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar className="w-14 h-14">
                          <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg">
                            {intervenant.full_name?.charAt(0) || 'B'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{intervenant.full_name}</h4>
                            {!intervenant.is_active && (
                              <Badge variant="destructive">Désactivé</Badge>
                            )}
                            {intervenant.avgRating >= 4.5 && (
                              <Badge className="bg-yellow-100 text-yellow-700">
                                <Award className="w-3 h-3 mr-1" />
                                Top Bringeur
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Briefcase className="w-4 h-4" />
                              <span>{intervenant.totalMissions} missions</span>
                            </div>
                            <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                              <DollarSign className="w-4 h-4" />
                              <span>{intervenant.totalRevenue.toFixed(2)}€</span>
                            </div>
                            <div className="flex items-center gap-1 text-yellow-600">
                              <Star className="w-4 h-4 fill-yellow-400" />
                              <span>{intervenant.avgRating.toFixed(1)}/5</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>{moment(intervenant.created_date).format('DD/MM/YYYY')}</span>
                            </div>
                          </div>
                          {intervenant.activeMissions > 0 && (
                            <div className="mt-2">
                              <Badge className="bg-blue-100 text-blue-700">
                                {intervenant.activeMissions} mission(s) active(s)
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadIntervenantDetails(intervenant)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Détails
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Détails du Bringeur</DialogTitle>
                            </DialogHeader>
                            {selectedIntervenant?.id === intervenant.id && intervenantDetails && (
                              <div className="space-y-6">
                                {/* Info */}
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="flex items-center gap-4 mb-4">
                                      <Avatar className="w-16 h-16">
                                        <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xl">
                                          {selectedIntervenant.full_name?.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <h3 className="text-xl font-bold">{selectedIntervenant.full_name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                          <Mail className="w-4 h-4" />
                                          {selectedIntervenant.email}
                                        </div>
                                        {selectedIntervenant.phone && (
                                          <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Phone className="w-4 h-4" />
                                            {selectedIntervenant.phone}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4">
                                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <p className="text-2xl font-bold text-gray-900">{intervenantDetails.stats.totalMissions}</p>
                                        <p className="text-xs text-gray-600">Missions</p>
                                      </div>
                                      <div className="text-center p-3 bg-emerald-50 rounded-lg">
                                        <p className="text-2xl font-bold text-emerald-600">{intervenantDetails.stats.totalRevenue.toFixed(0)}€</p>
                                        <p className="text-xs text-gray-600">Revenus</p>
                                      </div>
                                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                        <p className="text-2xl font-bold text-yellow-600">{intervenantDetails.stats.avgRating.toFixed(1)}</p>
                                        <p className="text-xs text-gray-600">Note moyenne</p>
                                      </div>
                                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <p className="text-2xl font-bold text-blue-600">{intervenantDetails.stats.activeMissions}</p>
                                        <p className="text-xs text-gray-600">Actives</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Tabs */}
                                <Tabs defaultValue="missions">
                                  <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="missions">Historique missions</TabsTrigger>
                                    <TabsTrigger value="reviews">Évaluations</TabsTrigger>
                                  </TabsList>

                                  <TabsContent value="missions" className="space-y-2 mt-4">
                                    {intervenantDetails.missions.length === 0 ? (
                                      <p className="text-center text-gray-500 py-8">Aucune mission</p>
                                    ) : (
                                      intervenantDetails.missions.slice(0, 20).map((mission) => (
                                        <Link key={mission.id} to={createPageUrl('MissionDetails') + `?id=${mission.id}`}>
                                          <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            <div className="flex items-center justify-between">
                                              <div>
                                                <p className="font-medium text-gray-900">{mission.store_name}</p>
                                                <p className="text-sm text-gray-600">{mission.client_name}</p>
                                              </div>
                                              <div className="text-right">
                                                <Badge className={statusConfig[mission.status]?.color}>
                                                  {statusConfig[mission.status]?.label}
                                                </Badge>
                                                <p className="text-xs text-gray-500 mt-1">
                                                  {moment(mission.created_date).format('DD/MM/YYYY')}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        </Link>
                                      ))
                                    )}
                                  </TabsContent>

                                  <TabsContent value="reviews" className="space-y-3 mt-4">
                                    {intervenantDetails.missions.filter(m => m.rating).length === 0 ? (
                                      <p className="text-center text-gray-500 py-8">Aucune évaluation</p>
                                    ) : (
                                      intervenantDetails.missions.filter(m => m.rating).map((mission) => (
                                        <div key={mission.id} className="p-4 bg-gray-50 rounded-lg">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                              <span className="font-semibold">{mission.rating}/5</span>
                                            </div>
                                            <span className="text-sm text-gray-500">
                                              {moment(mission.completed_time).format('DD/MM/YYYY')}
                                            </span>
                                          </div>
                                          <p className="text-sm text-gray-700">{mission.store_name}</p>
                                          {mission.review && (
                                            <p className="text-sm text-gray-600 mt-2 italic">"{mission.review}"</p>
                                          )}
                                        </div>
                                      ))
                                    )}
                                  </TabsContent>
                                </Tabs>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleIntervenantStatus(intervenant)}
                        >
                          {intervenant.is_active ? (
                            <>
                              <Ban className="w-4 h-4 mr-1" />
                              Désactiver
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Activer
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}