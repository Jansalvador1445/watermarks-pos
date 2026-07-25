import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { APP_NAME } from '@/utils/constants';

export type PdfSection = {
  title: string;
  headers: string[];
  rows: string[][];
};

export const toDisplayValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
};

export const escapeCsvValue = (value: unknown) => {
  const text = toDisplayValue(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

export const buildCsvBlob = (headers: string[], rows: string[][]) =>
  new Blob([`${headers.join(',')}\n${rows.map((row) => row.map(escapeCsvValue).join(',')).join('\n')}`], {
    type: 'text/csv;charset=utf-8',
  });

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const buildPdf = (
  title: string,
  subtitle: string,
  filterSummary: string[],
  sections: PdfSection[],
  filename: string,
) => {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const marginX = 40;
  const contentWidth = pageWidth - marginX * 2;

  pdf.setProperties({ title, subject: subtitle, author: APP_NAME });
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text(title, marginX, 42);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  const subtitleLines = pdf.splitTextToSize(subtitle, contentWidth);
  pdf.text(subtitleLines, marginX, 60);

  let currentY = 82 + (subtitleLines.length - 1) * 12;

  pdf.setFontSize(9);
  pdf.setTextColor(107, 114, 128);
  pdf.text('Filters', marginX, currentY);
  currentY += 12;
  filterSummary.forEach((line) => {
    const wrapped = pdf.splitTextToSize(line, contentWidth);
    pdf.text(wrapped, marginX, currentY);
    currentY += wrapped.length * 11;
  });
  currentY += 8;

  sections.forEach((section, index) => {
    if (index > 0 && currentY > 720) {
      pdf.addPage();
      currentY = 40;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(31, 41, 55);
    pdf.setFontSize(12);
    pdf.text(section.title, marginX, currentY);
    currentY += 10;

    autoTable(pdf, {
      startY: currentY,
      head: [section.headers],
      body: section.rows.length ? section.rows : [['No data available'] as unknown as string[]],
      margin: { left: marginX, right: marginX },
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 4, overflow: 'linebreak' },
      headStyles: { fillColor: [243, 244, 246], textColor: 31 },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      theme: 'grid',
    });

    currentY = (pdf as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? currentY + 20;
    currentY += 22;
  });

  pdf.save(filename);
};
