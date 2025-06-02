import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb } from 'pdf-lib';
import { PageEdits } from '@/types/pdf-editor';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export async function loadPDF(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument(arrayBuffer);
  return await loadingTask.promise;
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
    // Load the original PDF
    const arrayBuffer = await originalFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // For now, we'll return the original PDF as modifying PDF content
    // requires more complex implementation with PDF-lib
    // In a production app, you would:
    // 1. Convert each page to an image
    // 2. Apply edits to the image
    // 3. Replace the page content with the modified image
    
    // This is a simplified implementation that preserves the original PDF
    // and would need enhancement to actually apply the edits
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
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
