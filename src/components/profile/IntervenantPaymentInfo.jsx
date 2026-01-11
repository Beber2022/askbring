import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Wallet, Save, MapPin, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';

export default function IntervenantPaymentInfo({ user }) {
  const [formData, setFormData] = useState({
    iban: '',
    bic: '',
    account_holder_name: '',
    preferred_radius: 10,
    min_service_fee: 3
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setFormData({
      iban: user?.iban || '',
      bic: user?.bic || '',
      account_holder_name: user?.account_holder_name || user?.full_name || '',
      preferred_radius: user?.preferred_radius || 10,
      min_service_fee: user?.min_service_fee || 3
    });
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe(formData);
      toast({
        title: "Informations mises à jour",
        description: "Vos informations de paiement ont été sauvegardées"
      });
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

  return (
    <div className="space-y-6">
      {/* Payment Information */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            Informations de paiement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Vos données sont sécurisées</p>
              <p className="text-blue-700">
                Vos informations bancaires sont cryptées et ne sont utilisées que pour le versement de vos gains.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_holder">Titulaire du compte</Label>
            <Input
              id="account_holder"
              value={formData.account_holder_name}
              onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
              placeholder="Nom et prénom"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="iban">IBAN</Label>
            <Input
              id="iban"
              value={formData.iban}
              onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase() })}
              placeholder="FR76 1234 5678 9012 3456 7890 123"
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bic">BIC / SWIFT</Label>
            <Input
              id="bic"
              value={formData.bic}
              onChange={(e) => setFormData({ ...formData, bic: e.target.value.toUpperCase() })}
              placeholder="BNPAFRPP"
              className="font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {/* Working Preferences */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            Zone d'action
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Rayon d'action préféré</Label>
              <span className="text-sm font-semibold text-emerald-600">
                {formData.preferred_radius} km
              </span>
            </div>
            <Slider
              value={[formData.preferred_radius]}
              onValueChange={(value) => setFormData({ ...formData, preferred_radius: value[0] })}
              min={1}
              max={50}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Distance maximale que vous êtes prêt à parcourir pour une mission
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Frais de service minimum</Label>
              <span className="text-sm font-semibold text-emerald-600">
                {formData.min_service_fee}€
              </span>
            </div>
            <Slider
              value={[formData.min_service_fee]}
              onValueChange={(value) => setFormData({ ...formData, min_service_fee: value[0] })}
              min={0}
              max={20}
              step={0.5}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Rémunération minimale acceptée pour une mission
            </p>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl">
            <p className="text-sm text-emerald-900">
              <strong>💡 Conseil :</strong> Un rayon plus large et des frais minimum plus bas vous donneront accès à plus de missions.
            </p>
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
}