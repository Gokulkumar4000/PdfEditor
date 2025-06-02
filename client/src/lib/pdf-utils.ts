import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, PDFPage } from 'pdf-lib';
import { PageEdits, EditOperation } from '@/types/pdf-editor';

// Initialize PDF.js worker
let workerInitialized = false;

function initializePDFWorker() {
  if (workerInitialized) return;
  
  // Set worker source with error handling
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    workerInitialized = true;
  } catch (error) {
    console.warn('PDF worker initialization failed, will use fallback');
  }
}

export async function loadPDF(file: File) {
  initializePDFWorker();
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
      cMapPacked: true,
      verbosity: 0
    });
    
    return await loadingTask.promise;
  } catch (error) {
    console.error('PDF loading failed:', error);
    throw new Error('Failed to load PDF file. Please try a different PDF file.');
  }
}

export async function renderPDFPage(
  pdfDocument: any,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number = 1
) {
  const page = await pdfDocument.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get canvas context');
  
  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };
  
  await page.render(renderContext).promise;
  return { width: viewport.width, height: viewport.height };
}

export async function generatePDF(originalFile: File, pageEdits: Map<number, PageEdits>): Promise<Uint8Array> {
  try {
    // Load the original PDF using PDF.js for rendering
    const originalArrayBuffer = await originalFile.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument(originalArrayBuffer);
    const pdfDoc = await loadingTask.promise;
    
    // Create a new PDF document
    const newPdfDoc = await PDFDocument.create();
    
    // Process each page
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      // Create a canvas to render the original page
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      // Render the original page
      await renderPDFPage(pdfDoc, pageNum, canvas, 1.5); // Higher scale for better quality
      
      // Apply edits if they exist for this page
      const edits = pageEdits.get(pageNum);
      if (edits && edits.operations.length > 0) {
        // Apply each edit operation to the canvas
        for (const operation of edits.operations) {
          applyEditToCanvas(ctx, operation);
        }
      }
      
      // Convert canvas to image and add to new PDF
      const imageDataUrl = canvas.toDataURL('image/png');
      const imageBytes = await fetch(imageDataUrl).then(res => res.arrayBuffer());
      const image = await newPdfDoc.embedPng(imageBytes);
      
      // Add page with same dimensions as original
      const page = newPdfDoc.addPage([canvas.width, canvas.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height,
      });
    }
    
    const pdfBytes = await newPdfDoc.save();
    return pdfBytes;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

function applyEditToCanvas(ctx: CanvasRenderingContext2D, operation: EditOperation) {
  if (operation.points.length === 0) return;

  ctx.save();
  
  switch (operation.type) {
    case 'blur':
      // White glass morphism effect
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = operation.properties.brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.filter = `blur(${operation.properties.intensity * 0.5}px)`;
      break;
      
    case 'erase':
      // For PDF generation, we skip erase operations as they should only affect edit overlay
      ctx.restore();
      return;
      
    case 'text':
      // Add text
      ctx.font = `${operation.properties.fontSize}px ${operation.properties.fontFamily}`;
      ctx.fillStyle = operation.properties.color;
      ctx.textBaseline = 'top';
      const text = operation.properties.text || 'Text';
      ctx.fillText(text, operation.points[0].x, operation.points[0].y);
      ctx.restore();
      return;
  }

  // Draw stroke operations (blur and erase)
  if (operation.points.length > 1) {
    ctx.beginPath();
    ctx.moveTo(operation.points[0].x, operation.points[0].y);
    for (let i = 1; i < operation.points.length; i++) {
      ctx.lineTo(operation.points[i].x, operation.points[i].y);
    }
    ctx.stroke();
  } else if (operation.points.length === 1) {
    // Single point (dot)
    ctx.beginPath();
    ctx.arc(operation.points[0].x, operation.points[0].y, ctx.lineWidth / 2, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.restore();
}

export function getCanvasCoordinates(
  event: MouseEvent,
  canvas: HTMLCanvasElement,
  zoomLevel: number
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}
