import * as math from 'mathjs';
import { BeamState } from '../types/structural';
import { calculateElementFEM } from './elementMatrices';

export function assembleGlobalForceVector(state: BeamState): math.Matrix {
  const dofPerNode = 3; // u, v, theta
  const totalDof = state.nodes.length * dofPerNode;

  let F = math.zeros([totalDof, 1], 'dense') as math.Matrix;

  // 1. Add direct nodal loads
  state.loads.forEach(load => {
    if (!load.nodeId) return;

    const nodeIndex = state.nodes.findIndex(n => n.id === load.nodeId);
    if (nodeIndex === -1) return;

    const base = nodeIndex * dofPerNode;

    if (load.type === 'point') {
      F.set([base + 1, 0], (F.get([base + 1, 0]) as number) + load.magnitude);
    } else if (load.type === 'moment') {
      F.set([base + 2, 0], (F.get([base + 2, 0]) as number) + load.magnitude);
    }
  });

  // 2. Subtract Fixed End Moment equivalent nodal forces for element loads
  state.loads.forEach(load => {
    if (!load.elementId) return;

    const element = state.elements.find(e => e.id === load.elementId);
    if (!element) return;

    const startNode = state.nodes.find(n => n.id === element.startNodeId)!;
    const endNode   = state.nodes.find(n => n.id === element.endNodeId)!;

    const fem = calculateElementFEM(load, element, startNode, endNode);

    const si = state.nodes.findIndex(n => n.id === startNode.id) * dofPerNode;
    const ei = state.nodes.findIndex(n => n.id === endNode.id)   * dofPerNode;

    // Equivalent nodal forces = −FEM (move fixed-end reactions to the free side)
    F.set([si + 1, 0], (F.get([si + 1, 0]) as number) - fem.nodeStartForceY);
    F.set([si + 2, 0], (F.get([si + 2, 0]) as number) - fem.nodeStartMoment);
    F.set([ei + 1, 0], (F.get([ei + 1, 0]) as number) - fem.nodeEndForceY);
    F.set([ei + 2, 0], (F.get([ei + 2, 0]) as number) - fem.nodeEndMoment);
  });

  return F;
}
