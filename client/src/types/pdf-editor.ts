export type EditTool = 'select' | 'blur' | 'erase' | 'text';

export interface Point {
  x: number;
  y: number;
}

export interface EditOperation {
  id: string;
  type: EditTool;
  points: Point[];
  properties: Record<string, any>;
  timestamp: number;
}

export interface PageEdits {
  pageNumber: number;
  operations: EditOperation[];
}

export interface BlurSettings {
  intensity: number;
  brushSize: number;
}

export interface TextSettings {
  fontSize: number;
  color: string;
  fontFamily: string;
}

export interface EraseSettings {
  size: number;
}

export interface ToolSettings {
  blur: BlurSettings;
  text: TextSettings;
  erase: EraseSettings;
}

export interface PDFEditorState {
  currentTool: EditTool;
  currentPage: number;
  totalPages: number;
  zoomLevel: number;
  pdfDocument: any | null;
  pdfFile: File | null;
  pageEdits: Map<number, PageEdits>;
  toolSettings: ToolSettings;
  isLoading: boolean;
}
