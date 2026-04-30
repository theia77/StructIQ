'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { BeamState, AnalysisResults } from '@/lib/types/structural';
import { saveProject } from '@/lib/supabase/api';
import LeftPanel from '@/components/panels/LeftPanel';
import RightPanel from '@/components/panels/RightPanel';
import { Button } from '@/components/ui/button';

export default function CalculatorPage() {
  const [viewMode, setViewMode]               = useState<'2D' | '3D'>('2D');
  const [isSaving, setIsSaving]               = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);

  const [beamState, setBeamState] = useState<BeamState>({
    nodes: [],
    elements: [],
    loads: [],
    settings: { clockwisePositive: true },
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const mockUserId   = '123e4567-e89b-12d3-a456-426614174000';
      const projectTitle = `Project - ${new Date().toLocaleDateString()}`;
      await saveProject(mockUserId, projectTitle, beamState);
      toast.success('Project saved successfully to database!');
    } catch {
      toast.error('Failed to save project. Check console.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">

      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-card border-b shrink-0">
        <h1 className="font-bold text-lg">StructEngine Pro</h1>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </header>

      {/* Split Pane */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Visualizers (extracted to LeftPanel) */}
        <div className="w-2/3 h-full">
          <LeftPanel
            beamState={beamState}
            results={analysisResults}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        </div>

        {/* Right: Inputs & Controls */}
        <div className="w-1/3 h-full overflow-y-auto p-4 bg-card">
          <RightPanel
            beamState={beamState}
            setBeamState={setBeamState}
            setAnalysisResults={setAnalysisResults}
          />
        </div>

      </div>
    </div>
  );
}
