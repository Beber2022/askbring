import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import InvoicePayment from '@/components/billing/InvoicePayment';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { InvoiceService } from '@/components/billing/InvoiceService';

export default function Invoices() {
  const [user, setUser] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const userInvoices = await InvoiceService.getInvoicesByClient(userData.email);
      setInvoices(userInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les factures',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredInvoices = () => {
    if (filterStatus === 'all') return invoices;
    return invoices.filter(inv => inv.payment_status === filterStatus);
  };

  const getStats = () => {
    const total = invoices.length;
    const paid = invoices.filter(i => i.payment_status === 'paid').length;
    const pending = invoices.filter(i => i.payment_status === 'pending').length;
    const totalAmount = invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);

    return { total, paid, pending, totalAmount };
  };

  const handleDownload = (invoice) => {
    if (invoice.pdf_url) {
      const link = document.createElement('a');
      link.href = invoice.pdf_url;
      link.download = `facture-${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = getStats();
  const filteredInvoices = getFilteredInvoices();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              Mes Factures
            </h1>
            <p className="text-gray-600">Gérez vos factures et effectuez vos paiements</p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total factures</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                  </div>
                  <FileText className="w-12 h-12 text-gray-400 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Payées</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.paid}</p>
                  </div>
                  <CheckCircle className="w-12 h-12 text-emerald-400 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">En attente</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
                  </div>
                  <Clock className="w-12 h-12 text-yellow-400 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm">Montant total</p>
                    <p className="text-3xl font-bold mt-1">{stats.totalAmount.toFixed(2)} €</p>
                  </div>
                  <FileText className="w-12 h-12 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtrer:</span>
            </div>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'Toutes' },
                { value: 'paid', label: 'Payées' },
                { value: 'pending', label: 'En attente' }
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={filterStatus === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(option.value)}
                  className={filterStatus === option.value ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Invoices List */}
          {filteredInvoices.length === 0 ? (
            <Card className="border-0 shadow-lg text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucune facture trouvée
              </h3>
              <p className="text-gray-500">
                Les factures s'affichent ici après completion de vos missions
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredInvoices.map((invoice, index) => (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          {/* Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <FileText className="w-5 h-5 text-emerald-600" />
                              <h3 className="font-semibold text-gray-900">
                                {invoice.invoice_number}
                              </h3>
                              <Badge className={
                                invoice.payment_status === 'paid'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }>
                                {invoice.payment_status === 'paid' ? 'Payée' : 'En attente'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mt-3">
                              <div>
                                <p className="text-xs font-medium">Magasin</p>
                                <p className="text-gray-900">{invoice.store_name}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium">Date</p>
                                <p className="text-gray-900">
                                  {new Date(invoice.issued_date).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-medium">Montant</p>
                                <p className="font-semibold text-gray-900">
                                  {invoice.total_amount.toFixed(2)} €
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-medium">Intervenant</p>
                                <p className="text-gray-900">{invoice.intervenant_name}</p>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowDetails(true);
                              }}
                              className="flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="hidden sm:inline">Voir</span>
                            </Button>
                            {invoice.pdf_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownload(invoice)}
                                className="flex items-center gap-2"
                              >
                                <Download className="w-4 h-4" />
                                <span className="hidden sm:inline">PDF</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal détails facture */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Détails de la facture</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <InvoicePayment invoice={selectedInvoice} mission={null} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}