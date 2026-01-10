import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Clock, Plus, Trash2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function WorkingHoursManager({ user }) {
  const [workingHours, setWorkingHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDay, setEditingDay] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadWorkingHours();
  }, []);

  const loadWorkingHours = async () => {
    try {
      const hours = await base44.entities.WorkingHours.filter(
        { user_email: user.email },
        'day_of_week'
      );
      
      // Initialize all days if not existing
      if (hours.length === 0) {
        const defaultHours = days.map((_, index) => ({
          day_of_week: index,
          start_time: '08:00',
          end_time: '18:00',
          is_available: true
        }));
        setWorkingHours(defaultHours);
      } else {
        setWorkingHours(hours);
      }
    } catch (error) {
      console.error('Error loading working hours:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDay = async (dayData) => {
    try {
      const existing = workingHours.find(h => h.day_of_week === dayData.day_of_week && h.id);
      
      if (existing) {
        await base44.entities.WorkingHours.update(existing.id, dayData);
      } else {
        await base44.entities.WorkingHours.create({
          ...dayData,
          user_email: user.email
        });
      }
      
      toast({ title: "Horaires sauvegardés" });
      setOpenDialog(false);
      setEditingDay(null);
      await loadWorkingHours();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les horaires",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDay = async (dayOfWeek) => {
    const existing = workingHours.find(h => h.day_of_week === dayOfWeek && h.id);
    if (!existing) return;

    try {
      await base44.entities.WorkingHours.delete(existing.id);
      toast({ title: "Horaires supprimés" });
      await loadWorkingHours();
    } catch (error) {
      toast({
        title: "Erreur",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            Mes horaires de travail
          </CardTitle>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-1" />
                Gérer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Configurer vos horaires</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {days.map((day, index) => {
                  const dayData = workingHours.find(h => h.day_of_week === index);
                  const [start, setStart] = useState(dayData?.start_time || '08:00');
                  const [end, setEnd] = useState(dayData?.end_time || '18:00');
                  const [isAvailable, setIsAvailable] = useState(dayData?.is_available !== false);

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{day}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Disponible</span>
                          <Switch
                            checked={isAvailable}
                            onCheckedChange={setIsAvailable}
                          />
                        </div>
                      </div>

                      {isAvailable && (
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-xs text-gray-600 block mb-1">Début</label>
                            <Input
                              type="time"
                              value={start}
                              onChange={(e) => setStart(e.target.value)}
                              className="h-8"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-gray-600 block mb-1">Fin</label>
                            <Input
                              type="time"
                              value={end}
                              onChange={(e) => setEnd(e.target.value)}
                              className="h-8"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              size="sm"
                              onClick={() => handleSaveDay({
                                day_of_week: index,
                                start_time: start,
                                end_time: end,
                                is_available: isAvailable
                              })}
                              className="bg-emerald-600 hover:bg-emerald-700 h-8"
                            >
                              <Save className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {days.map((day, index) => {
            const dayData = workingHours.find(h => h.day_of_week === index);
            const isAvailable = dayData?.is_available !== false;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{day}</p>
                  {isAvailable && dayData ? (
                    <p className="text-sm text-gray-600">
                      {dayData.start_time} - {dayData.end_time}
                    </p>
                  ) : (
                    <Badge variant="secondary" className="text-xs mt-1">
                      Indisponible
                    </Badge>
                  )}
                </div>
                {dayData?.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteDay(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}