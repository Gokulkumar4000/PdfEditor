import { Button } from '@/components/ui/button';
import { MousePointer, EyeOff, Eraser, Type, ZoomIn, ZoomOut } from 'lucide-react';
import { EditTool } from '@/types/pdf-editor';

interface ToolbarProps {
  currentTool: EditTool;
  onToolChange: (tool: EditTool) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoomLevel: number;
}

export function Toolbar({ currentTool, onToolChange, onZoomIn, onZoomOut, zoomLevel }: ToolbarProps) {
  const tools = [
    { id: 'blur' as EditTool, icon: EyeOff, label: 'Blur' },
    { id: 'erase' as EditTool, icon: Eraser, label: 'Erase' },
    { id: 'text' as EditTool, icon: Type, label: 'Text' },
  ];

  return (
    <div className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-6 space-y-4">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = currentTool === tool.id;
        
        return (
          <Button
            key={tool.id}
            variant="ghost"
            size="icon"
            onClick={() => onToolChange(tool.id)}
            className={`w-10 h-10 rounded-lg transition-colors ${
              isActive 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title={tool.label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        );
      })}

      <div className="border-t border-slate-200 w-8 my-4"></div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomIn}
        disabled={zoomLevel >= 200}
        className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
        title="Zoom In"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomOut}
        disabled={zoomLevel <= 50}
        className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
        title="Zoom Out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
