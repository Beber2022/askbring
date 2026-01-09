import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  MapPin, 
  CreditCard, 
  Clock,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Store,
  FileText,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import ShoppingListEditor from '@/components/mission/ShoppingListEditor';
import StoreSelector from '@/components/mission/StoreSelector';
import { Star } from 'lucide-react';

const steps = [
  { id: 1, title: 'Magasin', icon: Store },
  { id: 2, title: 'Articles', icon: ShoppingCart },
  { id: 3, title: 'Livraison', icon: MapPin },
  { id: 4, title: 'Résumé', icon: FileText },
];

export default function NewMission() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { permission, requestPermission } = useNotifications();
  const [currentStep, setCurrentStep] = useState(1);
  const [user, setUser] = useState(null);
  const [storeCards, setStoreCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    store_name: '',
    store_address: '',
    shopping_list: [],
    delivery_address: '',
    notes: '',
    estimated_budget: 0,
    store_card_id: '',
    scheduled_time: ''
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        setLoyaltyPoints(userData.loyalty_points || 0);
        setFormData(prev => ({
          ...prev,
          delivery_address: userData.address || ''
        }));

        const cards = await base44.entities.StoreCard.filter({ user_email: userData.email });
        setStoreCards(cards);

        // Request notification permission on first mission
        if (permission !== 'granted' && permission !== 'denied') {
          setTimeout(() => {
            requestPermission();
          }, 2000);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const calculateServiceFee = () => {
    const baseFee = 5;
    const percentage = formData.estimated_budget * 0.05;
    return Math.max(baseFee, percentage);
  };

  const nextStep = () => {
    if (currentStep === 1 && !formData.store_name) {
      toast({ title: "Sélectionnez un magasin", variant: "destructive" });
      return;
    }
    if (currentStep === 2 && formData.shopping_list.length === 0) {
      toast({ title: "Ajoutez au moins un article", variant: "destructive" });
      return;
    }
    if (currentStep === 3 && !formData.delivery_address) {
      toast({ title: "Entrez une adresse de livraison", variant: "destructive" });
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const missionData = {
        client_email: user.email,
        client_name: user.full_name,
        store_name: formData.store_name,
        store_address: formData.store_address,
        shopping_list: formData.shopping_list,
        delivery_address: formData.delivery_address,
        notes: formData.notes,
        estimated_budget: formData.estimated_budget,
        service_fee: calculateServiceFee(),
        store_card_id: formData.store_card_id || null,
        scheduled_time: formData.scheduled_time || null,
        status: 'pending'
      };

      await base44.entities.Mission.create(missionData);
      
      toast({
        title: "Mission créée !",
        description: "Votre demande a été envoyée aux intervenants disponibles"
      });

      navigate(createPageUrl('ClientMissions'));
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la mission",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const relevantCards = storeCards.filter(
    card => card.store_name.toLowerCase().includes(formData.store_name.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Nouvelle Mission</h1>
        <p className="text-gray-600 mb-8">Créez une nouvelle demande de courses</p>

        {/* Steps indicator */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
          <div 
            className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
            style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
          />
          {steps.map((step, index) => (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  currentStep >= step.id
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {currentStep > step.id ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              <span className={`mt-2 text-xs font-medium ${
                currentStep >= step.id ? 'text-emerald-600' : 'text-gray-400'
              }`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Step 1: Store selection */}
            {currentStep === 1 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-emerald-600" />
                    Choisissez un magasin
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <StoreSelector
                    selected={formData.store_name}
                    onSelect={(name) => setFormData({ ...formData, store_name: name })}
                  />
                  
                  {formData.store_name && (
                    <div className="space-y-2">
                      <Label>Adresse du magasin (optionnel)</Label>
                      <Input
                        value={formData.store_address}
                        onChange={(e) => setFormData({ ...formData, store_address: e.target.value })}
                        placeholder="Ex: Carrefour Market, 10 rue de la République"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 2: Shopping list */}
            {currentStep === 2 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-emerald-600" />
                    Liste de courses
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ShoppingListEditor
                    items={formData.shopping_list}
                    onChange={(items) => setFormData({ ...formData, shopping_list: items })}
                  />

                  <div className="space-y-2">
                    <Label>Budget estimé (€)</Label>
                    <Input
                      type="number"
                      value={formData.estimated_budget}
                      onChange={(e) => setFormData({ ...formData, estimated_budget: parseFloat(e.target.value) || 0 })}
                      placeholder="Ex: 50"
                      min={0}
                    />
                    <p className="text-xs text-gray-500">
                      Estimation pour aider l'intervenant. Le montant exact sera facturé après.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Delivery */}
            {currentStep === 3 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    Livraison
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Adresse de livraison *</Label>
                    <Textarea
                      value={formData.delivery_address}
                      onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                      placeholder="Votre adresse complète..."
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Créneau souhaité (optionnel)</Label>
                    <Select
                      value={formData.scheduled_time}
                      onValueChange={(value) => setFormData({ ...formData, scheduled_time: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Dès que possible" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>Dès que possible</SelectItem>
                        <SelectItem value="morning">Ce matin (9h-12h)</SelectItem>
                        <SelectItem value="afternoon">Cet après-midi (14h-18h)</SelectItem>
                        <SelectItem value="evening">Ce soir (18h-21h)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {relevantCards.length > 0 && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Carte de fidélité
                      </Label>
                      <Select
                        value={formData.store_card_id}
                        onValueChange={(value) => setFormData({ ...formData, store_card_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une carte" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>Aucune carte</SelectItem>
                          {relevantCards.map((card) => (
                            <SelectItem key={card.id} value={card.id}>
                              {card.store_name} - ****{card.card_number.slice(-4)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Notes pour l'intervenant</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Instructions spéciales, code d'entrée, préférences..."
                      className="min-h-[80px]"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Summary */}
            {currentStep === 4 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    Récapitulatif
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">Magasin</p>
                      <p className="font-medium text-gray-900">{formData.store_name}</p>
                      {formData.store_address && (
                        <p className="text-sm text-gray-600">{formData.store_address}</p>
                      )}
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500 mb-2">Articles ({formData.shopping_list.length})</p>
                      <ul className="space-y-1">
                        {formData.shopping_list.map((item, index) => (
                          <li key={index} className="flex justify-between text-sm">
                            <span>{item.item}</span>
                            <span className="text-gray-500">x{item.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">Livraison</p>
                      <p className="font-medium text-gray-900">{formData.delivery_address}</p>
                    </div>

                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Budget estimé</span>
                        <span className="font-medium">{formData.estimated_budget.toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Frais de service</span>
                        <span className="font-medium">{calculateServiceFee().toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-emerald-200">
                        <span className="font-semibold text-gray-900">Total estimé</span>
                        <span className="font-bold text-emerald-600 text-lg">
                          {(formData.estimated_budget + calculateServiceFee()).toFixed(2)}€
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={nextStep}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 flex items-center gap-2"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 flex items-center gap-2"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Créer la mission
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}