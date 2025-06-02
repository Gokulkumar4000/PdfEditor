import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { EditTool, ToolSettings } from '@/types/pdf-editor';

interface ToolOptionsPanelProps {
  currentTool: EditTool;
  toolSettings: ToolSettings;
  onSettingsChange: (tool: keyof ToolSettings, settings: any) => void;
}

export function ToolOptionsPanel({ currentTool, toolSettings, onSettingsChange }: ToolOptionsPanelProps) {
  if (currentTool === 'select') return null;

  return (
    <Card className="fixed top-20 right-6 w-64 shadow-lg z-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-slate-900">
          {currentTool.charAt(0).toUpperCase() + currentTool.slice(1)} Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentTool === 'blur' && (
          <>
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">Blur Intensity</Label>
              <Slider
                value={[toolSettings.blur.intensity]}
                onValueChange={(value) => 
                  onSettingsChange('blur', { intensity: value[0] })
                }
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-slate-500">{toolSettings.blur.intensity}</div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">Brush Size</Label>
              <Slider
                value={[toolSettings.blur.brushSize]}
                onValueChange={(value) => 
                  onSettingsChange('blur', { brushSize: value[0] })
                }
                min={5}
                max={50}
                step={1}
                className="w-full"
              />
              <div className="text-xs text-slate-500">{toolSettings.blur.brushSize}px</div>
            </div>
          </>
        )}

        {currentTool === 'text' && (
          <>
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">Font Size</Label>
              <Select
                value={toolSettings.text.fontSize.toString()}
                onValueChange={(value) => 
                  onSettingsChange('text', { fontSize: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12px</SelectItem>
                  <SelectItem value="14">14px</SelectItem>
                  <SelectItem value="16">16px</SelectItem>
                  <SelectItem value="18">18px</SelectItem>
                  <SelectItem value="24">24px</SelectItem>
                  <SelectItem value="32">32px</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">Color</Label>
              <Input
                type="color"
                value={toolSettings.text.color}
                onChange={(e) => 
                  onSettingsChange('text', { color: e.target.value })
                }
                className="w-full h-10"
              />
            </div>
          </>
        )}

        {currentTool === 'erase' && (
          <div className="space-y-2">
            <Label className="text-sm text-slate-600">Eraser Size</Label>
            <Slider
              value={[toolSettings.erase.size]}
              onValueChange={(value) => 
                onSettingsChange('erase', { size: value[0] })
              }
              min={5}
              max={50}
              step={1}
              className="w-full"
            />
            <div className="text-xs text-slate-500">{toolSettings.erase.size}px</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
