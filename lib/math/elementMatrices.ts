import { Load, Element, Node } from '../types/structural';

interface FEMResult {
  nodeStartForceY: number;
  nodeStartMoment: number;
  nodeEndForceY: number;
  nodeEndMoment: number;
}

/**
 * Calculates Fixed End Moments and shear reactions for standard load cases.
 * Sign convention: upward force positive, counter-clockwise moment positive.
 * Flip signs after calling if state.settings.clockwisePositive is true.
 */
export function calculateElementFEM(
  load: Load,
  element: Element,
  startNode: Node,
  endNode: Node
): FEMResult {
  const L = Math.abs(endNode.x - startNode.x);
  const a = load.distanceFromStart;
  const b = L - a;
  const W = load.magnitude;

  const fem: FEMResult = {
    nodeStartForceY: 0,
    nodeStartMoment: 0,
    nodeEndForceY: 0,
    nodeEndMoment: 0,
  };

  switch (load.type) {
    case 'point':
      // Mab = -(W·a·b²)/L²  |  Mba = (W·a²·b)/L²
      fem.nodeStartMoment = -(W * a * Math.pow(b, 2)) / Math.pow(L, 2);
      fem.nodeEndMoment   =  (W * Math.pow(a, 2) * b) / Math.pow(L, 2);
      fem.nodeStartForceY = (W * Math.pow(b, 2) * (3 * a + b)) / Math.pow(L, 3);
      fem.nodeEndForceY   = (W * Math.pow(a, 2) * (a + 3 * b)) / Math.pow(L, 3);
      break;

    case 'udl':
      // Mab = -(W·L²)/12  |  Mba = (W·L²)/12
      fem.nodeStartMoment = -(W * Math.pow(L, 2)) / 12;
      fem.nodeEndMoment   =  (W * Math.pow(L, 2)) / 12;
      fem.nodeStartForceY = (W * L) / 2;
      fem.nodeEndForceY   = (W * L) / 2;
      break;

    case 'uvl':
      // Triangular load: zero at start, W at end
      fem.nodeStartMoment = -(W * Math.pow(L, 2)) / 30;
      fem.nodeEndMoment   =  (W * Math.pow(L, 2)) / 20;
      fem.nodeStartForceY = (3 * W * L) / 20;
      fem.nodeEndForceY   = (7 * W * L) / 20;
      break;

    case 'moment':
      // Concentrated moment at distance 'a'
      fem.nodeStartMoment =  (W * b * (2 * a - b)) / Math.pow(L, 2);
      fem.nodeEndMoment   =  (W * a * (2 * b - a)) / Math.pow(L, 2);
      fem.nodeStartForceY = -(6 * W * a * b) / Math.pow(L, 3);
      fem.nodeEndForceY   =  (6 * W * a * b) / Math.pow(L, 3);
      break;
  }

  return fem;
}
