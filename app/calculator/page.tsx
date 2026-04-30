'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { BeamState, AnalysisResults } from '@/lib/types/structural';
import LeftPanel from '@/components/panels/LeftPanel';
import RightPanel from '@/components/panels/RightPanel';
import { toast } from 'sonner';

function CalculatorWorkspace() {
  const searchParams = useSearchParams();
  const projectId    = searchParams.get('id');

  const [viewMode, setViewMode]               = useState<'2D' | '3D'>('2D');
  const [isLoading, setIsLoading]             = useState(!!projectId);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);

  const [beamState, setBeamState] = useState<BeamState>({
    nodes: [],
    elements: [],
    loads: [],
    settings: { clockwisePositive: true },
  });

  useEffect(() => {
    async function loadProject() {
      if (!projectId) return;
      try {
        const { data, error } = await supabase
          .from('beam_projects')
          .select('structural_data, title')
          .eq('id', projectId)
          .single();

        if (error) throw error;

        if (data?.structural_data) {
          setBeamState(
            typeof data.structural_data === 'string'
              ? JSON.parse(data.structural_data)
              : data.structural_data
          );
          toast.success(`Loaded: ${data.title}`);
        }
      } catch (err) {
        toast.error('Failed to load project data.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProject();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading Workspace…
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <div className="w-2/3 h-full">
        <LeftPanel
          beamState={beamState}
          results={analysisResults}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      </div>
      <div className="w-1/3 h-full overflow-y-auto p-4 bg-card border-l border-border">
        <RightPanel
          beamState={beamState}
          setBeamState={setBeamState}
          setAnalysisResults={setAnalysisResults}
        />
      </div>
    </div>
  );
}

export default function CalculatorPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">Initializing…</div>
    }>
      <CalculatorWorkspace />
    </Suspense>
  );
}
