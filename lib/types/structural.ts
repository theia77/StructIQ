export type SupportType = 'fixed' | 'pinned' | 'roller' | 'free';
export type LoadType = 'point' | 'udl' | 'uvl' | 'moment';

export interface Node {
  id: string;
  x: number;
  y: number;
  supportType: SupportType;
}

export interface Element {
  id: string;
  startNodeId: string;
  endNodeId: string;
  E: number; // Young's Modulus
  I: number; // Moment of Inertia
  A: number; // Cross-sectional Area (needed for full frame DSM)
  hasInternalHinge: boolean; // For moment release
}

export interface Load {
  id: string;
  elementId?: string; // For distributed loads
  nodeId?: string;    // For nodal point loads/moments
  type: LoadType;
  magnitude: number;  // For UDL/UVL, this could be an array [startMag, endMag]
  distanceFromStart: number;
}

export interface BeamState {
  nodes: Node[];
  elements: Element[];
  loads: Load[];
  settings: {
    clockwisePositive: boolean;
  };
}

export interface AnalysisResults {
  displacements: number[];
  reactions: number[];
  // Future: per-element internal force arrays for smooth SFD/BMD curve interpolation
}
