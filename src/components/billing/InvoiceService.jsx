import { base44 } from '@/api/base44Client';
import { InvoiceGenerator } from './InvoiceGenerator';

export class InvoiceService {
  static async createAndSendInvoice(mission, user) {
    try {
      // Générer le numéro de facture
      const invoiceNumber = InvoiceGenerator.generateInvoiceNumber();
      
      // Calculer les montants
      const amountItems = mission.actual_cost || mission.estimated_budget || 0;
      const serviceFee = mission.service_fee || 0;
      const tip = mission.tip || 0;
      const totalAmount = amountItems + serviceFee + tip;

      // Créer l'enregistrement de facture
      const invoice = await base44.entities.Invoice.create({
        mission_id: mission.id,
        client_email: mission.client_email,
        client_name: mission.client_name,
        intervenant_email: mission.intervenant_email,
        intervenant_name: mission.intervenant_name,
        invoice_number: invoiceNumber,
        store_name: mission.store_name,
        amount_items: amountItems,
        service_fee: serviceFee,
        tip: tip,
        total_amount: totalAmount,
        payment_status: 'pending',
        issued_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

      // Générer le PDF
      const doc = await InvoiceGenerator.generatePDF(mission, invoice);
      const pdfUrl = await InvoiceGenerator.savePDFAndGetUrl(doc, invoiceNumber);

      // Mettre à jour la facture avec l'URL du PDF
      await base44.entities.Invoice.update(invoice.id, {
        pdf_url: pdfUrl
      });

      // Envoyer l'email au client
      await this.sendInvoiceEmail(invoice, mission);

      // Créer une notification
      await base44.entities.Notification.create({
        user_email: mission.client_email,
        title: 'Votre facture est prête',
        message: `Facture ${invoiceNumber} pour courses au ${mission.store_name}: ${totalAmount.toFixed(2)}€`,
        type: 'mission_update',
        mission_id: mission.id,
        action_url: `/ClientMissions?tab=completed`
      });

      return invoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  static async sendInvoiceEmail(invoice, mission) {
    try {
      // Préparer le contenu de l'email
      const htmlContent = `
        <h2>Votre facture est prête</h2>
        <p>Bonjour ${invoice.client_name},</p>
        <p>Nous vous confirmons que votre mission au ${mission.store_name} a été complétée avec succès.</p>
        <p style="font-size: 18px; color: #10b981; font-weight: bold;">
          Montant total: ${invoice.total_amount.toFixed(2)}€
        </p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Numéro de facture:</strong> ${invoice.invoice_number}</p>
          <p><strong>Magasin:</strong> ${mission.store_name}</p>
          <p><strong>Intervenant:</strong> ${invoice.intervenant_name}</p>
          <p><strong>Date limite de paiement:</strong> ${new Date(invoice.due_date).toLocaleDateString('fr-FR')}</p>
        </div>
        <p>Vous pouvez télécharger votre facture depuis votre compte AskBring.</p>
        <p style="margin-top: 30px; color: #666;">
          Merci d'utiliser AskBring!<br/>
          L'équipe AskBring
        </p>
      `;

      await base44.integrations.Core.SendEmail({
        to: invoice.client_email,
        subject: `Facture ${invoice.invoice_number} - AskBring`,
        body: htmlContent
      });
    } catch (error) {
      console.error('Error sending invoice email:', error);
      // Ne pas lever l'erreur - la facture est créée même si l'email échoue
    }
  }

  static async getInvoicesByClient(clientEmail) {
    try {
      const invoices = await base44.entities.Invoice.filter(
        { client_email: clientEmail },
        '-issued_date'
      );
      return invoices;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  }

  static async getInvoiceById(invoiceId) {
    try {
      const invoices = await base44.entities.Invoice.filter({ id: invoiceId });
      return invoices.length > 0 ? invoices[0] : null;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return null;
    }
  }
}