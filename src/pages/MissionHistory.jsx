import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Calendar,
  User,
  CheckCircle,
  Clock,
  ChevronRight,
  Download,
  BarChart3,
  TrendingUp,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

const statusConfig = {
  completed: { label: 'Terminée', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-700' },
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
};

export default function MissionHistory() {
  const [missions, setMissions] = useState([]);
  const [filteredMissions, setFilteredMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [clientFilter, setClientFilter] = useState('');
  const [intervenantFilter, setIntervenantFilter] = useState('');
  const [minRating, setMinRating] = useState('all');
  const [uniqueClients, setUniqueClients] = useState([]);
  const [uniqueIntervenants, setUniqueIntervenants] = useState([]);

  useEffect(() => {
    loadMissions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [missions, searchTerm, statusFilter, startDate, endDate, clientFilter, intervenantFilter, minRating]);

  const loadMissions = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      // Déterminer quelles missions charger selon le rôle
      let allMissions = [];
      if (userData.role === 'admin') {
        allMissions = await base44.entities.Mission.filter(
          { status: { $in: ['completed', 'cancelled'] } },
          '-completed_date'
        );
      } else if (userData.user_type === 'intervenant') {
        allMissions = await base44.entities.Mission.filter(
          { intervenant_email: userData.email, status: { $in: ['completed', 'cancelled'] } },
          '-completed_date'
        );
      } else {
        allMissions = await base44.entities.Mission.filter(
          { client_email: userData.email, status: { $in: ['completed', 'cancelled'] } },
          '-completed_date'
        );
      }

      setMissions(allMissions);

      // Extraire clients et intervenants uniques
      const clients = [...new Set(allMissions.map(m => m.client_name).filter(Boolean))];
      const intervenants = [...new Set(allMissions.map(m => m.intervenant_name).filter(Boolean))];
      setUniqueClients(clients);
      setUniqueIntervenants(intervenants);
    } catch (error) {
      console.error('Error loading missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...missions];

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(m => m.status === statusFilter);
    }

    // Filtre par date
    const start = new Date(startDate);
    const end = new Date(endDate + 'T23:59:59');
    filtered = filtered.filter(m => {
      const missionDate = new Date(m.completed_time || m.updated_date);
      return missionDate >= start && missionDate <= end;
    });

    // Filtre par client
    if (clientFilter) {
      filtered = filtered.filter(m => m.client_name === clientFilter);
    }

    // Filtre par intervenant
    if (intervenantFilter) {
      filtered = filtered.filter(m => m.intervenant_name === intervenantFilter);
    }

    // Filtre par note minimale
    if (minRating !== 'all') {
      const minVal = parseFloat(minRating);
      filtered = filtered.filter(m => (m.rating || 0) >= minVal);
    }

    // Recherche
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.store_name?.toLowerCase().includes(search) ||
        m.client_name?.toLowerCase().includes(search) ||
        m.intervenant_name?.toLowerCase().includes(search) ||
        m.delivery_address?.toLowerCase().includes(search)
      );
    }

    setFilteredMissions(filtered);
    setCurrentPage(1);
  };

  const stats = {
    total: filteredMissions.length,
    completed: filteredMissions.filter(m => m.status === 'completed').length,
    cancelled: filteredMissions.filter(m => m.status === 'cancelled').length,
    avgRating: filteredMissions.filter(m => m.rating).length > 0 
      ? (filteredMissions.filter(m => m.rating).reduce((sum, m) => sum + m.rating, 0) / filteredMissions.filter(m => m.rating).length).toFixed(1)
      : 'N/A',
    totalEarnings: filteredMissions.filter(m => m.status === 'completed').reduce((sum, m) => sum + (m.service_fee || 0), 0)
  };

  const paginatedMissions = filteredMissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredMissions.length / itemsPerPage);

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Historique des missions</h1>
          <p className="text-gray-600">Visualisez et analysez vos missions passées</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 font-medium mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <p className="text-xs text-emerald-600 font-medium mb-1">Terminées</p>
              <p className="text-2xl font-bold text-emerald-700">{stats.completed}</p>
            </CardContent>
          </Card>
          {user?.user_type === 'intervenant' && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4">
                <p className="text-xs text-blue-600 font-medium mb-1">Gains</p>
                <p className="text-2xl font-bold text-blue-700">{stats.totalEarnings.toFixed(2)}€</p>
              </CardContent>
            </Card>
          )}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <p className="text-xs text-yellow-600 font-medium mb-1">Note moyenne</p>
              <p className="text-2xl font-bold text-yellow-700 flex items-center gap-1">
                {stats.avgRating}
                {stats.avgRating !== 'N/A' && <Star className="w-4 h-4 fill-current" />}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-emerald-600" />
              Filtres et recherche
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recherche */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Rechercher
              </label>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Magasin, client, adresse..."
                className="w-full"
              />
            </div>

            {/* Filtres en grille */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Statut */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Statut</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="completed">Terminées</SelectItem>
                    <SelectItem value="cancelled">Annulées</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date début */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Du</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              {/* Date fin */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Au</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              {/* Note minimale */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Note minimale</label>
                <Select value={minRating} onValueChange={setMinRating}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les notes</SelectItem>
                    <SelectItem value="3">⭐ 3+ étoiles</SelectItem>
                    <SelectItem value="4">⭐ 4+ étoiles</SelectItem>
                    <SelectItem value="5">⭐ 5 étoiles</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Client */}
              {user?.role === 'admin' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Client</label>
                  <Select value={clientFilter} onValueChange={setClientFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les clients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Tous</SelectItem>
                      {uniqueClients.map(client => (
                        <SelectItem key={client} value={client}>{client}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Intervenant */}
              {user?.role === 'admin' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Intervenant</label>
                  <Select value={intervenantFilter} onValueChange={setIntervenantFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les intervenants" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Tous</SelectItem>
                      {uniqueIntervenants.map(intervenant => (
                        <SelectItem key={intervenant} value={intervenant}>{intervenant}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Bouton de réinitialisation */}
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setClientFilter('');
                setIntervenantFilter('');
                setMinRating('all');
              }}
              className="text-sm"
            >
              Réinitialiser les filtres
            </Button>
          </CardContent>
        </Card>

        {/* Liste des missions */}
        {paginatedMissions.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BarChart3 className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune mission trouvée</h3>
              <p className="text-gray-500 text-center">
                Essayez de modifier vos filtres pour trouver les missions que vous cherchez
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {paginatedMissions.map((mission, index) => (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        {/* Infos principales */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{mission.store_name}</h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {moment(mission.completed_time || mission.updated_date).format('DD MMM YYYY HH:mm')}
                              </p>
                            </div>
                            <Badge className={statusConfig[mission.status]?.color}>
                              {statusConfig[mission.status]?.label}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{mission.client_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{mission.intervenant_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{mission.shopping_list?.length || 0} articles</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {mission.rating && <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
                              <span className="text-sm text-gray-600">
                                {mission.rating ? `${mission.rating}/5` : 'Non notée'}
                              </span>
                            </div>
                          </div>

                          {mission.review && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-500 font-medium mb-1">Commentaire:</p>
                              <p className="text-sm text-gray-600">"{mission.review}"</p>
                            </div>
                          )}
                        </div>

                        {/* Détails financiers et action */}
                        <div className="lg:text-right space-y-3">
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Montant total</p>
                            <p className="text-2xl font-bold text-emerald-600">
                              {((mission.actual_cost || mission.estimated_budget || 0) + (mission.service_fee || 0) + (mission.tip || 0)).toFixed(2)}€
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                            <div>
                              <p className="text-xs text-gray-500">Articles</p>
                              <p className="font-bold text-gray-900">{(mission.actual_cost || mission.estimated_budget || 0).toFixed(2)}€</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Frais</p>
                              <p className="font-bold text-gray-900">{(mission.service_fee || 0).toFixed(2)}€</p>
                            </div>
                          </div>

                          <Link to={createPageUrl('MissionDetails') + `?id=${mission.id}`}>
                            <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 mt-3">
                              <ChevronRight className="w-4 h-4 mr-2" />
                              Détails
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            >
              Précédent
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={currentPage === page ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            >
              Suivant
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}