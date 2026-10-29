import type { CouponReport } from '@/api/coupons';

const navy: [number, number, number] = [12, 74, 110];
const orange: [number, number, number] = [249, 115, 22];
const slate: [number, number, number] = [71, 85, 105];

export async function createCouponReportPdf(report: CouponReport) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const autoTable = autoTableModule.default;
  const { coupon, metrics } = report;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const fmtDate = (value?: string | null) => value ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : 'Not set';
  const pct = (value: number) => `${(value * 100).toFixed(1)}%`;
  const safe = (value?: string | number | null) => value == null || value === '' ? 'Not available' : String(value);

  const addHeader = (subtitle = 'COUPON PERFORMANCE REPORT') => {
    doc.setFillColor(...navy); doc.rect(0, 0, pageWidth, 34, 'F');
    doc.setFillColor(...orange); doc.rect(0, 34, pageWidth, 2, 'F');
    doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text('CityDeals', margin, 15);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.text(subtitle, margin, 24);
    doc.setFontSize(8); doc.text(`Generated ${fmtDate(report.generatedAt)}`, pageWidth - margin, 15, { align: 'right' });
    doc.text(`Report ID  ${coupon.id.slice(0, 8).toUpperCase()}`, pageWidth - margin, 24, { align: 'right' });
  };
  const addFooters = () => {
    const pages = doc.getNumberOfPages();
    for (let page = 1; page <= pages; page += 1) {
      doc.setPage(page); doc.setDrawColor(226, 232, 240); doc.line(margin, 286, pageWidth - margin, 286);
      doc.setTextColor(...slate); doc.setFontSize(7); doc.text('CONFIDENTIAL - CityDeals administrative report', margin, 291);
      doc.text(`Page ${page} of ${pages}`, pageWidth - margin, 291, { align: 'right' });
    }
  };
  const sectionTitle = (title: string, y: number) => {
    doc.setTextColor(...navy); doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text(title, margin, y);
    doc.setDrawColor(...orange); doc.setLineWidth(0.7); doc.line(margin, y + 2, margin + 12, y + 2);
  };

  addHeader();
  doc.setTextColor(...navy); doc.setFont('helvetica', 'bold'); doc.setFontSize(19);
  const titleLines = doc.splitTextToSize(coupon.title, contentWidth - 42);
  doc.text(titleLines, margin, 51);
  const titleBottom = 51 + titleLines.length * 7;
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...slate); doc.setFontSize(9);
  doc.text(`${coupon.merchant?.name || 'Unknown merchant'}  /  ${coupon.category?.name || 'General'}`, margin, titleBottom + 2);
  doc.setFillColor(coupon.status === 'ACTIVE' ? 220 : 241, coupon.status === 'ACTIVE' ? 252 : 245, coupon.status === 'ACTIVE' ? 231 : 249);
  doc.roundedRect(pageWidth - margin - 32, 45, 32, 9, 4, 4, 'F');
  doc.setTextColor(coupon.status === 'ACTIVE' ? 22 : 71, coupon.status === 'ACTIVE' ? 163 : 85, coupon.status === 'ACTIVE' ? 74 : 105);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.text(coupon.status, pageWidth - margin - 16, 51, { align: 'center' });

  const cards = [
    ['VIEWS', metrics.views], ['SAVES', metrics.saves], ['REDEMPTIONS', metrics.redemptions],
    ['SHARES', metrics.shares], ['CONVERSION', pct(metrics.conversionRate)], ['SAVE RATE', pct(metrics.saveRate)],
  ];
  const cardW = (contentWidth - 10) / 3;
  cards.forEach(([label, value], index) => {
    const row = Math.floor(index / 3); const col = index % 3; const x = margin + col * (cardW + 5); const y = titleBottom + 12 + row * 24;
    doc.setFillColor(248, 250, 252); doc.setDrawColor(226, 232, 240); doc.roundedRect(x, y, cardW, 19, 2, 2, 'FD');
    doc.setTextColor(...slate); doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.text(String(label), x + 4, y + 6);
    doc.setTextColor(...navy); doc.setFontSize(14); doc.text(String(value), x + 4, y + 14);
  });

  let y = titleBottom + 67;
  sectionTitle('Offer details', y);
  autoTable(doc, {
    startY: y + 6, theme: 'plain', margin: { left: margin, right: margin },
    body: [
      ['Coupon code', safe(coupon.couponCode), 'Redemption frequency', safe(coupon.redemptionFrequency?.replaceAll('_', ' '))],
      ['Start date', fmtDate(coupon.startsAt || coupon.createdAt), 'Expiry date', fmtDate(coupon.expiresAt)],
      ['Redemption limit', safe(coupon.redemptionLimit ?? 'Unlimited'), 'Remaining', safe(metrics.remainingRedemptions ?? 'Unlimited')],
      ['Area', [coupon.area?.name, coupon.area?.city, coupon.area?.state].filter(Boolean).join(', ') || 'Not available', 'Created', fmtDate(coupon.createdAt)],
      ['Unique viewers', metrics.uniqueViewers, 'Share link opens', metrics.shareOpens],
      ['Business address', safe(coupon.merchant?.address), 'Business contact', [coupon.merchant?.phone, coupon.merchant?.email].filter(Boolean).join(' / ') || 'Not available'],
    ],
    styles: { fontSize: 8, cellPadding: 3, textColor: slate },
    columnStyles: { 0: { fontStyle: 'bold', textColor: navy, cellWidth: 31 }, 1: { cellWidth: 58 }, 2: { fontStyle: 'bold', textColor: navy, cellWidth: 35 } },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });
  y = (doc as any).lastAutoTable.finalY + 9;
  sectionTitle('Description', y); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...slate);
  doc.text(doc.splitTextToSize(coupon.description || 'No description provided.', contentWidth), margin, y + 7);
  y += 7 + doc.splitTextToSize(coupon.description || 'No description provided.', contentWidth).length * 4;
  if (y < 253) {
    sectionTitle('Terms and conditions', y + 5); doc.setTextColor(...slate); doc.setFontSize(8);
    doc.text(doc.splitTextToSize(coupon.terms || 'No terms and conditions provided.', contentWidth), margin, y + 12);
  }

  doc.addPage(); addHeader('ENGAGEMENT AND REDEMPTION DETAIL');
  sectionTitle('Share performance by channel', 49);
  autoTable(doc, {
    startY: 55, head: [['Channel', 'Shares', 'Link opens', 'Open rate']],
    body: report.shareBreakdown.length ? report.shareBreakdown.map((row) => [row.channel, row.shares, row.opens, pct(row.openRate)]) : [['No share activity', 0, 0, '0.0%']],
    margin: { left: margin, right: margin }, styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: navy, textColor: 255 }, alternateRowStyles: { fillColor: [248, 250, 252] },
  });
  y = (doc as any).lastAutoTable.finalY + 10;
  sectionTitle('Recent redemptions', y);
  autoTable(doc, {
    startY: y + 6, head: [['Customer', 'Email', 'Phone', 'Redeemed at']],
    body: report.redemptions.length ? report.redemptions.map((row) => [safe(row.user.fullName), safe(row.user.email), safe(row.user.phoneNumber), fmtDate(row.createdAt)]) : [['No redemptions yet', '-', '-', '-']],
    margin: { left: margin, right: margin, top: 42, bottom: 16 }, styles: { fontSize: 7.5, cellPadding: 2.6, overflow: 'linebreak' },
    headStyles: { fillColor: orange, textColor: 255 }, alternateRowStyles: { fillColor: [255, 247, 237] },
    didDrawPage: () => { if (doc.getCurrentPageInfo().pageNumber > 2) addHeader('REDEMPTION DETAIL - CONTINUED'); },
  });

  addFooters();
  const fileTitle = coupon.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'coupon';
  return { doc, fileName: `${fileTitle}-full-report.pdf` };
}

export async function downloadCouponReport(report: CouponReport) {
  const { doc, fileName } = await createCouponReportPdf(report);
  doc.save(fileName);
}
