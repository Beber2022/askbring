import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Repeat, 
  Calendar,
  Store,
  ShoppingCart,
  Clock,
  Pause,
  Play,
  Edit,
  Trash2,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

const frequencyLabels = {
  daily: 'Tous les jours',
  weekly: 'Chaque semaine',
  biweekly: 'Toutes les deux semaines',
  monthly: 'Chaque mois'
};

const dayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export default function RecurringMissions() {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    try {
      const user = await base44.auth.me();
      const recurringMissions = await base44.entities.RecurringMission.filter(
        { client_email: user.email },
        '-created_date'
      );
      setMissions(recurringMissions);
    } catch (error) {
      console.error('Error loading missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (mission) => {
    try {
      await base44.entities.RecurringMission.update(mission.id, {
        is_active: !mission.is_active
      });
      await loadMissions();
      toast({
        title: mission.is_active ? "Mission pausée" : "Mission activée",
        description: mission.is_active 
          ? "La mission ne sera plus créée automatiquement" 
          : "La mission sera créée automatiquement"
      });
    } catch (error) {
      toast({ 
        title: "Erreur", 
        description: "Impossible de modifier la mission",
        variant: "destructive" 
      });
    }
  };

  const deleteMission = async () => {
    try {
      await base44.entities.RecurringMission.delete(deleteId);
      await loadMissions();
      toast({ title: "Mission supprimée" });
      setDeleteId(null);
    } catch (error) {
      toast({ 
        title: "Erreur", 
        description: "Impossible de supprimer la mission",
        variant: "destructive" 
      });
    }
  };

  const getFrequencyText = (mission) => {
    let text = frequencyLabels[mission.frequency];
    if (mission.frequency === 'weekly' || mission.frequency === 'biweekly') {
      text += ` - ${dayLabels[mission.day_of_week]}`;
    } else if (mission.frequency === 'monthly') {
      text += ` - Le ${mission.day_of_month}`;
    }
    if (mission.preferred_time) {
      text += ` à ${mission.preferred_time}`;
    }
    return text;
  };

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Repeat className="w-8 h-8 text-emerald-600" />
              Missions Récurrentes
            </h1>
            <p className="text-gray-500 mt-1">
              Définissez vos missions qui se répètent automatiquement
            </p>
          </div>
          <Link to={createPageUrl('CreateRecurringMission')}>
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
              <Plus className="w-5 h-5 mr-2" />
              Nouvelle mission récurrente
            </Button>
          </Link>
        </div>

        {missions.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Repeat className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucune mission récurrente
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Créez des missions qui se répètent automatiquement pour gagner du temps
              </p>
              <Link to={createPageUrl('CreateRecurringMission')}>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                  <Plus className="w-5 h-5 mr-2" />
                  Créer ma première mission récurrente
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            <AnimatePresence>
              {missions.map((mission) => (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  layout
                >
                  <Card className={`border-0 shadow-lg ${!mission.is_active ? 'opacity-60' : ''}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-xl">{mission.title}</CardTitle>
                            <Badge variant={mission.is_active ? 'default' : 'secondary'}>
                              {mission.is_active ? 'Active' : 'Pausée'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {getFrequencyText(mission)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={mission.is_active}
                            onCheckedChange={() => toggleActive(mission)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(mission.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Store className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{mission.store_name}</p>
                            <p className="text-xs text-gray-500">{mission.store_address}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Livraison</p>
                            <p className="text-xs text-gray-500">{mission.delivery_address}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <ShoppingCart className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {mission.shopping_list?.length || 0} articles
                            </p>
                            <p className="text-xs text-gray-500">
                              Budget: {(mission.estimated_budget || 0).toFixed(2)}€
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Prochaine: {mission.next_execution_date 
                              ? moment(mission.next_execution_date).format('DD MMM YYYY à HH:mm')
                              : 'À définir'}
                          </span>
                          <span>
                            {mission.total_executions || 0} exécutions
                          </span>
                        </div>
                        <Link to={createPageUrl('CreateRecurringMission') + `?edit=${mission.id}`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette mission récurrente ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La mission ne sera plus créée automatiquement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteMission}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}