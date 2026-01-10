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
  CheckCircle,
  Tag
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
import AddressAutocomplete from '@/components/address/AddressAutocomplete';
import { Star } from 'lucide-react';
import { calculateDynamicPricing, PricingBreakdown } from '@/components/pricing/DynamicPricing';

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
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [pricingBreakdown, setPricingBreakdown] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const [formData, setFormData] = useState({
    store_name: '',
    store_address: '',
    category: 'courses_alimentaires',
    shopping_list: [],
    delivery_address: '',
    notes: '',
    estimated_budget: 0,
    store_card_id: '',
    scheduled_time: '',
    loyalty_discount: 0,
    client_preferences: null
  });
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        setLoyaltyPoints(userData.loyalty_points || 0);
        
        // Pre-fill from URL params (from AskAI)
        const params = new URLSearchParams(window.location.search);
        const aiStore = params.get('store');
        const aiAddress = params.get('address');
        const aiTime = params.get('time');
        const aiCategory = params.get('category');
        const aiItems = params.get('items');
        const aiNotes = params.get('notes');
        
        // Pre-fill with user preferences or AI data
        const prefNotes = [
          userData.delivery_instructions,
          userData.product_preferences,
          userData.special_requirements
        ].filter(Boolean).join('\n\n');
        
        const initialFormData = {
          store_name: aiStore || '',
          delivery_address: aiAddress || userData.address || '',
          scheduled_time: aiTime || '',
          category: aiCategory || 'courses_alimentaires',
          notes: aiNotes || prefNotes,
          shopping_list: aiItems ? JSON.parse(aiItems).map(item => ({ item, quantity: 1, checked: false })) : [],
          client_preferences: {
            preferred_stores: userData.preferred_stores,
            delivery_instructions: userData.delivery_instructions,
            product_preferences: userData.product_preferences,
            communication_preference: userData.communication_preference,
            special_requirements: userData.special_requirements
          }
        };
        
        setFormData(prev => ({ ...prev, ...initialFormData }));

        const cards = await base44.entities.StoreCard.filter({ user_email: userData.email });
        setStoreCards(cards);

        const addresses = await base44.entities.SavedAddress.filter({ user_email: userData.email });
        setSavedAddresses(addresses);
        
        // Use default address if exists
        const defaultAddr = addresses.find(a => a.is_default);
        if (defaultAddr && !formData.delivery_address) {
          setFormData(prev => ({ ...prev, delivery_address: defaultAddr.address }));
        }

        // Request notification permission on first mission
        if (permission !== 'granted' && permission !== 'denied') {
          setTimeout(() => {
            requestPermission();
          }, 2000);
        }
        
        // Get user location for distance calculation
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setUserLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              });
            },
            (error) => console.log('Geolocation error:', error)
          );
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const calculateServiceFee = async () => {
    // Calculate distance if we have both locations
    let distance = 0;
    if (userLocation && formData.delivery_lat && formData.delivery_lng) {
      const R = 6371;
      const dLat = (formData.delivery_lat - userLocation.latitude) * Math.PI / 180;
      const dLon = (formData.delivery_lng - userLocation.longitude) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(userLocation.latitude * Math.PI / 180) * 
                Math.cos(formData.delivery_lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      distance = R * c;
    }

    const { serviceFee, breakdown } = await calculateDynamicPricing({
      distance,
      category: formData.category,
      scheduledTime: formData.scheduled_time,
      estimatedBudget: formData.estimated_budget
    });
    
    setPricingBreakdown(breakdown);
    return serviceFee;
  };

  const nextStep = async () => {
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
    
    // Calculate pricing dynamically when moving to summary
    if (currentStep === 3) {
      const fee = await calculateServiceFee();
      setFormData(prev => ({ ...prev, service_fee: fee }));
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const serviceFee = await calculateServiceFee();
      const finalServiceFee = Math.max(0, serviceFee - (formData.loyalty_discount || 0));
      
      const missionData = {
        client_email: user.email,
        client_name: user.full_name,
        client_phone: user.phone,
        client_preferences: formData.client_preferences,
        store_name: formData.store_name,
        store_address: formData.store_address,
        category: formData.category,
        shopping_list: formData.shopping_list,
        delivery_address: formData.delivery_address,
        notes: formData.notes,
        estimated_budget: formData.estimated_budget,
        service_fee: finalServiceFee,
        store_card_id: formData.store_card_id || null,
        scheduled_time: formData.scheduled_time || null,
        status: 'pending'
      };

      await base44.entities.Mission.create(missionData);

      // Deduct loyalty points if used
      if (formData.loyalty_discount > 0) {
        const pointsUsed = formData.loyalty_discount === 5 ? 100 : formData.loyalty_discount === 10 ? 200 : 300;
        await base44.auth.updateMe({
          loyalty_points: loyaltyPoints - pointsUsed
        });
      }
      
      toast({
        title: "Mission créée !",
        description: formData.loyalty_discount > 0 ? `Réduction de ${formData.loyalty_discount}€ appliquée !` : "Votre demande a été envoyée aux intervenants disponibles"
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
                    <>
                      <div className="space-y-2">
                        <Label>Adresse du magasin (optionnel)</Label>
                        <Input
                          value={formData.store_address}
                          onChange={(e) => setFormData({ ...formData, store_address: e.target.value })}
                          placeholder="Ex: Carrefour Market, 10 rue de la République"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Tag className="w-4 h-4" />
                          Catégorie de mission
                        </Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="courses_alimentaires">🛒 Courses alimentaires</SelectItem>
                            <SelectItem value="livraison_urgente">⚡ Livraison urgente</SelectItem>
                            <SelectItem value="taches_menageres">🧹 Tâches ménagères</SelectItem>
                            <SelectItem value="bricolage">🔧 Bricolage</SelectItem>
                            <SelectItem value="jardinage">🌱 Jardinage</SelectItem>
                            <SelectItem value="autre">📦 Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
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
                    storeName={formData.store_name}
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
                    <AddressAutocomplete
                      value={formData.delivery_address}
                      onChange={(value) => setFormData({ ...formData, delivery_address: value })}
                      onSelectAddress={(address) => {
                        setFormData({
                          ...formData,
                          delivery_address: address.address,
                          delivery_lat: address.latitude,
                          delivery_lng: address.longitude
                        });
                      }}
                      placeholder="Commencez à taper ou sélectionnez une adresse"
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
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-900 mb-1">Carte de fidélité (Information)</h4>
                          <p className="text-sm text-blue-700 mb-3">
                            Le Bringeur utilisera sa propre carte de fidélité pour gagner des points. 
                            Vous pouvez indiquer votre numéro ci-dessous à titre informatif uniquement.
                          </p>
                          <Select
                            value={formData.store_card_id}
                            onValueChange={(value) => setFormData({ ...formData, store_card_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Ma carte (optionnel)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={null}>Ne pas mentionner</SelectItem>
                              {relevantCards.map((card) => (
                                <SelectItem key={card.id} value={card.id}>
                                  {card.store_name} - ****{card.card_number.slice(-4)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Notes pour le Bringeur</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Instructions spéciales, code d'entrée, préférences..."
                      className="min-h-[100px]"
                    />
                    {formData.client_preferences && (formData.client_preferences.delivery_instructions || formData.client_preferences.product_preferences) && (
                      <p className="text-xs text-emerald-600">
                        ✓ Vos préférences ont été automatiquement ajoutées
                      </p>
                    )}
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
                 {/* Loyalty Discount Option */}
                 {loyaltyPoints >= 100 && (
                   <div className="p-4 border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
                     <div className="flex items-center gap-3 mb-3">
                       <Star className="w-5 h-5 text-emerald-600" />
                       <div>
                         <h4 className="font-semibold text-gray-900">Points de fidélité</h4>
                         <p className="text-sm text-gray-600">Vous avez {loyaltyPoints} points</p>
                       </div>
                     </div>
                     <div className="flex flex-wrap gap-2">
                       {loyaltyPoints >= 100 && (
                         <Button
                           type="button"
                           variant={formData.loyalty_discount === 5 ? "default" : "outline"}
                           size="sm"
                           onClick={() => setFormData({...formData, loyalty_discount: formData.loyalty_discount === 5 ? 0 : 5})}
                           className={formData.loyalty_discount === 5 ? "bg-emerald-500" : ""}
                         >
                           -5€ (100 pts)
                         </Button>
                       )}
                       {loyaltyPoints >= 200 && (
                         <Button
                           type="button"
                           variant={formData.loyalty_discount === 10 ? "default" : "outline"}
                           size="sm"
                           onClick={() => setFormData({...formData, loyalty_discount: formData.loyalty_discount === 10 ? 0 : 10})}
                           className={formData.loyalty_discount === 10 ? "bg-emerald-500" : ""}
                         >
                           -10€ (200 pts)
                         </Button>
                       )}
                       {loyaltyPoints >= 300 && (
                         <Button
                           type="button"
                           variant={formData.loyalty_discount === 15 ? "default" : "outline"}
                           size="sm"
                           onClick={() => setFormData({...formData, loyalty_discount: formData.loyalty_discount === 15 ? 0 : 15})}
                           className={formData.loyalty_discount === 15 ? "bg-emerald-500" : ""}
                         >
                           Gratuit (300 pts)
                         </Button>
                       )}
                     </div>
                   </div>
                 )}

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
                        <span className="font-medium">{(formData.service_fee || 5).toFixed(2)}€</span>
                      </div>
                      {pricingBreakdown && (
                        <PricingBreakdown breakdown={pricingBreakdown} serviceFee={formData.service_fee} />
                      )}
                      {formData.loyalty_discount > 0 && (
                        <div className="flex justify-between items-center mb-2 text-emerald-700">
                          <span>Réduction fidélité</span>
                          <span className="font-medium">-{formData.loyalty_discount.toFixed(2)}€</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-emerald-200">
                        <span className="font-semibold text-gray-900">Total estimé</span>
                        <span className="font-bold text-emerald-600 text-lg">
                          {(formData.estimated_budget + Math.max(0, (formData.service_fee || 5) - (formData.loyalty_discount || 0))).toFixed(2)}€
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