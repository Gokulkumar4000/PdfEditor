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
  onStartDrawing,
  onContinueDrawing,
  onEndDrawing
}: PDFViewerProps) {
  const isDrawing = useRef(false);

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
        }
      } catch (error) {
        console.error('Error rendering PDF page:', error);
      }
    };

    renderPage();
  }, [pdfDocument, currentPage, zoomLevel, canvasRef, editCanvasRef]);

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
