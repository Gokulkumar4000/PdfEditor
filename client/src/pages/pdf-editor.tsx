import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Save, Download } from 'lucide-react';
import { UploadArea } from '@/components/upload-area';
import { Toolbar } from '@/components/toolbar';
import { PDFViewer } from '@/components/pdf-viewer';
import { PageNavigation } from '@/components/page-navigation';
import { ToolOptionsPanel } from '@/components/tool-options-panel';
import { usePDFEditor } from '@/hooks/use-pdf-editor';
import { loadPDF } from '@/lib/pdf-utils';
import { useToast } from '@/hooks/use-toast';

export default function PDFEditor() {
  const { toast } = useToast();
  const {
    state,
    canvasRef,
    editCanvasRef,
    setCurrentTool,
    setZoomLevel,
    setCurrentPage,
    updateToolSettings,
    setPDFDocument,
    startDrawing,
    continueDrawing,
    endDrawing,
    downloadPDF
  } = usePDFEditor();

  const handleFileUpload = async (file: File) => {
    try {
      const pdfDocument = await loadPDF(file);
      setPDFDocument(pdfDocument, file);
      toast({
        title: "PDF loaded successfully",
        description: `Loaded ${pdfDocument.numPages} pages`,
      });
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast({
        title: "Error loading PDF",
        description: "Please try again with a different file.",
        variant: "destructive",
      });
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(state.zoomLevel + 25);
  };

  const handleZoomOut = () => {
    setZoomLevel(state.zoomLevel - 25);
  };

  const handleFitToWidth = () => {
    setZoomLevel(100); // Simplified - in real app, calculate based on container width
  };

  const handleSave = () => {
    toast({
      title: "Changes saved",
      description: "Your edits have been saved to the current session.",
    });
  };

  const showPDFViewer = state.pdfDocument && state.pdfFile;

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900">PDF Editor</h1>
          </div>
          
          {showPDFViewer && (
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleSave}
                className="hidden md:flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4" />
                <span>Save PDF</span>
              </Button>
              <Button
                onClick={downloadPDF}
                disabled={state.isLoading}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {state.isLoading ? 'Generating...' : 'Download'}
                </span>
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {showPDFViewer && (
          <Toolbar
            currentTool={state.currentTool}
            onToolChange={setCurrentTool}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            zoomLevel={state.zoomLevel}
          />
        )}

        <div className="flex-1 flex flex-col">
          <UploadArea
            onFileUpload={handleFileUpload}
            isVisible={!showPDFViewer}
          />

          {showPDFViewer && (
            <>
              <PDFViewer
                pdfDocument={state.pdfDocument}
                currentPage={state.currentPage}
                zoomLevel={state.zoomLevel}
                currentTool={state.currentTool}
                canvasRef={canvasRef}
                editCanvasRef={editCanvasRef}
                onStartDrawing={startDrawing}
                onContinueDrawing={continueDrawing}
                onEndDrawing={endDrawing}
              />

              <PageNavigation
                currentPage={state.currentPage}
                totalPages={state.totalPages}
                zoomLevel={state.zoomLevel}
                onPageChange={setCurrentPage}
                onFitToWidth={handleFitToWidth}
              />
            </>
          )}
        </div>
      </div>

      {/* Tool Options Panel */}
      {showPDFViewer && (
        <ToolOptionsPanel
          currentTool={state.currentTool}
          toolSettings={state.toolSettings}
          onSettingsChange={updateToolSettings}
        />
      )}
    </div>
  );
}
