import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera,
  Save,
  Star,
  Briefcase,
  Wallet,
  Shield,
  CheckCircle,
  Upload,
  FileText,
  Building2,
  Car,
  Bike
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import NotificationSettings from '@/components/notifications/NotificationSettings';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    bio: '',
    user_type: 'client',
    account_type: 'particulier',
    siret_number: '',
    transport_type: ''
  });
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        setFormData({
          phone: userData.phone || '',
          address: userData.address || '',
          bio: userData.bio || '',
          user_type: userData.user_type || 'client',
          account_type: userData.account_type || 'particulier',
          siret_number: userData.siret_number || '',
          transport_type: userData.transport_type || ''
        });
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe(formData);
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès"
      });
      // Reload page to update layout
      window.location.reload();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder vos informations",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ profile_picture: file_url });
      setUser(prev => ({ ...prev, profile_picture: file_url }));
      toast({
        title: "Photo mise à jour",
        description: "Votre photo de profil a été mise à jour"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger la photo",
        variant: "destructive"
      });
    }
  };

  const handleDocumentUpload = async (e, documentType) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ [documentType]: file_url });
      setUser(prev => ({ ...prev, [documentType]: file_url }));
      toast({
        title: "Document téléchargé",
        description: "Votre document a été enregistré"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le document",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mon Profil</h1>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Profile Card */}
          <Card className="md:col-span-1 border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="relative inline-block mb-4">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={user?.profile_picture} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-4xl">
                    {user?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute bottom-0 right-0 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-emerald-600 transition-colors shadow-lg">
                  <Camera className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
              <h2 className="text-xl font-bold text-gray-900">{user?.full_name}</h2>
              <p className="text-gray-500 text-sm mb-3">{user?.email}</p>
              <Badge className="bg-emerald-100 text-emerald-700">
                {user?.user_type === 'intervenant' ? 'Intervenant' : 'Client'}
              </Badge>

              {user?.is_verified && (
                <div className="flex items-center justify-center gap-2 mt-4 text-emerald-600">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">Vérifié</span>
                </div>
              )}

              {user?.user_type === 'intervenant' && (
                <div className="mt-6 pt-6 border-t space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">Note moyenne</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold">{user?.average_rating?.toFixed(1) || '0.0'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">Missions</span>
                    <span className="font-semibold">{user?.total_missions || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">Gains totaux</span>
                    <span className="font-semibold text-emerald-600">{user?.total_earnings?.toFixed(2) || '0.00'}€</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Form */}
          <Card className="md:col-span-2 border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Type Selection */}
              <div className="space-y-3">
                <Label>Je suis</Label>
                <RadioGroup
                  value={formData.user_type}
                  onValueChange={(value) => setFormData({ ...formData, user_type: value })}
                  className="grid grid-cols-2 gap-4"
                >
                  <Label
                    htmlFor="client"
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.user_type === 'client'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-200'
                    }`}
                  >
                    <RadioGroupItem value="client" id="client" className="sr-only" />
                    <User className={`w-8 h-8 mb-2 ${formData.user_type === 'client' ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <span className={`font-medium ${formData.user_type === 'client' ? 'text-emerald-700' : 'text-gray-600'}`}>
                      Client
                    </span>
                    <span className="text-xs text-gray-500 mt-1">Je veux commander</span>
                  </Label>
                  <Label
                    htmlFor="intervenant"
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.user_type === 'intervenant'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-200'
                    }`}
                  >
                    <RadioGroupItem value="intervenant" id="intervenant" className="sr-only" />
                    <Briefcase className={`w-8 h-8 mb-2 ${formData.user_type === 'intervenant' ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <span className={`font-medium ${formData.user_type === 'intervenant' ? 'text-emerald-700' : 'text-gray-600'}`}>
                      Intervenant
                    </span>
                    <span className="text-xs text-gray-500 mt-1">Je veux livrer</span>
                  </Label>
                </RadioGroup>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="name"
                      value={user?.full_name || ''}
                      disabled
                      className="pl-10 bg-gray-50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="pl-10 bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse par défaut</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 rue de la Paix, 75001 Paris"
                    className="pl-10 min-h-[80px]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Parlez-nous un peu de vous..."
                  className="min-h-[100px]"
                />
              </div>

              <Button 
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader>
            <CardTitle>Informations complémentaires</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Account Type */}
            <div className="space-y-3">
              <Label>Type de compte</Label>
              <RadioGroup
                value={formData.account_type}
                onValueChange={(value) => setFormData({ ...formData, account_type: value })}
                className="grid grid-cols-2 gap-4"
              >
                <Label
                  htmlFor="particulier"
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.account_type === 'particulier'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-emerald-200'
                  }`}
                >
                  <RadioGroupItem value="particulier" id="particulier" className="sr-only" />
                  <User className={`w-8 h-8 mb-2 ${formData.account_type === 'particulier' ? 'text-emerald-600' : 'text-gray-400'}`} />
                  <span className={`font-medium ${formData.account_type === 'particulier' ? 'text-emerald-700' : 'text-gray-600'}`}>
                    Particulier
                  </span>
                </Label>
                <Label
                  htmlFor="entreprise"
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.account_type === 'entreprise'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-emerald-200'
                  }`}
                >
                  <RadioGroupItem value="entreprise" id="entreprise" className="sr-only" />
                  <Building2 className={`w-8 h-8 mb-2 ${formData.account_type === 'entreprise' ? 'text-emerald-600' : 'text-gray-400'}`} />
                  <span className={`font-medium ${formData.account_type === 'entreprise' ? 'text-emerald-700' : 'text-gray-600'}`}>
                    Entreprise
                  </span>
                </Label>
              </RadioGroup>
            </div>

            {/* SIRET for companies */}
            {formData.account_type === 'entreprise' && (
              <div className="space-y-2">
                <Label htmlFor="siret">Numéro SIRET</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="siret"
                    value={formData.siret_number}
                    onChange={(e) => setFormData({ ...formData, siret_number: e.target.value })}
                    placeholder="123 456 789 00010"
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            {/* Transport Type for intervenants */}
            {formData.user_type === 'intervenant' && (
              <div className="space-y-2">
                <Label htmlFor="transport">Type de transport</Label>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    id="transport"
                    value={formData.transport_type}
                    onChange={(e) => setFormData({ ...formData, transport_type: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="vélo">🚴 Vélo</option>
                    <option value="voiture">🚗 Voiture</option>
                    <option value="bus">🚌 Bus</option>
                    <option value="moto">🏍️ Moto</option>
                    <option value="trottinette">🛴 Trottinette</option>
                    <option value="à pied">🚶 À pied</option>
                  </select>
                </div>
              </div>
            )}

            {/* Document Uploads */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pièce d'identité</Label>
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-emerald-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">
                    {user?.id_document_url ? '✓ Document téléchargé' : 'Télécharger'}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleDocumentUpload(e, 'id_document_url')}
                    disabled={uploading}
                  />
                </label>
              </div>

              <div className="space-y-2">
                <Label>Justificatif de domicile</Label>
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-emerald-400 transition-colors">
                  <FileText className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">
                    {user?.address_proof_url ? '✓ Document téléchargé' : 'Télécharger'}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleDocumentUpload(e, 'address_proof_url')}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>

            <Button 
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <NotificationSettings />
      </motion.div>
    </div>
  );
}