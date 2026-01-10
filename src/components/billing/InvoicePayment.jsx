import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { CreditCard, Download, Check, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

export default function InvoicePayment({ invoice, mission }) {
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handleDownloadPDF = () => {
    if (invoice.pdf_url) {
      const link = document.createElement('a');
      link.href = invoice.pdf_url;
      link.download = `facture-${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePayNow = async () => {
    setProcessing(true);
    try {
      // Initialiser le paiement Stripe
      const user = await base44.auth.me();
      
      // En production, appeler votre backend pour créer un PaymentIntent
      // Pour cette démo, simuler le paiement
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Simule un paiement Stripe réussi pour une facture de ${invoice.total_amount}€`
      });

      // Mettre à jour le statut de la facture
      await base44.entities.Invoice.update(invoice.id, {
        payment_status: 'paid',
        payment_method: 'stripe'
      });

      // Mettre à jour la mission avec payment_status
      if (mission?.id) {
        await base44.entities.Mission.update(mission.id, {
          payment_status: 'paid'
        });
      }

      toast({
        title: '✅ Paiement réussi',
        description: `Facture ${invoice.invoice_number} payée avec succès`
      });
    } catch (error) {
      toast({
        title: 'Erreur de paiement',
        description: 'Le paiement n\'a pas pu être complété',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = () => {
    if (invoice.payment_status === 'paid') return 'bg-green-100 text-green-700';
    if (invoice.payment_status === 'pending') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getStatusLabel = () => {
    if (invoice.payment_status === 'paid') return 'Payée';
    if (invoice.payment_status === 'pending') return 'En attente de paiement';
    return 'Annulée';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Facture #{invoice.invoice_number}
            </CardTitle>
            <Badge className={getStatusColor()}>
              {getStatusLabel()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Montant */}
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border-2 border-emerald-200">
            <p className="text-sm text-emerald-600 font-medium mb-1">Montant total TTC</p>
            <p className="text-3xl font-bold text-emerald-700">
              {invoice.total_amount.toFixed(2)} €
            </p>
          </div>

          {/* Détails */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 font-medium">Courses</p>
              <p className="text-gray-900">{invoice.amount_items?.toFixed(2) || '0.00'} €</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Frais service</p>
              <p className="text-gray-900">{invoice.service_fee?.toFixed(2) || '0.00'} €</p>
            </div>
            {invoice.tip > 0 && (
              <>
                <div>
                  <p className="text-gray-500 font-medium">Pourboire</p>
                  <p className="text-gray-900">{invoice.tip.toFixed(2)} €</p>
                </div>
              </>
            )}
          </div>

          {/* Magasin */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 font-medium">Magasin</p>
            <p className="text-gray-700 font-medium">{invoice.store_name}</p>
          </div>

          {/* Messages d'alerte */}
          {invoice.payment_status === 'pending' && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-700">Paiement en attente</p>
                <p className="text-xs text-yellow-600">Date limite: {new Date(invoice.due_date).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          )}

          {invoice.payment_status === 'paid' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-700">Paiement confirmé</p>
                <p className="text-xs text-green-600">Merci pour votre paiement</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              className="flex-1"
              disabled={!invoice.pdf_url}
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger PDF
            </Button>

            {invoice.payment_status === 'pending' && (
              <Button
                onClick={handlePayNow}
                disabled={processing}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                {processing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <CreditCard className="w-4 h-4 mr-2" />
                )}
                Payer maintenant
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}