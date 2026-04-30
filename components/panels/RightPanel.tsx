'use client';

import { BeamState, AnalysisResults, Node, SupportType } from '@/lib/types/structural';
import { MatrixSolver } from '@/lib/math/MatrixSolver';
import PropertyInput from '@/components/forms/PropertyInput';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface RightPanelProps {
  beamState: BeamState;
  setBeamState: React.Dispatch<React.SetStateAction<BeamState>>;
  setAnalysisResults: React.Dispatch<React.SetStateAction<AnalysisResults | null>>;
}

export default function RightPanel({ beamState, setBeamState, setAnalysisResults }: RightPanelProps) {

  const handleAddNode = () => {
    const newNode: Node = {
      id: `n-${Date.now()}`,
      x: 0,
      y: 0,
      supportType: 'free',
    };
    setBeamState(prev => ({ ...prev, nodes: [...prev.nodes, newNode] }));
  };

  const handleSolve = () => {
    try {
      const solver  = new MatrixSolver(beamState);
      const results = solver.solve();
      setAnalysisResults(results);
      toast.success('Analysis complete!');
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(`Analysis failed: ${err.message}`);
      } else {
        toast.error('An unknown mathematical error occurred.');
      }
      setAnalysisResults(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-2">Structural Parameters</h2>
        <p className="text-sm text-muted-foreground">Define nodes, span properties, and boundaries.</p>
      </div>

      <section className="p-4 border rounded-lg bg-background">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Nodes ({beamState.nodes.length})</h3>
          <Button size="sm" onClick={handleAddNode}>+ Add Node</Button>
        </div>

        <div className="space-y-4">
          {beamState.nodes.map((node, index) => (
            <div key={node.id} className="grid grid-cols-2 gap-4 items-end p-3 border rounded-md bg-muted/10">
              <PropertyInput
                label={`Node ${index + 1} Position`}
                unit="m"
                value={node.x}
                onChange={(val) => {
                  const newNodes = [...beamState.nodes];
                  newNodes[index] = { ...newNodes[index], x: val };
                  setBeamState({ ...beamState, nodes: newNodes });
                }}
              />

              <div className="flex flex-col space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Boundary</Label>
                <select
                  className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={node.supportType}
                  onChange={(e) => {
                    const newNodes = [...beamState.nodes];
                    newNodes[index] = { ...newNodes[index], supportType: e.target.value as SupportType };
                    setBeamState({ ...beamState, nodes: newNodes });
                  }}
                >
                  <option value="free">Free</option>
                  <option value="pinned">Pinned</option>
                  <option value="roller">Roller</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="pt-4 border-t">
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSolve}>
          Run Analysis
        </Button>
      </div>
    </div>
  );
}
