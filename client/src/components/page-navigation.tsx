import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PageNavigationProps {
  currentPage: number;
  totalPages: number;
  zoomLevel: number;
  onPageChange: (page: number) => void;
  onFitToWidth: () => void;
}

export function PageNavigation({
  currentPage,
  totalPages,
  zoomLevel,
  onPageChange,
  onFitToWidth
}: PageNavigationProps) {
  const handlePageInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(event.target.value);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className="bg-white border-t border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <span>Page</span>
            <Input
              type="number"
              value={currentPage}
              onChange={handlePageInputChange}
              min={1}
              max={totalPages}
              className="w-12 px-2 py-1 text-center"
            />
            <span>of</span>
            <span>{totalPages}</span>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-slate-600">
            Zoom: {zoomLevel}%
          </div>
          
          <Button
            variant="ghost"
            onClick={onFitToWidth}
            className="px-3 py-1 text-sm bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
          >
            Fit Width
          </Button>
        </div>
      </div>
    </div>
  );
}
