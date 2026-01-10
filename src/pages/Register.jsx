import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  User,
  Mail,
  Phone,
  Lock,
  MapPin,
  Briefcase,
  CheckCircle,
  ArrowRight,
  Users,
  Truck,
  Award
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userType, setUserType] = useState('client');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    password: '',
    password_confirm: '',
    // Client specific
    delivery_instructions: '',
    // Intervenant specific
    vehicle_type: '',
    experience: '',
    service_fee_preference: ''
  });

  useEffect(() => {
    // Check if already authenticated
    const checkAuth = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        navigate(createPageUrl('Home'));
      }
    };
    checkAuth();

    // Pre-fill from URL params
    const params = new URLSearchParams(window.location.search);
    const name = params.get('name');
    const email = params.get('email');
    const type = params.get('type');
    const phone = params.get('phone');

    if (name) setFormData(prev => ({ ...prev, full_name: name }));
    if (email) setFormData(prev => ({ ...prev, email }));
    if (phone) setFormData(prev => ({ ...prev, phone }));
    if (type && ['client', 'intervenant'].includes(type)) setUserType(type);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation communes
    if (!formData.full_name || !formData.email || !formData.phone || !formData.city || !formData.postal_code || !formData.password) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Email invalide",
        description: "Veuillez entrer une adresse email valide",
        variant: "destructive"
      });
      return;
    }

    // Validation password
    if (formData.password.length < 8) {
      toast({
        title: "Mot de passe trop court",
        description: "Le mot de passe doit contenir au moins 8 caractères",
        variant: "destructive"
      });
      return;
    }

    if (formData.password !== formData.password_confirm) {
      toast({
        title: "Mots de passe différents",
        description: "Les deux mots de passe ne correspondent pas",
        variant: "destructive"
      });
      return;
    }

    // Validation intervenant
    if (userType === 'intervenant' && (!formData.vehicle_type || !formData.experience)) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs du formulaire Bringeur",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create account via Base44 authentication
      const result = await base44.auth.register(formData.email, formData.password);
      
      if (result && result.user) {
        // Update user profile with additional data
        await base44.auth.updateMe({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postal_code,
          user_type: userType,
          // Client specific
          ...(userType === 'client' && {
            delivery_instructions: formData.delivery_instructions
          }),
          // Intervenant specific
          ...(userType === 'intervenant' && {
            vehicle_type: formData.vehicle_type,
            experience: formData.experience,
            service_fee_preference: formData.service_fee_preference || null
          })
        });

        toast({
          title: "Compte créé !",
          description: "Bienvenue sur AskBring"
        });

        // Redirect to onboarding
        navigate(createPageUrl('Onboarding'));
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le compte. Cet email existe peut-être déjà.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            Rejoignez AskBring
          </h1>
          <p className="text-gray-600 text-lg">
            La plateforme qui connecte clients et Bringeurs
          </p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardContent className="p-8">
            <Tabs value={userType} onValueChange={setUserType} className="mb-6">
              <TabsList className="grid w-full grid-cols-2 h-14">
                <TabsTrigger value="client" className="text-base">
                  <User className="w-5 h-5 mr-2" />
                  Je suis un Client
                </TabsTrigger>
                <TabsTrigger value="intervenant" className="text-base">
                  <Users className="w-5 h-5 mr-2" />
                  Je suis un Bringeur
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {userType === 'client' ? (
              <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <h3 className="font-semibold text-emerald-900 mb-2">En tant que Client, vous pouvez :</h3>
                <ul className="space-y-1 text-sm text-emerald-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Faire vos courses sans vous déplacer
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Déléguer vos tâches quotidiennes
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Gagner du temps pour ce qui compte vraiment
                  </li>
                </ul>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-2">En tant que Bringeur, vous pouvez :</h3>
                <ul className="space-y-1 text-sm text-purple-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Gagner de l'argent avec un emploi flexible
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Choisir vos missions et vos horaires
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Aider votre communauté locale
                  </li>
                </ul>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nom complet *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="full_name"
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Jean Dupont"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="jean@exemple.fr"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="06 12 34 56 78"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="city">Ville *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="city"
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Paris"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Code postal *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="postal_code"
                        type="text"
                        value={formData.postal_code}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                        placeholder="75001"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

              <div className="space-y-2">
                   <Label htmlFor="password">Mot de passe *</Label>
                   <div className="relative">
                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                     <Input
                       id="password"
                       type="password"
                       value={formData.password}
                       onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                       placeholder="Minimum 8 caractères"
                       className="pl-10"
                       required
                     />
                   </div>
                 </div>

                 <div className="space-y-2">
                   <Label htmlFor="password_confirm">Confirmer le mot de passe *</Label>
                   <div className="relative">
                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                     <Input
                       id="password_confirm"
                       type="password"
                       value={formData.password_confirm}
                       onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                       placeholder="Confirmez votre mot de passe"
                       className="pl-10"
                       required
                     />
                   </div>
                 </div>

              {userType === 'client' && (
                <>
                 <div className="space-y-2">
                   <Label htmlFor="address">Adresse de livraison *</Label>
                   <div className="relative">
                     <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                     <Input
                       id="address"
                       type="text"
                       value={formData.address}
                       onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                       placeholder="10 rue de la République, 75001 Paris"
                       className="pl-10"
                       required
                     />
                   </div>
                 </div>

                 <div className="space-y-2">
                   <Label htmlFor="delivery_instructions">Instructions de livraison (optionnel)</Label>
                   <Input
                     id="delivery_instructions"
                     type="text"
                     value={formData.delivery_instructions}
                     onChange={(e) => setFormData({ ...formData, delivery_instructions: e.target.value })}
                     placeholder="Code d'entrée, buzzer, instructions spéciales..."
                   />
                 </div>
                </>
               )}

              {userType === 'intervenant' && (
               <>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_type">Type de véhicule *</Label>
                  <Select value={formData.vehicle_type} onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisissez un véhicule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="voiture">Voiture</SelectItem>
                      <SelectItem value="scooter">Scooter</SelectItem>
                      <SelectItem value="velo">Vélo</SelectItem>
                      <SelectItem value="velo_electrique">Vélo électrique</SelectItem>
                      <SelectItem value="moto">Moto</SelectItem>
                      <SelectItem value="a_pied">À pied</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Expérience de service *</Label>
                  <Select value={formData.experience} onValueChange={(value) => setFormData({ ...formData, experience: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre expérience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debutant">Débutant (première expérience)</SelectItem>
                      <SelectItem value="experience">Expérimenté (1-2 ans)</SelectItem>
                      <SelectItem value="confirme">Confirmé (plus de 2 ans)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_fee_preference">Tarif horaire préféré (€/h) (optionnel)</Label>
                  <Input
                    id="service_fee_preference"
                    type="number"
                    value={formData.service_fee_preference}
                    onChange={(e) => setFormData({ ...formData, service_fee_preference: e.target.value })}
                    placeholder="Exemple: 15"
                    min="0"
                    step="0.5"
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 mb-1">Documents requis</p>
                      <p className="text-sm text-blue-700">
                        Vous devrez fournir une pièce d'identité et un justificatif de domicile 
                        lors de votre première connexion pour être vérifié.
                      </p>
                    </div>
                  </div>
                </div>
               </>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/30"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Créer mon compte
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-gray-500">
                Déjà inscrit ?{' '}
                <button
                  type="button"
                  onClick={() => base44.auth.redirectToLogin()}
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Se connecter
                </button>
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid sm:grid-cols-3 gap-4 mt-8 text-center">
          <div className="p-4 bg-white/60 backdrop-blur rounded-xl">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="font-medium text-gray-900">Service fiable</p>
            <p className="text-sm text-gray-600">Intervenants vérifiés</p>
          </div>
          <div className="p-4 bg-white/60 backdrop-blur rounded-xl">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <p className="font-medium text-gray-900">Paiement sécurisé</p>
            <p className="text-sm text-gray-600">Transactions protégées</p>
          </div>
          <div className="p-4 bg-white/60 backdrop-blur rounded-xl">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <p className="font-medium text-gray-900">Communauté active</p>
            <p className="text-sm text-gray-600">Support disponible 7j/7</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}