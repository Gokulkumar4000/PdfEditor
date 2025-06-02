import { useEffect, useRef, useCallback } from 'react';
import { renderPDFPage, getCanvasCoordinates } from '@/lib/pdf-utils';
import { EditTool, Point, PageEdits, EditOperation } from '@/types/pdf-editor';

interface PDFViewerProps {
  pdfDocument: any;
  currentPage: number;
  zoomLevel: number;
  currentTool: EditTool;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  editCanvasRef: React.RefObject<HTMLCanvasElement>;
  pageEdits: Map<number, PageEdits>;
  onStartDrawing: (point: Point) => void;
  onContinueDrawing: (point: Point) => void;
  onEndDrawing: () => void;
}

export function PDFViewer({
  pdfDocument,
  currentPage,
  zoomLevel,
  currentTool,
  canvasRef,
  editCanvasRef,
  pageEdits,
  onStartDrawing,
  onContinueDrawing,
  onEndDrawing
}: PDFViewerProps) {
  const isDrawing = useRef(false);

  // Function to draw a single edit operation
  const drawOperation = useCallback((ctx: CanvasRenderingContext2D, operation: EditOperation) => {
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
  }, []);

  // Function to draw all saved edits for current page
  const drawSavedEdits = useCallback((ctx: CanvasRenderingContext2D) => {
    const edits = pageEdits.get(currentPage);
    if (!edits || edits.operations.length === 0) return;

    for (const operation of edits.operations) {
      drawOperation(ctx, operation);
    }
  }, [pageEdits, currentPage, drawOperation]);

  // Render PDF page when page or zoom changes
  useEffect(() => {
    if (!pdfDocument || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        const scale = zoomLevel / 100;
        const { width, height } = await renderPDFPage(
          pdfDocument,
          currentPage,
          canvasRef.current!,
          scale
        );

        // Update edit canvas dimensions to match
        if (editCanvasRef.current) {
          editCanvasRef.current.width = width;
          editCanvasRef.current.height = height;
          
          // Clear and redraw saved edits for this page
          const ctx = editCanvasRef.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, width, height);
            drawSavedEdits(ctx);
          }
        }
      } catch (error) {
        console.error('Error rendering PDF page:', error);
      }
    };

    renderPage();
  }, [pdfDocument, currentPage, zoomLevel, canvasRef, editCanvasRef, drawSavedEdits]);

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool === 'select' || !editCanvasRef.current) return;

    isDrawing.current = true;
    const point = getCanvasCoordinates(event.nativeEvent, editCanvasRef.current, zoomLevel);
    onStartDrawing(point);
  }, [currentTool, editCanvasRef, zoomLevel, onStartDrawing]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || currentTool === 'select' || !editCanvasRef.current) return;

    const point = getCanvasCoordinates(event.nativeEvent, editCanvasRef.current, zoomLevel);
    onContinueDrawing(point);
  }, [currentTool, editCanvasRef, zoomLevel, onContinueDrawing]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing.current) return;
    
    isDrawing.current = false;
    onEndDrawing();
  }, [onEndDrawing]);

  const getCursorClass = useCallback(() => {
    switch (currentTool) {
      case 'select': return 'cursor-pointer';
      case 'blur': return 'cursor-crosshair';
      case 'erase': return 'cursor-crosshair';
      case 'text': return 'cursor-text';
      default: return 'cursor-default';
    }
  }, [currentTool]);

  return (
    <div className="flex-1 relative overflow-auto bg-slate-100">
      <div className="flex justify-center p-8">
        <div 
          className="relative bg-white shadow-xl rounded-lg overflow-hidden"
          style={{ 
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center'
          }}
        >
          {/* PDF Page Canvas */}
          <canvas
            ref={canvasRef}
            className="block"
          />
          
          {/* Editing Overlay Canvas */}
          <canvas
            ref={editCanvasRef}
            className={`absolute top-0 left-0 ${getCursorClass()}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
      </div>
    </div>
  );
}
