import jsPDF from 'jspdf';

export class InvoiceGenerator {
  static generateInvoiceNumber() {
    const date = new Date();
    const timestamp = date.getTime();
    return `INV-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${timestamp}`;
  }

  static async generatePDF(mission, invoice) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = margin;

    // En-tête
    doc.setFontSize(24);
    doc.setTextColor(16, 185, 129); // emerald-600
    doc.text('FACTURE', margin, yPosition);

    // Numéro et date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    yPosition += 15;
    doc.text(`Numéro: ${invoice.invoice_number}`, pageWidth - margin - 50, yPosition);
    yPosition += 5;
    const issueDate = new Date(invoice.issued_date);
    doc.text(`Date: ${issueDate.toLocaleDateString('fr-FR')}`, pageWidth - margin - 50, yPosition);

    yPosition += 15;

    // Section prestataire et client
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);

    // Prestataire (AskBring)
    doc.text('AskBring SAS', margin, yPosition);
    yPosition += 5;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Plateforme de services à la demande', margin, yPosition);
    yPosition += 5;
    doc.text('contact@askbring.fr', margin, yPosition);

    // Client
    yPosition -= 10;
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('FACTURATION À:', pageWidth / 2 + 10, yPosition);
    yPosition += 5;
    doc.setFontSize(10);
    doc.text(invoice.client_name, pageWidth / 2 + 10, yPosition);
    yPosition += 5;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(invoice.client_email, pageWidth / 2 + 10, yPosition);

    yPosition += 20;

    // Tableau des détails (manuel)
    const colWidth = (pageWidth - margin * 2) / 2;
    const rowHeight = 8;

    // En-tête du tableau
    doc.setFillColor(16, 185, 129);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.rect(margin, yPosition, colWidth, rowHeight, 'F');
    doc.rect(margin + colWidth, yPosition, colWidth, rowHeight, 'F');
    doc.text('Description', margin + 2, yPosition + 6);
    doc.text('Montant (€)', margin + colWidth + 2, yPosition + 6);
    yPosition += rowHeight;

    // Lignes du tableau
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);

    const rows = [
      [`Courses - ${mission.store_name}\n${mission.shopping_list?.length || 0} articles`, `${(mission.actual_cost || mission.estimated_budget || 0).toFixed(2)}`],
      ['Frais de service (livraison)', `${(mission.service_fee || 0).toFixed(2)}`]
    ];

    if (mission.tip && mission.tip > 0) {
      rows.push(['Pourboire', `${parseFloat(mission.tip).toFixed(2)}`]);
    }

    rows.forEach((row, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, yPosition, pageWidth - margin * 2, rowHeight, 'F');
      }
      doc.text(row[0], margin + 2, yPosition + 6);
      doc.text(row[1], margin + colWidth + 2, yPosition + 6, { align: 'left' });
      yPosition += rowHeight;
    });

    yPosition += 5;

    // Total
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.setFont(undefined, 'bold');
    doc.text('MONTANT TOTAL', margin, yPosition);
    doc.text(`${invoice.total_amount.toFixed(2)} €`, pageWidth - margin - 15, yPosition, { align: 'right' });

    yPosition += 15;

    // Conditions de paiement
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'normal');
    
    const dueDateObj = new Date(invoice.due_date);
    doc.text(`Merci de votre paiement! Date limite de paiement: ${dueDateObj.toLocaleDateString('fr-FR')}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Paiement: ${invoice.payment_status === 'paid' ? 'Payé' : 'En attente'}`, margin, yPosition);

    // Pied de page
    yPosition = pageHeight - margin;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('AskBring - Plateforme de services à la demande', pageWidth / 2, yPosition, { align: 'center' });

    return doc;
  }

  static async savePDFAndGetUrl(doc, invoiceNumber) {
    // Générer PDF en base64
    const pdfData = doc.output('datauristring');
    
    // En production, vous sauvegarderiez ce PDF dans un stockage
    // Pour cette démo, on retourne juste l'URL data
    return pdfData;
  }
}