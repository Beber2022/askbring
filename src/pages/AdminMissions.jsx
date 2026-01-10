import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Search,
  Filter,
  Eye,
  XCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

const statusConfig = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  accepted: { label: 'Acceptée', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'En cours', color: 'bg-purple-100 text-purple-700' },
  shopping: { label: 'En courses', color: 'bg-indigo-100 text-indigo-700' },
  delivering: { label: 'En livraison', color: 'bg-emerald-100 text-emerald-700' },
  completed: { label: 'Terminée', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-700' },
};

export default function AdminMissions() {
  const [missions, setMissions] = useState([]);
  const [filteredMissions, setFilteredMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadMissions();
  }, []);

  useEffect(() => {
    filterMissions();
  }, [searchTerm, statusFilter, missions]);

  const loadMissions = async () => {
    try {
      const allMissions = await base44.entities.Mission.list('-created_date', 500);
      setMissions(allMissions);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les missions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterMissions = () => {
    let filtered = missions;

    if (searchTerm) {
      filtered = filtered.filter(m =>
        m.store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.intervenant_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(m => m.status === statusFilter);
    }

    setFilteredMissions(filtered);
  };

  const cancelMission = async (missionId) => {
    if (!confirm('Voulez-vous vraiment annuler cette mission ?')) return;
    
    try {
      await base44.entities.Mission.update(missionId, { status: 'cancelled' });
      await loadMissions();
      toast({ title: "Mission annulée" });
    } catch (error) {
      toast({
        title: "Erreur",
        variant: "destructive"
      });
    }
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
          <Briefcase className="w-8 h-8 text-emerald-600" />
          Gestion des missions
        </h1>

        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-6 mb-6">
          {Object.entries(statusConfig).slice(0, 4).map(([key, config]) => {
            const count = missions.filter(m => m.status === key).length;
            return (
              <Card key={key} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-600 mb-1">{config.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{count}</p>
                </CardContent>
              </Card>
            );
          })}
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
                  placeholder="Rechercher par magasin, client ou Bringeur..."
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Missions List */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Liste des missions ({filteredMissions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredMissions.map((mission) => (
                <div key={mission.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{mission.store_name}</h4>
                        <Badge className={statusConfig[mission.status]?.color}>
                          {statusConfig[mission.status]?.label}
                        </Badge>
                        {mission.mission_type && (
                          <Badge variant="outline">{mission.mission_type}</Badge>
                        )}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Client:</span> {mission.client_name}
                        </div>
                        {mission.intervenant_name && (
                          <div>
                            <span className="font-medium">Bringeur:</span> {mission.intervenant_name}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Articles:</span> {mission.shopping_list?.length || 0}
                        </div>
                        <div>
                          <span className="font-medium">Budget:</span> {(mission.estimated_budget || 0).toFixed(2)}€
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {moment(mission.created_date).format('DD/MM/YYYY HH:mm')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link to={createPageUrl('MissionDetails') + `?id=${mission.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
                      </Link>
                      {['pending', 'accepted', 'in_progress'].includes(mission.status) && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => cancelMission(mission.id)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Annuler
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}