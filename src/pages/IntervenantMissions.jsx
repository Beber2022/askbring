import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  MapPin, 
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Store,
  MessageSquare,
  Play,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

const statusConfig = {
  accepted: { label: 'Acceptée', color: 'bg-blue-100 text-blue-700', icon: CheckCircle, nextStatus: 'in_progress', nextLabel: 'Commencer' },
  in_progress: { label: 'En route', color: 'bg-purple-100 text-purple-700', icon: Truck, nextStatus: 'shopping', nextLabel: 'Arrivé au magasin' },
  shopping: { label: 'En courses', color: 'bg-indigo-100 text-indigo-700', icon: ShoppingCart, nextStatus: 'delivering', nextLabel: 'Courses terminées' },
  delivering: { label: 'En livraison', color: 'bg-emerald-100 text-emerald-700', icon: MapPin, nextStatus: 'completed', nextLabel: 'Livraison effectuée' },
  completed: { label: 'Terminée', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function IntervenantMissions() {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
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
    } catch (error) {
      console.error('Error loading missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (mission, newStatus) => {
    try {
      const updateData = { status: newStatus };
      if (newStatus === 'completed') {
        updateData.completed_time = new Date().toISOString();
      }
      
      await base44.entities.Mission.update(mission.id, updateData);
      toast({ title: "Statut mis à jour !" });
      loadData();
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const activeMissions = missions.filter(m => 
    !['completed', 'cancelled'].includes(m.status)
  );
  const completedMissions = missions.filter(m => 
    ['completed', 'cancelled'].includes(m.status)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const MissionCard = ({ mission }) => {
    const status = statusConfig[mission.status];
    const StatusIcon = status.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                  <Store className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{mission.store_name}</h3>
                  <p className="text-sm text-gray-500">Client: {mission.client_name}</p>
                </div>
              </div>
              <Badge className={`${status.color} flex items-center gap-1`}>
                <StatusIcon className="w-3 h-3" />
                {status.label}
              </Badge>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">{mission.delivery_address}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ShoppingCart className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  {mission.shopping_list?.length || 0} articles
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  {moment(mission.created_date).format('DD MMM, HH:mm')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="text-sm text-gray-500">Rémunération</p>
                <p className="text-lg font-bold text-emerald-600">
                  {(mission.service_fee || 0).toFixed(2)}€
                  {mission.tip > 0 && (
                    <span className="text-sm text-yellow-600 ml-1">+{mission.tip}€ tip</span>
                  )}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Link to={createPageUrl('Messages') + `?mission=${mission.id}`}>
                  <Button variant="outline" size="icon">
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </Link>
                
                {status.nextStatus && (
                  <Button
                    onClick={() => updateStatus(mission, status.nextStatus)}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  >
                    {status.nextStatus === 'in_progress' && <Play className="w-4 h-4 mr-2" />}
                    {status.nextStatus === 'completed' && <Check className="w-4 h-4 mr-2" />}
                    {status.nextLabel}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mes Missions</h1>
          <p className="text-gray-600 mt-1">Gérez vos missions de courses</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              En cours ({activeMissions.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Terminées ({completedMissions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeMissions.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <ShoppingCart className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune mission en cours</h3>
                  <p className="text-gray-500 text-center mb-6">
                    Consultez les missions disponibles pour commencer
                  </p>
                  <Link to={createPageUrl('AvailableMissions')}>
                    <Button className="bg-gradient-to-r from-emerald-500 to-teal-600">
                      Voir les missions disponibles
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {activeMissions.map((mission) => (
                    <MissionCard key={mission.id} mission={mission} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedMissions.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Pas encore d'historique</h3>
                  <p className="text-gray-500">Vos missions terminées apparaîtront ici</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {completedMissions.map((mission) => (
                    <MissionCard key={mission.id} mission={mission} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}