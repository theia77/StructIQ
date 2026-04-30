'use client';

import { BeamState, AnalysisResults } from '@/lib/types/structural';
import Beam3DScene from '@/components/visualizer/Beam3DScene';
import Beam2DCanvas from '@/components/visualizer/Beam2DCanvas';
import { Button } from '@/components/ui/button';

interface LeftPanelProps {
  beamState: BeamState;
  results: AnalysisResults | null;
  viewMode: '2D' | '3D';
  setViewMode: (mode: '2D' | '3D') => void;
}

export default function LeftPanel({ beamState, results, viewMode, setViewMode }: LeftPanelProps) {
  return (
    <div className="relative w-full h-full flex flex-col border-r border-border">

      {/* Visualizer Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex space-x-2 bg-background/80 backdrop-blur-md p-1 rounded-lg border">
        <Button
          size="sm"
          variant={viewMode === '2D' ? 'default' : 'ghost'}
          onClick={() => setViewMode('2D')}
        >
          2D Canvas (SFD/BMD)
        </Button>
        <Button
          size="sm"
          variant={viewMode === '3D' ? 'default' : 'ghost'}
          onClick={() => setViewMode('3D')}
        >
          3D Environment
        </Button>
      </div>

      {/* Render Context */}
      <div className="flex-1 w-full bg-muted/20 relative">
        {viewMode === '2D' ? (
          <Beam2DCanvas state={beamState} results={results} />
        ) : (
          <Beam3DScene state={beamState} results={results} />
        )}
      </div>

    </div>
  );
}
