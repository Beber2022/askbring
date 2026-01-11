import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MapPin, Plus, Trash2, Star, Home, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import AddressAutocomplete from '@/components/address/AddressAutocomplete';

const LABEL_ICONS = {
  'Maison': Home,
  'Travail': Briefcase,
  'Autre': MapPin
};

export default function SavedAddressesManager({ user }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Maison',
    address: '',
    latitude: null,
    longitude: null
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const data = await base44.entities.SavedAddress.filter({ user_email: user.email });
      setAddresses(data);
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.address) {
      toast({ title: "Veuillez entrer une adresse", variant: "destructive" });
      return;
    }

    try {
      await base44.entities.SavedAddress.create({
        user_email: user.email,
        label: newAddress.label,
        address: newAddress.address,
        latitude: newAddress.latitude,
        longitude: newAddress.longitude,
        is_default: addresses.length === 0
      });

      toast({ title: "Adresse ajoutée !" });
      setNewAddress({ label: 'Maison', address: '', latitude: null, longitude: null });
      setShowForm(false);
      loadAddresses();
    } catch (error) {
      toast({ title: "Erreur lors de l'ajout", variant: "destructive" });
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await base44.entities.SavedAddress.delete(id);
      toast({ title: "Adresse supprimée" });
      loadAddresses();
    } catch (error) {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    }
  };

  const handleSetDefault = async (id) => {
    try {
      // Retirer le défaut de toutes les adresses
      for (const addr of addresses) {
        if (addr.is_default) {
          await base44.entities.SavedAddress.update(addr.id, { is_default: false });
        }
      }
      // Définir la nouvelle par défaut
      await base44.entities.SavedAddress.update(id, { is_default: true });
      toast({ title: "Adresse par défaut mise à jour" });
      loadAddresses();
    } catch (error) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 text-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            Adresses de livraison
          </CardTitle>
          <Button
            onClick={() => setShowForm(!showForm)}
            size="sm"
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200"
            >
              <div>
                <Label>Label</Label>
                <select
                  value={newAddress.label}
                  onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-1"
                >
                  <option value="Maison">🏠 Maison</option>
                  <option value="Travail">💼 Travail</option>
                  <option value="Autre">📍 Autre</option>
                </select>
              </div>
              <div>
                <Label>Adresse</Label>
                <AddressAutocomplete
                  value={newAddress.address}
                  onChange={(value) => setNewAddress({ ...newAddress, address: value })}
                  onSelectAddress={(addr) => setNewAddress({
                    ...newAddress,
                    address: addr.address,
                    latitude: addr.latitude,
                    longitude: addr.longitude
                  })}
                  placeholder="Entrez l'adresse complète"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddAddress} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  Enregistrer
                </Button>
                <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1">
                  Annuler
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {addresses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucune adresse enregistrée</p>
            <p className="text-sm">Ajoutez vos adresses fréquentes pour aller plus vite</p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => {
              const IconComponent = LABEL_ICONS[addr.label] || MapPin;
              return (
                <motion.div
                  key={addr.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{addr.label}</span>
                          {addr.is_default && (
                            <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                              <Star className="w-3 h-3 mr-1 fill-emerald-700" />
                              Par défaut
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{addr.address}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!addr.is_default && (
                        <Button
                          onClick={() => handleSetDefault(addr.id)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-emerald-600"
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDeleteAddress(addr.id)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}