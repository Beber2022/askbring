import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Edit2,
  X,
  Store,
  Calendar,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

const storeColors = {
  'Carrefour': 'from-blue-500 to-blue-700',
  'E.Leclerc': 'from-red-500 to-red-700',
  'Auchan': 'from-red-400 to-red-600',
  'Intermarché': 'from-rose-500 to-rose-700',
  'Lidl': 'from-blue-600 to-blue-800',
  'Monoprix': 'from-red-500 to-rose-600',
  'Franprix': 'from-rose-400 to-pink-600',
  'Autre': 'from-gray-500 to-gray-700',
};

const cardTypes = [
  { value: 'fidelity', label: 'Carte fidélité' },
  { value: 'discount', label: 'Carte réduction' },
  { value: 'membership', label: 'Carte membre' },
];

export default function StoreCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [formData, setFormData] = useState({
    store_name: '',
    card_number: '',
    card_type: 'fidelity',
    barcode: '',
    expiry_date: '',
    points_balance: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      const userCards = await base44.entities.StoreCard.filter({ user_email: userData.email });
      setCards(userCards);
    } catch (error) {
      console.error('Error loading cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      store_name: '',
      card_number: '',
      card_type: 'fidelity',
      barcode: '',
      expiry_date: '',
      points_balance: 0
    });
    setEditingCard(null);
  };

  const handleSubmit = async () => {
    if (!formData.store_name || !formData.card_number) {
      toast({ title: "Remplissez les champs obligatoires", variant: "destructive" });
      return;
    }

    try {
      if (editingCard) {
        await base44.entities.StoreCard.update(editingCard.id, formData);
        toast({ title: "Carte mise à jour !" });
      } else {
        await base44.entities.StoreCard.create({
          ...formData,
          user_email: user.email,
          is_active: true
        });
        toast({ title: "Carte ajoutée !" });
      }
      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de sauvegarder", variant: "destructive" });
    }
  };

  const handleEdit = (card) => {
    setEditingCard(card);
    setFormData({
      store_name: card.store_name,
      card_number: card.card_number,
      card_type: card.card_type,
      barcode: card.barcode || '',
      expiry_date: card.expiry_date || '',
      points_balance: card.points_balance || 0
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (cardId) => {
    try {
      await base44.entities.StoreCard.delete(cardId);
      toast({ title: "Carte supprimée" });
      loadData();
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes Cartes</h1>
            <p className="text-gray-600 mt-1">Gérez vos cartes de fidélité</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une carte
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCard ? 'Modifier la carte' : 'Nouvelle carte'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Magasin *</Label>
                  <Select
                    value={formData.store_name}
                    onValueChange={(value) => setFormData({ ...formData, store_name: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un magasin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(storeColors).map((store) => (
                        <SelectItem key={store} value={store}>{store}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Numéro de carte *</Label>
                  <Input
                    value={formData.card_number}
                    onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
                    placeholder="XXXX XXXX XXXX XXXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Type de carte</Label>
                  <Select
                    value={formData.card_type}
                    onValueChange={(value) => setFormData({ ...formData, card_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cardTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Code-barres (optionnel)</Label>
                  <Input
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Code-barres de la carte"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date d'expiration</Label>
                    <Input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Points</Label>
                    <Input
                      type="number"
                      value={formData.points_balance}
                      onChange={(e) => setFormData({ ...formData, points_balance: parseInt(e.target.value) || 0 })}
                      min={0}
                    />
                  </div>
                </div>

                <Button onClick={handleSubmit} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600">
                  {editingCard ? 'Mettre à jour' : 'Ajouter la carte'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {cards.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <CreditCard className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune carte</h3>
              <p className="text-gray-500 text-center mb-6">
                Ajoutez vos cartes de fidélité pour les utiliser lors de vos commandes
              </p>
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter ma première carte
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            <AnimatePresence>
              {cards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${storeColors[card.store_name] || storeColors['Autre']} p-6 text-white shadow-xl`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <p className="text-white/70 text-sm">
                            {cardTypes.find(t => t.value === card.card_type)?.label}
                          </p>
                          <h3 className="text-xl font-bold">{card.store_name}</h3>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(card)}
                            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(card.id)}
                            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <p className="font-mono text-lg tracking-wider mb-6">
                        {card.card_number.replace(/(.{4})/g, '$1 ').trim()}
                      </p>

                      <div className="flex justify-between items-end">
                        <div>
                          {card.expiry_date && (
                            <div className="flex items-center gap-1 text-white/70 text-sm">
                              <Calendar className="w-3 h-3" />
                              {new Date(card.expiry_date).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                        </div>
                        {card.points_balance > 0 && (
                          <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                            <Star className="w-4 h-4" />
                            <span className="font-semibold">{card.points_balance} pts</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}