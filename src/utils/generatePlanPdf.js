import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const BRAND = [180, 88, 25];
const INK = [18, 18, 18];
const MUTED = [140, 140, 140];
// The app's actual light-mode page background (tailwind.config.js's
// "cream", src/index.css's body background) — the whole page, not just
// the section bars.
const PAGE_BG = [248, 245, 240];
const WHITE = [255, 255, 255];
const IMG_SIZE = 26;

// jsPDF's built-in standard fonts (helvetica/times/courier) only cover
// WinAnsiEncoding — they have no glyph for the Naira sign (₦, U+20A6), so
// `doc.text('₦...')` silently drops or mangles it. Noto Sans does include
// it, so it's embedded and used specifically for money amounts; the rest
// of the document keeps using the fast, tiny built-in fonts. Fetched at
// generation time (not bundled into the main JS) since this is only ever
// needed when someone actually downloads a plan.
const MONEY_FONT = 'NotoSans';
let moneyFontReady = null;

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function loadMoneyFont(doc) {
  if (!moneyFontReady) {
    moneyFontReady = Promise.all([
      fetch('/fonts/NotoSans-Regular.ttf').then((r) => r.arrayBuffer()),
      fetch('/fonts/NotoSans-Bold.ttf').then((r) => r.arrayBuffer()),
    ])
      .then(([regular, bold]) => ({
        regular: arrayBufferToBase64(regular),
        bold: arrayBufferToBase64(bold),
      }))
      .catch(() => null); // graceful degradation — falls back to helvetica (symbol just won't render) rather than failing the whole PDF
  }
  const fonts = await moneyFontReady;
  if (!fonts) return false;
  doc.addFileToVFS('NotoSans-Regular.ttf', fonts.regular);
  doc.addFont('NotoSans-Regular.ttf', MONEY_FONT, 'normal');
  doc.addFileToVFS('NotoSans-Bold.ttf', fonts.bold);
  doc.addFont('NotoSans-Bold.ttf', MONEY_FONT, 'bold');
  return true;
}

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null); // graceful degradation — a broken thumbnail shouldn't fail the whole PDF
    img.src = src;
  });
}

async function preloadImages(sections) {
  const sources = new Set();
  sections.forEach((s) => s.items.forEach((i) => i.image && sources.add(i.image)));
  const entries = await Promise.all(Array.from(sources).map(async (src) => [src, await loadImage(src)]));
  return new Map(entries);
}

// White version of the icon (logo-icon.png recolored, alpha untouched —
// see the generator script this was made with for how). logo-icon.png
// itself is solid brand orange, which is the same color as the header
// band it sits on and disappeared into it entirely; full-logo.png's
// "BallPlan" text is also black, meant for light backgrounds. The
// wordmark is instead drawn as white vector text next to this icon (see
// the header below).
async function loadLogo() {
  try {
    const mod = await import('../assets/logo-icon-white.png');
    return loadImage(mod.default);
  } catch {
    return null;
  }
}

function paintPageBackground(doc, pageWidth, pageHeight) {
  doc.setFillColor(...PAGE_BG);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
}

