import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export interface PDFOptions {
  title?: string;
  subtitle?: string;
  filename?: string;
}

export async function exportToPDF(
  elementId: string,
  options: PDFOptions = {}
): Promise<void> {
  const { title = "Site Audit Report", subtitle = "", filename = "site-audit-report.pdf" } = options;

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  // Show loading toast
  const toast = document.createElement("div");
  toast.className = "fixed top-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50";
  toast.textContent = "Generating PDF...";
  document.body.appendChild(toast);

  try {
    // 1) Sanitize DOM subtree to avoid oklch/oklab in computed styles
    const sanitized: Array<{
      el: HTMLElement;
      color?: string;
      backgroundColor?: string;
      backgroundImage?: string;
      borderTopColor?: string;
      borderRightColor?: string;
      borderBottomColor?: string;
      borderLeftColor?: string;
    }> = [];

    const needsFallback = (value: string | null) => {
      if (!value) return false;
      const v = value.toLowerCase();
      return v.includes('oklch') || v.includes('oklab');
    };

    const forceRgb = (root: HTMLElement) => {
      const all = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];
      all.forEach((el) => {
        const cs = window.getComputedStyle(el);
        const orig: any = { el };
        let changed = false;

        if (needsFallback(cs.color)) {
          orig.color = el.style.color;
          el.style.setProperty('color', '#111111', 'important');
          changed = true;
        }
        if (needsFallback(cs.backgroundColor)) {
          orig.backgroundColor = el.style.backgroundColor;
          el.style.setProperty('background-color', '#ffffff', 'important');
          changed = true;
        }
        if (cs.backgroundImage && needsFallback(cs.backgroundImage)) {
          orig.backgroundImage = el.style.backgroundImage;
          el.style.setProperty('background-image', 'none', 'important');
          changed = true;
        }
        // Borders
        if (needsFallback(cs.borderTopColor)) {
          orig.borderTopColor = el.style.borderTopColor;
          el.style.setProperty('border-top-color', '#dddddd', 'important');
          changed = true;
        }
        if (needsFallback(cs.borderRightColor)) {
          orig.borderRightColor = el.style.borderRightColor;
          el.style.setProperty('border-right-color', '#dddddd', 'important');
          changed = true;
        }
        if (needsFallback(cs.borderBottomColor)) {
          orig.borderBottomColor = el.style.borderBottomColor;
          el.style.setProperty('border-bottom-color', '#dddddd', 'important');
          changed = true;
        }
        if (needsFallback(cs.borderLeftColor)) {
          orig.borderLeftColor = el.style.borderLeftColor;
          el.style.setProperty('border-left-color', '#dddddd', 'important');
          changed = true;
        }

        if (changed) sanitized.push(orig);
      });
    };

    const rootEl = element as HTMLElement;
    forceRgb(rootEl);

    // Capture the element as a canvas (primary path)
    let imgData: string | null = null;
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: "#ffffff",
        allowTaint: true,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });
      imgData = canvas.toDataURL("image/png");
    } catch (e) {
      // Fallback: use dom-to-image-more which relies on browser rendering (supports oklch)
      const { toPng } = await import('dom-to-image-more');
      imgData = await toPng(element, {
        bgcolor: '#ffffff',
        cacheBust: true,
        quality: 1,
        width: element.scrollWidth,
        height: element.scrollHeight,
      });
    }
    
    // Calculate dimensions in pixels
    // Resolve image dimensions
    const dim = await new Promise<{w:number,h:number}>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth || img.width, h: img.naturalHeight || img.height });
      img.src = imgData as string;
    });
    const imgWidth = dim.w;
    const imgHeight = dim.h;
    
    // A4 dimensions in mm (at 96 DPI, 1mm ≈ 3.78 pixels)
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = 297; // A4 height in mm
    const imgRatio = imgWidth / imgHeight;
    
    // Calculate how many pages we need
    const pageImgHeight = (imgWidth / pdfWidth) * pdfHeight;
    const totalPages = Math.ceil(imgHeight / pageImgHeight);

    // Create PDF
    const pdf = new jsPDF("p", "mm", "a4");
    
    // Add title page
    if (title || subtitle) {
      pdf.setFontSize(24);
      pdf.text(title, pdfWidth / 2, 50, { align: "center" });
      if (subtitle) {
        pdf.setFontSize(14);
        pdf.text(subtitle, pdfWidth / 2, 65, { align: "center" });
      }
      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pdfWidth / 2, 80, { align: "center" });
      pdf.addPage();
    }
    
    // Split canvas into pages
    let heightLeft = imgHeight;
    let position = 0;
    
    // Slice the tall image into pages to avoid scaling to a single page
    const pxPerMm = imgWidth / pdfWidth; // pixels that correspond to 1mm at current scaling
    const pageHeightPx = pxPerMm * pdfHeight;
    for (let i = 0; i < totalPages; i++) {
      if (i > 0) pdf.addPage();

      const sourceY = i * pageHeightPx;
      const sliceHeight = Math.min(pageHeightPx, imgHeight - sourceY);

      // Create a slice canvas
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = imgWidth;
      sliceCanvas.height = sliceHeight;
      const ctx = sliceCanvas.getContext('2d')!;

      // Draw slice
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, sourceY, imgWidth, sliceHeight, 0, 0, imgWidth, sliceHeight);
          resolve();
        };
        img.src = imgData as string;
      });

      const sliceData = sliceCanvas.toDataURL('image/png');
      const hMm = (sliceHeight / pxPerMm);
      pdf.addImage(sliceData, 'PNG', 0, 0, pdfWidth, hMm);
    }

    // Save the PDF
    pdf.save(filename);
    
    // Remove loading toast
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 1000);
    
    // Restore original inline styles
    sanitized.forEach(s => {
      if (s.color !== undefined) s.el.style.color = s.color;
      if (s.backgroundColor !== undefined) s.el.style.backgroundColor = s.backgroundColor;
      if (s.backgroundImage !== undefined) s.el.style.backgroundImage = s.backgroundImage;
      if (s.borderTopColor !== undefined) s.el.style.borderTopColor = s.borderTopColor;
      if (s.borderRightColor !== undefined) s.el.style.borderRightColor = s.borderRightColor;
      if (s.borderBottomColor !== undefined) s.el.style.borderBottomColor = s.borderBottomColor;
      if (s.borderLeftColor !== undefined) s.el.style.borderLeftColor = s.borderLeftColor;
    });
    
  } catch (error) {
    console.error("PDF export error:", error);
    if (document.body.contains(toast)) {
      document.body.removeChild(toast);
    }
    throw error;
  }
}

