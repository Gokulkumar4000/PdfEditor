import { useState, useCallback, useRef } from 'react';
import { PDFEditorState, EditTool, EditOperation, Point, PageEdits } from '@/types/pdf-editor';
import { generatePDF } from '@/lib/pdf-utils';

const initialState: PDFEditorState = {
  currentTool: 'select',
  currentPage: 1,
  totalPages: 0,
  zoomLevel: 100,
  pdfDocument: null,
  pdfFile: null,
  pageEdits: new Map(),
  toolSettings: {
    blur: { intensity: 5, brushSize: 20 },
    text: { fontSize: 14, color: '#000000', fontFamily: 'Arial' },
    erase: { size: 15 }
  },
  isLoading: false
};

export function usePDFEditor() {
  const [state, setState] = useState<PDFEditorState>(initialState);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const currentOperation = useRef<EditOperation | null>(null);

  const setCurrentTool = useCallback((tool: EditTool) => {
    setState(prev => ({ ...prev, currentTool: tool }));
  }, []);

  const setZoomLevel = useCallback((zoom: number) => {
    setState(prev => ({ ...prev, zoomLevel: Math.max(50, Math.min(200, zoom)) }));
  }, []);

  const setCurrentPage = useCallback((page: number) => {
    if (page >= 1 && page <= state.totalPages) {
      setState(prev => ({ ...prev, currentPage: page }));
    }
  }, [state.totalPages]);

  const updateToolSettings = useCallback((tool: keyof PDFEditorState['toolSettings'], settings: any) => {
    setState(prev => ({
      ...prev,
      toolSettings: {
        ...prev.toolSettings,
        [tool]: { ...prev.toolSettings[tool], ...settings }
      }
    }));
  }, []);

  const setPDFDocument = useCallback((document: any, file: File) => {
    setState(prev => ({
      ...prev,
      pdfDocument: document,
      pdfFile: file,
      totalPages: document.numPages,
      currentPage: 1,
      pageEdits: new Map()
    }));
  }, []);

  const addEditOperation = useCallback((operation: EditOperation) => {
    setState(prev => {
      const newPageEdits = new Map(prev.pageEdits);
      const currentPageEdits = newPageEdits.get(prev.currentPage) || {
        pageNumber: prev.currentPage,
        operations: []
      };
      
      currentPageEdits.operations.push(operation);
      newPageEdits.set(prev.currentPage, currentPageEdits);
      
      return { ...prev, pageEdits: newPageEdits };
    });
  }, []);

  const clearCurrentPageEdits = useCallback(() => {
    setState(prev => {
      const newPageEdits = new Map(prev.pageEdits);
      newPageEdits.delete(prev.currentPage);
      return { ...prev, pageEdits: newPageEdits };
    });
  }, []);

  const startDrawing = useCallback((point: Point) => {
    if (state.currentTool === 'select') return;

    isDrawing.current = true;
    
    // For text tool, prompt for text input
    if (state.currentTool === 'text') {
      const text = prompt('Enter text:');
      if (!text) return;
      
      currentOperation.current = {
        id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: state.currentTool,
        points: [point],
        properties: { ...state.toolSettings[state.currentTool], text },
        timestamp: Date.now()
      };
      
      // For text, we can immediately end the operation
      isDrawing.current = false;
      addEditOperation(currentOperation.current);
      currentOperation.current = null;
      return;
    }

    currentOperation.current = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: state.currentTool,
      points: [point],
      properties: { ...state.toolSettings[state.currentTool] },
      timestamp: Date.now()
    };
  }, [state.currentTool, state.toolSettings, addEditOperation]);

  const continueDrawing = useCallback((point: Point) => {
    if (!isDrawing.current || !currentOperation.current) return;
    
    currentOperation.current.points.push(point);
    
    // Redraw on edit canvas
    if (editCanvasRef.current) {
      const ctx = editCanvasRef.current.getContext('2d');
      if (ctx) {
        drawOperation(ctx, currentOperation.current);
      }
    }
  }, []);

  const endDrawing = useCallback(() => {
    if (!isDrawing.current || !currentOperation.current) return;
    
    isDrawing.current = false;
    addEditOperation(currentOperation.current);
    currentOperation.current = null;
  }, [addEditOperation]);

  const downloadPDF = useCallback(async () => {
    if (!state.pdfFile || !state.pdfDocument) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const modifiedPDFBytes = await generatePDF(state.pdfFile, state.pageEdits);
      
      // Create download link
      const blob = new Blob([modifiedPDFBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'edited_' + state.pdfFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.pdfFile, state.pdfDocument, state.pageEdits]);

  return {
    state,
    canvasRef,
    editCanvasRef,
    setCurrentTool,
    setZoomLevel,
    setCurrentPage,
    updateToolSettings,
    setPDFDocument,
    addEditOperation,
    clearCurrentPageEdits,
    startDrawing,
    continueDrawing,
    endDrawing,
    downloadPDF
  };
}

function drawOperation(ctx: CanvasRenderingContext2D, operation: EditOperation) {
  if (operation.points.length === 0) return;

  ctx.save();
  
  switch (operation.type) {
    case 'blur':
      ctx.globalCompositeOperation = 'multiply';
      ctx.filter = `blur(${operation.properties.intensity}px)`;
      ctx.strokeStyle = 'rgba(128, 128, 128, 0.7)';
      ctx.lineWidth = operation.properties.brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      break;
    case 'erase':
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
      ctx.lineWidth = operation.properties.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      break;
    case 'text':
      ctx.font = `${operation.properties.fontSize}px ${operation.properties.fontFamily}`;
      ctx.fillStyle = operation.properties.color;
      ctx.textBaseline = 'top';
      ctx.fillText(operation.properties.text || 'Text', operation.points[0].x, operation.points[0].y);
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
