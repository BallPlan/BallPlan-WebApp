import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import fullLogo from '../assets/full-logo.png';
import { formatNaira } from './currency';

const BRAND = [180, 88, 25];
const INK = [18, 18, 18];
const MUTED = [140, 140, 140];
const CREAM = [248, 245, 240];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function downloadPlanPdf({ sections, groupLabel, totalItems, totalPrice }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  // Header band
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageWidth, 92, 'F');

  try {
    const img = await loadImage(fullLogo);
    const logoH = 26;
    const logoW = (img.width / img.height) * logoH;
    doc.addImage(img, 'PNG', margin, 30, logoW, logoH);
  } catch {
    doc.setTextColor(255, 255, 255);
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.text('BallPlan', margin, 52);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('times', 'bold');
  doc.setFontSize(17);
  doc.text('Your Outing Plan', pageWidth - margin, 45, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const dateStr = new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Generated ${dateStr} · grouped by ${groupLabel.toLowerCase()}`, pageWidth - margin, 62, { align: 'right' });

  let cursorY = 122;

  sections.forEach((section) => {
    if (cursorY > pageHeight - 140) {
      doc.addPage();
      cursorY = 50;
    }

    doc.setFillColor(...CREAM);
    doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 28, 5, 5, 'F');

    doc.setFont('times', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(...INK);
    doc.text(section.key, margin + 12, cursorY + 18.5);

    const titleWidth = doc.getTextWidth(section.key);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...MUTED);
    doc.text(`· ${section.count} item${section.count === 1 ? '' : 's'}`, margin + 18 + titleWidth, cursorY + 18.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(...BRAND);
    doc.text(formatNaira(section.subtotal), pageWidth - margin - 12, cursorY + 18.5, { align: 'right' });

    cursorY += 38;

    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      head: [['Item', 'Venue', 'Qty', 'Unit Price', 'Total']],
      body: section.items.map((item) => [
        item.name,
        `${item.venueName}${item.location ? ` · ${item.location}` : ''}`,
        String(item.qty),
        formatNaira(item.unitPrice),
        formatNaira(item.unitPrice * item.qty),
      ]),
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 9.5,
        textColor: INK,
        cellPadding: { top: 7, bottom: 7, left: 10, right: 10 },
        lineColor: [235, 232, 227],
        lineWidth: { bottom: 0.75 },
      },
      headStyles: {
        textColor: MUTED,
        fontStyle: 'bold',
        fontSize: 8,
        lineWidth: { bottom: 1 },
        lineColor: [220, 216, 210],
      },
      columnStyles: {
        1: { textColor: MUTED },
        2: { halign: 'center', cellWidth: 36 },
        3: { halign: 'right', cellWidth: 78 },
        4: { halign: 'right', cellWidth: 78, fontStyle: 'bold', textColor: BRAND },
      },
    });

    cursorY = doc.lastAutoTable.finalY + 24;
  });

  if (cursorY > pageHeight - 90) {
    doc.addPage();
    cursorY = 60;
  }

  doc.setFillColor(...INK);
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 52, 8, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text(`Plan Total — ${totalItems} item${totalItems === 1 ? '' : 's'}`, margin + 18, cursorY + 32);
  doc.setFontSize(19);
  doc.text(formatNaira(totalPrice), pageWidth - margin - 18, cursorY + 33, { align: 'right' });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text('Generated with BallPlan — prices shown are estimates and may vary at the venue.', margin, pageHeight - 22);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 22, { align: 'right' });
  }

  doc.save('ballplan-your-plan.pdf');
}
