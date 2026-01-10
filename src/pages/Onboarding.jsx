import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Package,
  MapPin,
  ArrowRight,
  CheckCircle,
  Phone,
  Bike,
  Car,
  Briefcase } from
'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import AddressAutocomplete from '@/components/address/AddressAutocomplete';

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    user_type: '',
    phone: '',
    address: '',
    bio: '',
    siret: '',
    transport_type: '',
    notification_preferences: {
      messages: true,
      mission_status: true,
      new_missions: true,
      mission_accepted: true,
      sound: true
    }
  });

  const handleUserTypeSelect = (type) => {
    setFormData({ ...formData, user_type: type });
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!formData.phone || !formData.address) {
      toast({ title: "Veuillez remplir tous les champs requis", variant: "destructive" });
      return;
    }

    if (formData.user_type === 'intervenant' && !formData.transport_type) {
      toast({ title: "Veuillez sélectionner un moyen de transport", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await base44.auth.updateMe({
        ...formData,
        onboarding_completed: true
      });

      toast({
        title: "Bienvenue sur AskBring ! 🎉",
        description: formData.user_type === 'client' ?
        "Vous pouvez maintenant créer votre première mission" :
        "Vous pouvez maintenant accepter des missions"
      });

      navigate(createPageUrl(formData.user_type === 'client' ? 'Home' : 'IntervenantDashboard'));
    } catch (error) {
      console.error('Error saving onboarding:', error);
      toast({ title: "Erreur lors de l'enregistrement", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}>

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bienvenue sur AskBring !</h1>
            <p className="text-gray-600">Configurez votre compte en quelques étapes</p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className={`w-12 h-2 rounded-full transition-all ${step >= 1 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
            <div className={`w-12 h-2 rounded-full transition-all ${step >= 2 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: User Type Selection */}
            {step === 1 &&
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}>

                <Card className="border-0 shadow-xl">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                      Comment souhaitez-vous utiliser AskBring ?
                    </h2>
                    <p className="text-gray-600 text-center mb-8">
                      Choisissez votre profil
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                      <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}>

                        <Card
                        className="cursor-pointer border-2 border-gray-200 hover:border-emerald-500 hover:shadow-lg transition-all"
                        onClick={() => handleUserTypeSelect('client')}>

                          <CardContent className="p-6 text-center">
                            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                              <User className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Askeur/Askeuse (Demandeur)</h3>
                            <p className="text-sm text-gray-600 mb-4">Je veux faire mes courses

                          </p>
                            <ul className="text-sm text-left space-y-2 text-gray-600">
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                Créer des missions
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                Suivi en temps réel
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                Livraison à domicile
                              </li>
                            </ul>
                          </CardContent>
                        </Card>
                      </motion.div>

                      <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}>

                        <Card
                        className="cursor-pointer border-2 border-gray-200 hover:border-emerald-500 hover:shadow-lg transition-all"
                        onClick={() => handleUserTypeSelect('intervenant')}>

                          <CardContent className="p-6 text-center">
                            <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                              <Briefcase className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Bringeur/Bringeuse (Intervenant)</h3>
                            <p className="text-sm text-gray-600 mb-4">Je veux rendant service

                          </p>
                            <ul className="text-sm text-left space-y-2 text-gray-600">
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                Revenus flexibles
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                Tournées optimisées
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                Horaires libres
                              </li>
                            </ul>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            }

            {/* Step 2: Details */}
            {step === 2 &&
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}>

                <Card className="border-0 shadow-xl">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                      Complétez votre profil
                    </h2>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone *</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="06 12 34 56 78"
                          className="pl-10" />

                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">
                          {formData.user_type === 'client' ? 'Adresse principale *' : 'Ville d\'opération *'}
                        </Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                          <AddressAutocomplete
                          value={formData.address}
                          onChange={(value) => setFormData({ ...formData, address: value })}
                          onSelectAddress={(address) => setFormData({ ...formData, address: address.address })}
                          placeholder={formData.user_type === 'client' ? "123 rue de la République, Paris" : "Paris, Île-de-France"} />

                        </div>
                      </div>

                      {formData.user_type === 'intervenant' &&
                    <>
                          <div className="space-y-2">
                            <Label htmlFor="transport">Moyen de transport *</Label>
                            <Select
                          value={formData.transport_type}
                          onValueChange={(value) => setFormData({ ...formData, transport_type: value })}>

                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez votre moyen de transport" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="foot">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    À pied
                                  </div>
                                </SelectItem>
                                <SelectItem value="bike">
                                  <div className="flex items-center gap-2">
                                    <Bike className="w-4 h-4" />
                                    Vélo
                                  </div>
                                </SelectItem>
                                <SelectItem value="scooter">
                                  <div className="flex items-center gap-2">
                                    <Bike className="w-4 h-4" />
                                    Scooter
                                  </div>
                                </SelectItem>
                                <SelectItem value="car">
                                  <div className="flex items-center gap-2">
                                    <Car className="w-4 h-4" />
                                    Voiture
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="siret">SIRET (optionnel)</Label>
                            <Input
                          id="siret"
                          value={formData.siret}
                          onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                          placeholder="123 456 789 00012" />

                            <p className="text-xs text-gray-500">
                              Pour les auto-entrepreneurs
                            </p>
                          </div>
                        </>
                    }

                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio (optionnel)</Label>
                        <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder={
                        formData.user_type === 'client' ?
                        "Parlez-nous un peu de vous..." :
                        "Présentez-vous aux clients (expérience, disponibilités...)"
                        }
                        className="min-h-[80px]" />

                      </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                      <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1">

                        Retour
                      </Button>
                      <Button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">

                        {loading ?
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> :

                      <>
                            Commencer
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                      }
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            }
          </AnimatePresence>
        </motion.div>
      </div>
    </div>);

}