export async function downloadPlanPdf({ sections, groupLabel, totalItems, totalPrice, preparedFor, budget }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  const hasMoneyFont = await loadMoneyFont(doc);
  // Amounts render as "₦12,345" via the embedded font when it loaded; if
  // the fetch failed for some reason, fall back to spelling out "NGN" on
  // the built-in font rather than risk a blank/garbled symbol.
  const money = (amount, opts = {}) => {
    const n = Number(amount) || 0;
    const formatted = n.toLocaleString('en-NG', { maximumFractionDigits: 0 });
    doc.setFont(hasMoneyFont ? MONEY_FONT : 'helvetica', opts.bold ? 'bold' : 'normal');
    return hasMoneyFont ? `₦${formatted}` : `NGN ${formatted}`;
  };

  const venueCount = new Set(sections.flatMap((s) => s.items.map((i) => i.venueId))).size;
  const images = await preloadImages(sections);

  // ---------------------------------------------------------------- header
  const headerHeight = 88;
  paintPageBackground(doc, pageWidth, pageHeight);
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  const logo = await loadLogo();
  let wordmarkX = margin;
  if (logo) {
    const logoH = 26;
    const logoW = (logo.width / logo.height) * logoH;
    doc.addImage(logo, 'PNG', margin, 30, logoW, logoH);
    wordmarkX = margin + logoW + 10;
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.text('BallPlan', wordmarkX, 50);

  doc.setTextColor(255, 255, 255);
  doc.setFont('times', 'bold');
  doc.setFontSize(17);
  doc.text('Your Outing Plan', pageWidth - margin, 45, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const dateStr = new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Generated ${dateStr} · grouped by ${groupLabel.toLowerCase()}`, pageWidth - margin, 65, { align: 'right' });

  let cursorY = headerHeight + 28;

  // -------------------------------------------------------------- sections
  sections.forEach((section) => {
    if (cursorY > pageHeight - 160) {
      doc.addPage();
      paintPageBackground(doc, pageWidth, pageHeight);
      cursorY = 50;
    }

    // White against the page's cream background, so each venue's bar
    // stands out the way it does in the app itself.
    doc.setFillColor(...WHITE);
    doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 28, 5, 5, 'F');

    // Small icon bubble, mirroring the icon badge next to each group's
    // heading on the ViewPlan page.
    doc.setFillColor(...BRAND);
    doc.circle(margin + 15, cursorY + 14, 8, 'F');
    doc.setDrawColor(255, 255, 255);

    doc.setFont('times', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(...INK);
    doc.text(section.key, margin + 32, cursorY + 18.5);

    const titleWidth = doc.getTextWidth(section.key);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...MUTED);
    doc.text(`· ${section.count} item${section.count === 1 ? '' : 's'}`, margin + 38 + titleWidth, cursorY + 18.5);

    const subtotalText = money(section.subtotal, { bold: true });
    doc.setFontSize(11.5);
    doc.setTextColor(...BRAND);
    doc.text(subtotalText, pageWidth - margin - 12, cursorY + 18.5, { align: 'right' });

    cursorY += 34;

    // When grouped by venue, the section already represents one place —
    // show its phone once instead of repeating it on every row. Just the
    // phone, not the full street address (e.g. "Lekki-Epe Expressway,
    // Lekki, Lagos") — that was cluttering this line.
    const venueInfo = section.items[0];
    if (groupLabel === 'Venue' && venueInfo?.phone) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...MUTED);
      doc.text(venueInfo.phone, margin + 4, cursorY);
      cursorY += 14;
    }

    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      head: [['', 'Item', 'Venue', 'Qty', 'Unit Price', 'Total']],
      body: section.items.map((item) => [
        '',
        item.name,
        `${item.venueName}${item.location ? `\n${item.location}` : ''}`,
        String(item.qty),
        money(item.unitPrice),
        money(item.unitPrice * item.qty),
      ]),
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 9.5,
        textColor: INK,
        cellPadding: { top: 7, bottom: 7, left: 10, right: 10 },
        lineColor: [235, 232, 227],
        lineWidth: { bottom: 0.75 },
        minCellHeight: IMG_SIZE + 8,
        valign: 'middle',
      },
      headStyles: {
        textColor: MUTED,
        fontStyle: 'bold',
        fontSize: 8,
        lineWidth: { bottom: 1 },
        lineColor: [220, 216, 210],
      },
      columnStyles: {
        0: { cellWidth: IMG_SIZE + 16 },
        1: { fontStyle: 'bold' },
        2: { textColor: MUTED, fontSize: 8.5 },
        3: { halign: 'center', cellWidth: 36 },
        4: { halign: 'right', cellWidth: 78, font: hasMoneyFont ? MONEY_FONT : 'helvetica' },
        5: { halign: 'right', cellWidth: 78, fontStyle: 'bold', textColor: BRAND, font: hasMoneyFont ? MONEY_FONT : 'helvetica' },
      },
      didDrawCell: (data) => {
        if (data.section !== 'body' || data.column.index !== 0) return;
        const item = section.items[data.row.index];
        const img = item && images.get(item.image);
        if (!img) return;
        const x = data.cell.x + (data.cell.width - IMG_SIZE) / 2;
        const y = data.cell.y + (data.cell.height - IMG_SIZE) / 2;
        try {
          doc.addImage(img, 'JPEG', x, y, IMG_SIZE, IMG_SIZE, undefined, 'FAST');
        } catch {
          // unsupported image format for this browser/canvas combo — skip silently
        }
      },
    });

    cursorY = doc.lastAutoTable.finalY + 24;
  });

  // ------------------------------------------------------------------ total
  if (cursorY > pageHeight - 90) {
    doc.addPage();
    paintPageBackground(doc, pageWidth, pageHeight);
    cursorY = 60;
  }

  doc.setFillColor(...BRAND);
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 52, 8, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text(`Plan Total — ${totalItems} item${totalItems === 1 ? '' : 's'}`, margin + 18, cursorY + 32);
  const totalText = money(totalPrice, { bold: true });
  doc.setFontSize(19);
  doc.text(totalText, pageWidth - margin - 18, cursorY + 33, { align: 'right' });

  // ----------------------------------------------------------------- footer
  // "Prepared for X · N venues · M items [· budget/savings]" lives in the
  // footer rather than the header — keeps the brand band to two lines and
  // reads more like a receipt's fine print than a headline stat.
  const summaryParts = [
    `${venueCount} venue${venueCount === 1 ? '' : 's'}`,
    `${totalItems} item${totalItems === 1 ? '' : 's'}`,
  ];
  if (budget != null) {
    const savings = budget - totalPrice;
    summaryParts.push(`Budget ${money(budget)}`);
    summaryParts.push(`${savings >= 0 ? 'Savings' : 'Over budget'} ${money(Math.abs(savings))}`);
  }
  if (preparedFor) summaryParts.unshift(`Prepared for ${preparedFor}`);

  // The summary line may have a "₦" baked into it (budget/savings) — a
  // single doc.text() call renders its whole string in one font, so once
  // that ₦ is in there the *entire* line needs a font that can draw it.
  // Noto Sans doesn't have an italic weight embedded, so this line loses
  // the italic styling only in that specific case; the disclaimer line
  // never contains a currency symbol and keeps it.
  const summaryHasMoney = budget != null;
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFont(summaryHasMoney && hasMoneyFont ? MONEY_FONT : 'helvetica', summaryHasMoney ? 'normal' : 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(summaryParts.join(' · '), margin, pageHeight - 34);
    doc.setFont('helvetica', 'italic');
    doc.text('Generated with BallPlan. Prices shown are estimates and may vary at the venue.', margin, pageHeight - 22);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 22, { align: 'right' });
  }

  doc.save('ballplan-your-plan.pdf');
}
