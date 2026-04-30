'use client';

import { BeamState, Node, SupportType, AnalysisResults } from '@/lib/types/structural';
import { MatrixSolver } from '@/lib/math/MatrixSolver';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
        <h2 className="text-xl font-bold tracking-tight mb-4">Structural Parameters</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Define your nodes, elements, and load cases here.
        </p>
      </div>

      {/* Nodes Section */}
      <section className="p-4 border rounded-lg bg-background">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Nodes ({beamState.nodes.length})</h3>
          <Button size="sm" onClick={handleAddNode}>+ Add Node</Button>
        </div>

        <div className="space-y-3">
          {beamState.nodes.map((node, index) => (
            <div key={node.id} className="grid grid-cols-3 gap-2 items-end">
              <div>
                <Label className="text-xs">X Coord (m)</Label>
                <Input
                  type="number"
                  value={node.x}
                  onChange={(e) => {
                    const newNodes = [...beamState.nodes];
                    newNodes[index] = { ...newNodes[index], x: parseFloat(e.target.value) || 0 };
                    setBeamState({ ...beamState, nodes: newNodes });
                  }}
                />
              </div>
              <div>
                <Label className="text-xs">Support</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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

      {/* Elements Section */}
      <section className="p-4 border rounded-lg bg-background">
        <h3 className="font-semibold mb-2">Elements</h3>
        <p className="text-xs text-muted-foreground">
          Map elements between nodes and assign E, I values here.
        </p>
      </section>

      {/* Action Area */}
      <div className="pt-4 border-t">
        <Button className="w-full" variant="default" onClick={handleSolve}>
          Run Analysis (Solve Matrix)
        </Button>
      </div>
    </div>
  );
}
