import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  MapPin,
  AlertTriangle,
  Clock,
  Navigation,
  Users,
  Activity,
  PhoneCall,
  Eye,
  EyeOff,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import IntervenantMapAdmin from '@/components/admin/IntervenantMapAdmin';
import AdminLocationAlerts from '@/components/admin/AdminLocationAlerts';
import LocationHistoryTracker from '@/components/admin/LocationHistoryTracker';
import IntervenantMovementSimulator from '@/components/admin/IntervenantMovementSimulator';

export default function AdminIntervenantMap() {
  const [locations, setLocations] = useState([]);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedIntervenant, setSelectedIntervenant] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      // Récupérer toutes les positions des intervenants
      const allLocations = await base44.entities.IntervenantLocation.list('-updated_date', 200);
      setLocations(allLocations);

      // Récupérer toutes les missions actives
      const activeMissions = await base44.entities.Mission.filter({
        status: { $in: ['accepted', 'in_progress', 'shopping', 'delivering'] }
      });
      setMissions(activeMissions);

      // Vérifier les alertes
      checkAlerts(allLocations, activeMissions);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAlerts = async (allLocations, activeMissions) => {
    const newAlerts = [];
    const now = Date.now();
    const inactivityThreshold = 30 * 60 * 1000; // 30 minutes
    const deviationThreshold = 5; // 5km

    for (const location of allLocations) {
      // Vérifier l'inactivité
      const lastUpdate = new Date(location.updated_date).getTime();
      const timeSinceUpdate = now - lastUpdate;

      if (location.is_available && timeSinceUpdate > inactivityThreshold) {
        newAlerts.push({
          id: `inactivity-${location.id}`,
          type: 'inactivity',
          severity: 'warning',
          intervenant_email: location.user_email,
          intervenant_name: location.user_name,
          message: `${location.user_name} inactif depuis ${Math.round(timeSinceUpdate / 60000)} minutes`,
          timestamp: new Date()
        });
      }

      // Vérifier la déviation de route pour les missions en cours
      const assignedMission = activeMissions.find(m => m.intervenant_email === location.user_email);
      if (assignedMission && ['delivering', 'in_progress'].includes(assignedMission.status)) {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          assignedMission.delivery_lat,
          assignedMission.delivery_lng
        );

        // Si trop loin de la livraison
        if (distance > deviationThreshold && assignedMission.status === 'delivering') {
          newAlerts.push({
            id: `deviation-${assignedMission.id}`,
            type: 'deviation',
            severity: 'critical',
            intervenant_email: location.user_email,
            intervenant_name: location.user_name,
            mission_id: assignedMission.id,
            message: `${location.user_name} s'écarte de sa route (${distance.toFixed(1)}km du point de livraison)`,
            timestamp: new Date()
          });
        }
      }
    }

    setAlerts(newAlerts);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getFilteredLocations = () => {
    if (filterStatus === 'active') return locations.filter(l => l.is_available);
    if (filterStatus === 'inactive') return locations.filter(l => !l.is_available);
    return locations;
  };

  const stats = {
    total: locations.length,
    active: locations.filter(l => l.is_available).length,
    onMissions: missions.length,
    alerts: alerts.length
  };

  const filteredLocations = getFilteredLocations();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                Suivi en Temps Réel
              </h1>
              <p className="text-gray-600 mt-1">Localisation et gestion des intervenants actifs</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowAlerts(!showAlerts)}
              className="flex items-center gap-2"
            >
              {showAlerts ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {showAlerts ? 'Masquer' : 'Afficher'} alertes
            </Button>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total intervenants</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                  </div>
                  <Users className="w-12 h-12 text-gray-400 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm">Actuellement actifs</p>
                    <p className="text-3xl font-bold mt-1">{stats.active}</p>
                  </div>
                  <Activity className="w-12 h-12 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">En missions</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.onMissions}</p>
                  </div>
                  <Navigation className="w-12 h-12 text-gray-400 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className={`border-0 shadow-lg ${stats.alerts > 0 ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white' : 'bg-gray-100'}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={stats.alerts > 0 ? 'text-red-100 text-sm' : 'text-gray-500 text-sm'}>
                      Alertes actives
                    </p>
                    <p className={`text-3xl font-bold mt-1 ${stats.alerts > 0 ? 'text-white' : 'text-gray-900'}`}>
                      {stats.alerts}
                    </p>
                  </div>
                  <AlertTriangle className={`w-12 h-12 ${stats.alerts > 0 ? 'opacity-20' : 'text-gray-400 opacity-20'}`} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts Section */}
          {showAlerts && alerts.length > 0 && (
            <div className="mb-8">
              <AdminLocationAlerts alerts={alerts} />
            </div>
          )}

          {/* Simulator */}
          <div className="mb-8">
            <IntervenantMovementSimulator />
          </div>

          {/* Main Map */}
          <div className="mb-8">
            <IntervenantMapAdmin locations={filteredLocations} missions={missions} />
          </div>

          {/* Filter and List */}
          <div className="space-y-4">
            <div className="flex gap-2">
              {['all', 'active', 'inactive'].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  onClick={() => setFilterStatus(status)}
                  className={filterStatus === status ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                >
                  {status === 'all' && `Tous (${locations.length})`}
                  {status === 'active' && `Actifs (${locations.filter(l => l.is_available).length})`}
                  {status === 'inactive' && `Inactifs (${locations.filter(l => !l.is_available).length})`}
                </Button>
              ))}
            </div>

            {filteredLocations.length === 0 ? (
              <Card className="border-0 shadow-lg text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun intervenant</h3>
                <p className="text-gray-500">
                  {filterStatus === 'active' && 'Aucun intervenant actif en ce moment'}
                  {filterStatus === 'inactive' && 'Aucun intervenant inactif'}
                  {filterStatus === 'all' && 'Aucun intervenant trouvé'}
                </p>
              </Card>
            ) : (
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b">
                  <CardTitle>Intervenants ({filteredLocations.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {filteredLocations.map((location) => {
                      const assignedMission = missions.find(m => m.intervenant_email === location.user_email);
                      const hasAlert = alerts.some(a => a.intervenant_email === location.user_email);

                      return (
                        <div key={location.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-gray-900">{location.user_name}</h4>
                                <Badge className={location.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}>
                                  {location.is_available ? 'Actif' : 'Inactif'}
                                </Badge>
                                {hasAlert && (
                                  <Badge className="bg-red-100 text-red-700 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Alerte
                                  </Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-gray-600">
                                <div>
                                  <p className="text-xs font-medium">Latitude</p>
                                  <p>{location.latitude.toFixed(6)}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium">Longitude</p>
                                  <p>{location.longitude.toFixed(6)}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium">Mis à jour</p>
                                  <p>{new Date(location.updated_date).toLocaleTimeString('fr-FR')}</p>
                                </div>
                                {assignedMission && (
                                  <div>
                                    <p className="text-xs font-medium">Mission</p>
                                    <p className="truncate">{assignedMission.store_name}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 flex-col sm:flex-row">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedIntervenant({ email: location.user_email, name: location.user_name });
                                  setShowHistory(true);
                                }}
                                className="flex items-center gap-2"
                              >
                                <History className="w-4 h-4" />
                                Historique
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                              >
                                <PhoneCall className="w-4 h-4" />
                                Contacter
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      </div>

      {/* Modal Historique */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Historique de positions</DialogTitle>
          </DialogHeader>
          {selectedIntervenant && (
            <LocationHistoryTracker 
              intervenantEmail={selectedIntervenant.email}
              intervenantName={selectedIntervenant.name}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}