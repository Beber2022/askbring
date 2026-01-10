import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Save,
  Calendar,
  Clock,
  Store,
  MapPin,
  ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import StoreSelector from '@/components/mission/StoreSelector';
import ShoppingListEditor from '@/components/mission/ShoppingListEditor';
import AddressAutocomplete from '@/components/address/AddressAutocomplete';

export default function CreateRecurringMission() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    frequency: 'weekly',
    day_of_week: 1,
    day_of_month: 1,
    preferred_time: '10:00',
    category: 'courses_alimentaires',
    store_name: '',
    store_address: '',
    delivery_address: '',
    shopping_list: [],
    estimated_budget: 0,
    service_fee: 5,
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');
    
    if (editId) {
      setEditMode(true);
      const missions = await base44.entities.RecurringMission.filter({ id: editId });
      if (missions.length > 0) {
        setFormData(missions[0]);
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.store_name || !formData.delivery_address || formData.shopping_list.length === 0) {
      toast({ 
        title: "Champs manquants", 
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    try {
      const user = await base44.auth.me();
      
      const missionData = {
        ...formData,
        client_email: user.email,
        client_name: user.full_name,
        client_phone: user.phone,
        next_execution_date: calculateNextExecution()
      };

      if (editMode) {
        await base44.entities.RecurringMission.update(formData.id, missionData);
        toast({ title: "Mission modifiée avec succès" });
      } else {
        await base44.entities.RecurringMission.create(missionData);
        toast({ title: "Mission récurrente créée avec succès" });
      }
      
      navigate(createPageUrl('RecurringMissions'));
    } catch (error) {
      toast({ 
        title: "Erreur", 
        description: "Impossible de sauvegarder la mission",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateNextExecution = () => {
    const now = new Date();
    const [hours, minutes] = (formData.preferred_time || '10:00').split(':');
    
    let next = new Date();
    next.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    if (formData.frequency === 'daily') {
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
    } else if (formData.frequency === 'weekly') {
      const targetDay = formData.day_of_week || 1;
      const currentDay = next.getDay();
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0 || (daysToAdd === 0 && next <= now)) {
        daysToAdd += 7;
      }
      next.setDate(next.getDate() + daysToAdd);
    } else if (formData.frequency === 'biweekly') {
      const targetDay = formData.day_of_week || 1;
      const currentDay = next.getDay();
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0 || (daysToAdd === 0 && next <= now)) {
        daysToAdd += 14;
      }
      next.setDate(next.getDate() + daysToAdd);
    } else if (formData.frequency === 'monthly') {
      const targetDate = formData.day_of_month || 1;
      next.setDate(targetDate);
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
    }
    
    return next.toISOString();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl('RecurringMissions'))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {editMode ? 'Modifier' : 'Créer'} une mission récurrente
            </h1>
            <p className="text-gray-500 mt-1">
              Configurez une mission qui se répète automatiquement
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Titre de la mission *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Ex: Courses hebdomadaires"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Catégorie</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({...formData, category: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="courses_alimentaires">🛒 Courses alimentaires</SelectItem>
                      <SelectItem value="livraison_urgente">⚡ Livraison urgente</SelectItem>
                      <SelectItem value="taches_menageres">🧹 Tâches ménagères</SelectItem>
                      <SelectItem value="bricolage">🔨 Bricolage</SelectItem>
                      <SelectItem value="jardinage">🌱 Jardinage</SelectItem>
                      <SelectItem value="autre">📦 Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Frequency */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Fréquence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Répétition *</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(v) => setFormData({...formData, frequency: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Tous les jours</SelectItem>
                    <SelectItem value="weekly">Chaque semaine</SelectItem>
                    <SelectItem value="biweekly">Toutes les deux semaines</SelectItem>
                    <SelectItem value="monthly">Chaque mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formData.frequency === 'weekly' || formData.frequency === 'biweekly') && (
                <div>
                  <Label>Jour de la semaine</Label>
                  <Select
                    value={formData.day_of_week?.toString()}
                    onValueChange={(v) => setFormData({...formData, day_of_week: parseInt(v)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Dimanche</SelectItem>
                      <SelectItem value="1">Lundi</SelectItem>
                      <SelectItem value="2">Mardi</SelectItem>
                      <SelectItem value="3">Mercredi</SelectItem>
                      <SelectItem value="4">Jeudi</SelectItem>
                      <SelectItem value="5">Vendredi</SelectItem>
                      <SelectItem value="6">Samedi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.frequency === 'monthly' && (
                <div>
                  <Label>Jour du mois</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.day_of_month}
                    onChange={(e) => setFormData({...formData, day_of_month: parseInt(e.target.value)})}
                  />
                </div>
              )}

              <div>
                <Label>Heure préférée</Label>
                <Input
                  type="time"
                  value={formData.preferred_time}
                  onChange={(e) => setFormData({...formData, preferred_time: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Store */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-600" />
                Magasin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StoreSelector
                selected={formData.store_name}
                onSelect={(store) => setFormData({...formData, store_name: store})}
              />
            </CardContent>
          </Card>

          {/* Shopping List */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                Liste de courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ShoppingListEditor
                items={formData.shopping_list}
                onChange={(list) => setFormData({...formData, shopping_list: list})}
              />
              <div className="mt-4">
                <Label>Budget estimé</Label>
                <Input
                  type="number"
                  value={formData.estimated_budget}
                  onChange={(e) => setFormData({...formData, estimated_budget: parseFloat(e.target.value)})}
                  placeholder="0"
                />
              </div>
            </CardContent>
          </Card>

          {/* Delivery */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                Livraison
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Adresse de livraison *</Label>
                <AddressAutocomplete
                  value={formData.delivery_address}
                  onChange={(address) => setFormData({...formData, delivery_address: address})}
                />
              </div>

              <div>
                <Label>Notes spéciales (optionnel)</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Instructions spéciales, codes d'accès, etc."
                  className="h-24"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                {editMode ? 'Enregistrer les modifications' : 'Créer la mission récurrente'}
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}