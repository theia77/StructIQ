'use client';

import { BeamState, AnalysisResults, Node, Element, Load, SupportType, LoadType } from '@/lib/types/structural';
import { MatrixSolver } from '@/lib/math/MatrixSolver';
import PropertyInput from '@/components/forms/PropertyInput';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// Default steel section: E=200 GPa, I=8.33e-5 m⁴ (~200×200mm), A=0.004 m²
const DEFAULT_E = 200e9;
const DEFAULT_I = 8.33e-5;
const DEFAULT_A = 0.004;

interface RightPanelProps {
  beamState: BeamState;
  setBeamState: React.Dispatch<React.SetStateAction<BeamState>>;
  setAnalysisResults: React.Dispatch<React.SetStateAction<AnalysisResults | null>>;
}

export default function RightPanel({ beamState, setBeamState, setAnalysisResults }: RightPanelProps) {

  // --- Nodes ---
  const handleAddNode = () => {
    const newNode: Node = {
      id: `n-${Date.now()}`,
      x: beamState.nodes.length * 5,   // space nodes 5 m apart by default
      y: 0,
      supportType: 'free',
    };

    setBeamState(prev => {
      const updatedNodes    = [...prev.nodes, newNode];
      const updatedElements = [...prev.elements];

      // Auto-connect the new node to the previous last node
      if (prev.nodes.length >= 1) {
        const prevNode = prev.nodes[prev.nodes.length - 1];
        const newElement: Element = {
          id: `el-${Date.now()}`,
          startNodeId: prevNode.id,
          endNodeId:   newNode.id,
          E: DEFAULT_E,
          I: DEFAULT_I,
          A: DEFAULT_A,
          hasInternalHinge: false,
        };
        updatedElements.push(newElement);
      }

      return { ...prev, nodes: updatedNodes, elements: updatedElements };
    });
  };

  const handleRemoveNode = (nodeId: string) => {
    setBeamState(prev => ({
      ...prev,
      nodes:    prev.nodes.filter(n => n.id !== nodeId),
      elements: prev.elements.filter(e => e.startNodeId !== nodeId && e.endNodeId !== nodeId),
      loads:    prev.loads.filter(l => l.nodeId !== nodeId),
    }));
    setAnalysisResults(null);
  };

  const handleNodeChange = (index: number, field: keyof Node, value: number | SupportType) => {
    setBeamState(prev => {
      const newNodes  = [...prev.nodes];
      newNodes[index] = { ...newNodes[index], [field]: value };
      return { ...prev, nodes: newNodes };
    });
  };

  // --- Elements ---
  const handleElementChange = (index: number, field: keyof Element, value: number) => {
    setBeamState(prev => {
      const newEls  = [...prev.elements];
      newEls[index] = { ...newEls[index], [field]: value };
      return { ...prev, elements: newEls };
    });
  };

  // --- Loads ---
  const handleAddLoad = () => {
    if (beamState.nodes.length === 0) {
      toast.error('Add at least one node before adding a load.');
      return;
    }
    const newLoad: Load = {
      id:                `ld-${Date.now()}`,
      nodeId:            beamState.nodes[0].id,
      type:              'point',
      magnitude:         -10,
      distanceFromStart: 0,
    };
    setBeamState(prev => ({ ...prev, loads: [...prev.loads, newLoad] }));
  };

  const handleRemoveLoad = (loadId: string) => {
    setBeamState(prev => ({ ...prev, loads: prev.loads.filter(l => l.id !== loadId) }));
  };

  const handleLoadChange = (index: number, field: keyof Load, value: string | number) => {
    setBeamState(prev => {
      const newLoads  = [...prev.loads];
      const updated   = { ...newLoads[index], [field]: value } as Load;
      // When switching to element-based type, clear nodeId; otherwise clear elementId
      if (field === 'type') {
        if (value === 'udl' || value === 'uvl') {
          updated.nodeId    = undefined;
          updated.elementId = beamState.elements[0]?.id;
        } else {
          updated.elementId = undefined;
          updated.nodeId    = beamState.nodes[0]?.id;
        }
      }
      newLoads[index] = updated;
      return { ...prev, loads: newLoads };
    });
  };

  // --- Solve ---
  const handleSolve = () => {
    if (beamState.nodes.length < 2) {
      toast.error('Need at least 2 nodes to run analysis.');
      return;
    }
    if (beamState.elements.length === 0) {
      toast.error('No elements defined — add nodes to auto-create elements.');
      return;
    }
    try {
      const solver  = new MatrixSolver(beamState);
      const results = solver.solve();
      setAnalysisResults(results);
      toast.success('Analysis complete!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? `Analysis failed: ${err.message}` : 'An unknown error occurred.');
      setAnalysisResults(null);
    }
  };

  const nodeLabel = (nodeId: string) => {
    const i = beamState.nodes.findIndex(n => n.id === nodeId);
    return i >= 0 ? `Node ${i + 1} (x=${beamState.nodes[i].x}m)` : nodeId;
  };

  const elementLabel = (elId: string) => {
    const i = beamState.elements.findIndex(e => e.id === elId);
    if (i < 0) return elId;
    const el = beamState.elements[i];
    const sn = beamState.nodes.findIndex(n => n.id === el.startNodeId) + 1;
    const en = beamState.nodes.findIndex(n => n.id === el.endNodeId)   + 1;
    return `Elem ${i + 1} (N${sn}→N${en})`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-1">Structural Parameters</h2>
        <p className="text-sm text-muted-foreground">Define nodes, elements, and loads.</p>
      </div>

      {/* ── Nodes ── */}
      <section className="p-4 border rounded-lg bg-background">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Nodes ({beamState.nodes.length})</h3>
          <Button size="sm" onClick={handleAddNode}>+ Add Node</Button>
        </div>

        <div className="space-y-3">
          {beamState.nodes.map((node, index) => (
            <div key={node.id} className="grid grid-cols-2 gap-3 items-end p-3 border rounded-md bg-muted/10">
              <PropertyInput
                label={`Node ${index + 1} — X Position`}
                unit="m"
                value={node.x}
                onChange={val => handleNodeChange(index, 'x', val)}
              />

              <div className="flex flex-col space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Boundary</Label>
                <select
                  className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={node.supportType}
                  onChange={e => handleNodeChange(index, 'supportType', e.target.value as SupportType)}
                >
                  <option value="free">Free</option>
                  <option value="pinned">Pinned</option>
                  <option value="roller">Roller</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>

              <div className="col-span-2 flex justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive h-6 px-2 text-xs"
                  onClick={() => handleRemoveNode(node.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
          {beamState.nodes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">No nodes yet.</p>
          )}
        </div>
      </section>

      {/* ── Elements ── */}
      {beamState.elements.length > 0 && (
        <section className="p-4 border rounded-lg bg-background">
          <h3 className="font-semibold mb-3">Elements ({beamState.elements.length})</h3>
          <div className="space-y-3">
            {beamState.elements.map((el, index) => {
              const sn = beamState.nodes.findIndex(n => n.id === el.startNodeId) + 1;
              const en = beamState.nodes.findIndex(n => n.id === el.endNodeId)   + 1;
              return (
                <div key={el.id} className="p-3 border rounded-md bg-muted/10 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Element {index + 1}: Node {sn} → Node {en}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <PropertyInput
                      label="E (GPa)"
                      unit=""
                      value={parseFloat((el.E / 1e9).toFixed(4))}
                      onChange={val => handleElementChange(index, 'E', val * 1e9)}
                    />
                    <PropertyInput
                      label="I (×10⁻⁵ m⁴)"
                      unit=""
                      value={parseFloat((el.I * 1e5).toFixed(4))}
                      onChange={val => handleElementChange(index, 'I', val / 1e5)}
                    />
                    <PropertyInput
                      label="A (m²)"
                      unit=""
                      value={parseFloat(el.A.toFixed(5))}
                      onChange={val => handleElementChange(index, 'A', val)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Loads ── */}
      <section className="p-4 border rounded-lg bg-background">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Loads ({beamState.loads.length})</h3>
          <Button size="sm" onClick={handleAddLoad}>+ Add Load</Button>
        </div>

        <div className="space-y-3">
          {beamState.loads.map((load, index) => {
            const isElementLoad = load.type === 'udl' || load.type === 'uvl';
            return (
              <div key={load.id} className="p-3 border rounded-md bg-muted/10 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* Load type */}
                  <div className="flex flex-col space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Type</Label>
                    <select
                      className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={load.type}
                      onChange={e => handleLoadChange(index, 'type', e.target.value as LoadType)}
                    >
                      <option value="point">Point Load (node)</option>
                      <option value="moment">Moment (node)</option>
                      <option value="udl">UDL (element)</option>
                      <option value="uvl">UVL (element)</option>
                    </select>
                  </div>

                  {/* Node or Element selector */}
                  {isElementLoad ? (
                    <div className="flex flex-col space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Element</Label>
                      <select
                        className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={load.elementId ?? ''}
                        onChange={e => handleLoadChange(index, 'elementId', e.target.value)}
                      >
                        {beamState.elements.map(el => (
                          <option key={el.id} value={el.id}>{elementLabel(el.id)}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">At Node</Label>
                      <select
                        className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={load.nodeId ?? ''}
                        onChange={e => handleLoadChange(index, 'nodeId', e.target.value)}
                      >
                        {beamState.nodes.map(n => (
                          <option key={n.id} value={n.id}>{nodeLabel(n.id)}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 items-end">
                  <PropertyInput
                    label={load.type === 'udl' || load.type === 'uvl' ? 'Magnitude (kN/m)' : 'Magnitude (kN)'}
                    unit=""
                    value={load.magnitude}
                    onChange={val => handleLoadChange(index, 'magnitude', val)}
                  />
                  {(load.type === 'point' && load.elementId) && (
                    <PropertyInput
                      label="Distance from start (m)"
                      unit="m"
                      value={load.distanceFromStart}
                      onChange={val => handleLoadChange(index, 'distanceFromStart', val)}
                    />
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive h-6 px-2 text-xs"
                    onClick={() => handleRemoveLoad(load.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
          {beamState.loads.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">No loads yet.</p>
          )}
        </div>
      </section>

      {/* ── Run Analysis ── */}
      <div className="pt-2 border-t">
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleSolve}
          disabled={beamState.nodes.length < 2}
        >
          Run Analysis
        </Button>
        {beamState.nodes.length < 2 && (
          <p className="text-xs text-muted-foreground text-center mt-1">Need at least 2 nodes.</p>
        )}
      </div>
    </div>
  );
}
