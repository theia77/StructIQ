import * as math from 'mathjs';
import { BeamState, Element } from '../types/structural';
import { assembleGlobalForceVector } from './forceVector';

export class MatrixSolver {
  private state: BeamState;
  private dofPerNode = 3; // u (x-disp), v (y-disp), theta (rotation)

  constructor(initialState: BeamState) {
    this.state = initialState;
  }

  // Local 6×6 stiffness matrix for a 2D frame element
  private getLocalStiffnessMatrix(element: Element, length: number): math.Matrix {
    const { E, I, A } = element;
    const L  = length;
    const L2 = L * L;
    const L3 = L * L * L;

    const k = [
      [ A*E/L,           0,          0, -A*E/L,           0,          0],
      [     0,  12*E*I/L3,  6*E*I/L2,      0, -12*E*I/L3,  6*E*I/L2],
      [     0,   6*E*I/L2,   4*E*I/L,      0,  -6*E*I/L2,   2*E*I/L],
      [-A*E/L,           0,          0,  A*E/L,           0,          0],
      [     0, -12*E*I/L3, -6*E*I/L2,      0,  12*E*I/L3, -6*E*I/L2],
      [     0,   6*E*I/L2,   2*E*I/L,      0,  -6*E*I/L2,   4*E*I/L],
    ];

    // TODO: apply static condensation here when element.hasInternalHinge is true

    return math.matrix(k);
  }

  // Assemble the Global Stiffness Matrix [K]
  public assembleGlobalMatrix(): math.Matrix {
    const totalDof = this.state.nodes.length * this.dofPerNode;
    let K_global = math.zeros([totalDof, totalDof], 'dense') as math.Matrix;

    this.state.elements.forEach(el => {
      const startNode = this.state.nodes.find(n => n.id === el.startNodeId)!;
      const endNode   = this.state.nodes.find(n => n.id === el.endNodeId)!;
      const length    = Math.abs(endNode.x - startNode.x);

      const k_local  = this.getLocalStiffnessMatrix(el, length);
      const si       = this.state.nodes.indexOf(startNode) * this.dofPerNode;
      const ei       = this.state.nodes.indexOf(endNode)   * this.dofPerNode;
      const indices  = [si, si+1, si+2, ei, ei+1, ei+2];

      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
          const gi  = indices[i];
          const gj  = indices[j];
          const cur = K_global.get([gi, gj]) as number;
          const add = k_local.get([i, j])    as number;
          K_global.set([gi, gj], cur + add);
        }
      }
    });

    return K_global;
  }

  // Solve [K]{D} = {F} using boundary-condition partitioning
  public solve(): { displacements: number[]; reactions: number[] } {
    const K_global = this.assembleGlobalMatrix();
    const F_global = assembleGlobalForceVector(this.state);
    const totalDof = this.state.nodes.length * this.dofPerNode;

    // 1. Classify each DOF as free or restricted based on support type
    const restrictedDofs: number[] = [];
    const freeDofs:       number[] = [];

    this.state.nodes.forEach((node, ni) => {
      const base = ni * this.dofPerNode; // u=base, v=base+1, θ=base+2

      switch (node.supportType) {
        case 'fixed':
          restrictedDofs.push(base, base + 1, base + 2);
          break;
        case 'pinned':
          restrictedDofs.push(base, base + 1);
          freeDofs.push(base + 2);
          break;
        case 'roller':
          restrictedDofs.push(base + 1);         // vertical only
          freeDofs.push(base, base + 2);
          break;
        case 'free':
          freeDofs.push(base, base + 1, base + 2);
          break;
      }
    });

    if (freeDofs.length === 0) {
      throw new Error('No free degrees of freedom — structure is fully locked.');
    }

    // 2. Extract K_free and F_free by partitioning
    const K_free = math.subset(K_global, math.index(freeDofs, freeDofs)) as math.Matrix;
    const F_free = math.subset(F_global, math.index(freeDofs, [0]))      as math.Matrix;

    // 3. Invert K_free and solve for free displacements
    let D_free: math.Matrix;
    try {
      D_free = math.multiply(math.inv(K_free), F_free) as math.Matrix;
    } catch (err) {
      console.error('Matrix inversion failed:', err);
      throw new Error('Unstable structure: stiffness matrix is singular.');
    }

    // 4. Reconstruct full displacement vector (restricted DOFs stay 0)
    const D_full = math.zeros([totalDof, 1], 'dense') as math.Matrix;
    freeDofs.forEach((dof, i) => {
      D_full.set([dof, 0], D_free.get([i, 0]) as number);
    });

    // 5. Back-substitute to get reactions: {R} = [K]{D} − {F}
    const KD        = math.multiply(K_global, D_full) as math.Matrix;
    const Reactions = math.subtract(KD, F_global)     as math.Matrix;

    return {
      displacements: (D_full.toArray()   as number[][]).flat(),
      reactions:     (Reactions.toArray() as number[][]).flat(),
    };
  }
}
