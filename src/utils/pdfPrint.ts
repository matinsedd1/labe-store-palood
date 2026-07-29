import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

/**
 * Generate a PDF from HTML label elements for thermal printing.
 * Uses html-to-image instead of html2canvas to avoid oklch() color function errors
 * that occur with Tailwind CSS v4.
 *
 * Outputs a landscape 72mm × 40mm PDF matching Woosim WSP-R350 specs.
 * No software rotation is needed — the label is rendered directly at correct orientation.
 */
export const generatePdfBase64 = async (elements: HTMLElement[]): Promise<string> => {
  const PAGE_WIDTH = 72;
  const PAGE_HEIGHT = 40;

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [PAGE_WIDTH, PAGE_HEIGHT],
  });

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];

    // Render with html-to-image (supports oklch and modern CSS)
    const dataUrl = await toPng(element, {
      backgroundColor: '#ffffff',
      pixelRatio: 4, // High DPI for crisp barcodes at 203 DPI
      cacheBust: true,
    });

    if (i > 0) {
      pdf.addPage();
    }

    // Fill the entire page with the label image
    pdf.addImage(dataUrl, 'PNG', 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
  }

  return pdf.output('datauristring').split(',')[1];
};
