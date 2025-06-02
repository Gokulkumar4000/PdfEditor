import { useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FolderOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UploadAreaProps {
  onFileUpload: (file: File) => void;
  isVisible: boolean;
}

export function UploadArea({ onFileUpload, isVisible }: UploadAreaProps) {
  const { toast } = useToast();

  const handleFileSelect = useCallback((file: File) => {
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast({
        title: "File too large",
        description: "Please select a PDF file smaller than 50MB.",
        variant: "destructive",
      });
      return;
    }

    onFileUpload(file);
  }, [onFileUpload, toast]);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  if (!isVisible) return null;

  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 p-6">
      <Card 
        className="w-full max-w-md mx-auto border-2 border-dashed border-slate-300 hover:border-blue-500 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Upload PDF File</h3>
            <p className="text-slate-600 mb-6">Drag and drop your PDF file here, or click to browse</p>
            
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileInputChange}
              className="hidden"
              id="pdf-file-input"
            />
            <Button
              onClick={() => document.getElementById('pdf-file-input')?.click()}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
            >
              <FolderOpen className="h-4 w-4" />
              <span>Choose PDF File</span>
            </Button>
            
            <div className="mt-4 text-sm text-slate-500">
              Supported format: PDF files up to 50MB
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
