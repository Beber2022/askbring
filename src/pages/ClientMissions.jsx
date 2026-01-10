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
  Star,
  Eye,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

const statusConfig = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  accepted: { label: 'Acceptée', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  in_progress: { label: 'En cours', color: 'bg-purple-100 text-purple-700', icon: Truck },
  shopping: { label: 'En courses', color: 'bg-indigo-100 text-indigo-700', icon: ShoppingCart },
  delivering: { label: 'En livraison', color: 'bg-emerald-100 text-emerald-700', icon: MapPin },
  completed: { label: 'Terminée', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function ClientMissions() {
  const { toast } = useToast();
  const [missions, setMissions] = useState([]);
  const [filteredMissions, setFilteredMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [missionToCancel, setMissionToCancel] = useState(null);
  const [sortBy, setSortBy] = useState('-created_date');
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      const userMissions = await base44.entities.Mission.filter(
        { client_email: userData.email },
        '-created_date'
      );
      setMissions(userMissions);
    } catch (error) {
      console.error('Error loading missions:', error);
    } finally {
      setLoading(false);
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
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
          <CardContent className="p-0">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                    <Store className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{mission.store_name}</h3>
                    <p className="text-sm text-gray-500">
                      {moment(mission.created_date).format('DD MMM YYYY, HH:mm')}
                    </p>
                  </div>
                </div>
                <Badge className={`${status.color} flex items-center gap-1`}>
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
                </Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">{mission.delivery_address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <ShoppingCart className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {mission.shopping_list?.length || 0} article(s)
                  </span>
                </div>
              </div>

              {mission.intervenant_name && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700">
                      {mission.intervenant_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{mission.intervenant_name}</p>
                    <p className="text-xs text-gray-500">Votre intervenant</p>
                  </div>
                  <Link to={createPageUrl('Messages') + `?mission=${mission.id}`}>
                    <Button variant="ghost" size="icon" className="text-emerald-600">
                      <MessageSquare className="w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-500">Total estimé</p>
                  <p className="text-lg font-bold text-emerald-600">
                    {((mission.estimated_budget || 0) + (mission.service_fee || 0)).toFixed(2)}€
                  </p>
                </div>
                <Link to={createPageUrl('MissionDetails') + `?id=${mission.id}`}>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Voir détails
                  </Button>
                </Link>
              </div>
            </div>

            {['in_progress', 'shopping', 'delivering'].includes(mission.status) && (
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3">
                <Link to={createPageUrl('TrackMission') + `?id=${mission.id}`}>
                  <Button variant="secondary" className="w-full bg-white/20 hover:bg-white/30 text-white border-0">
                    <MapPin className="w-4 h-4 mr-2" />
                    Suivre en temps réel
                  </Button>
                </Link>
              </div>
            )}

            {mission.status === 'completed' && !mission.rating && (
              <div className="bg-yellow-50 px-6 py-3 border-t border-yellow-100">
                <Link to={createPageUrl('RateMission') + `?id=${mission.id}`}>
                  <Button variant="ghost" className="w-full text-yellow-700 hover:bg-yellow-100">
                    <Star className="w-4 h-4 mr-2" />
                    Noter cette mission
                  </Button>
                </Link>
              </div>
            )}
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes Missions</h1>
            <p className="text-gray-600 mt-1">Suivez vos demandes de courses</p>
          </div>
          <Link to={createPageUrl('NewMission')}>
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle mission
            </Button>
          </Link>
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
                    Commandez vos courses et un intervenant s'en occupera !
                  </p>
                  <Link to={createPageUrl('NewMission')}>
                    <Button className="bg-gradient-to-r from-emerald-500 to-teal-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Créer une mission
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
        <AlertDialog open={!!missionToCancel} onOpenChange={() => setMissionToCancel(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Annuler cette mission ?</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir annuler cette mission ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Retour</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelMission}
                className="bg-red-600 hover:bg-red-700"
              >
                Oui, annuler
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </div>
  );
}