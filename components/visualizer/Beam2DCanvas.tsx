'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { BeamState, AnalysisResults } from '@/lib/types/structural';

interface Beam2DProps {
  state: BeamState;
  results: AnalysisResults | null;
}

export default function Beam2DCanvas({ state, results }: Beam2DProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || state.nodes.length === 0) return;

    const svg    = d3.select(svgRef.current);
    const width  = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    svg.selectAll('*').remove();

    // Vertical zones: beam at 25%, SFD baseline at 55%, BMD baseline at 85%
    const beamY = height * 0.25;
    const sfdY  = height * 0.55;
    const bmdY  = height * 0.85;

    const xMax    = d3.max(state.nodes, d => d.x) || 10;
    const xScale  = d3.scaleLinear()
      .domain([0, xMax + 2])
      .range([50, width - 50]);

    const sortedNodes = [...state.nodes].sort((a, b) => a.x - b.x);

    // --- 1. Beam line ---
    svg.append('g')
      .attr('class', 'beam-layer')
      .append('path')
      .datum(sortedNodes)
      .attr('fill', 'none')
      .attr('stroke', 'hsl(var(--primary))')
      .attr('stroke-width', 6)
      .attr('d', d3.line<(typeof sortedNodes)[number]>()
        .x(d => xScale(d.x))
        .y(beamY)
      );

    // --- 2. Support nodes ---
    svg.append('g')
      .attr('class', 'node-layer')
      .selectAll('circle')
      .data(state.nodes)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.x))
      .attr('cy', beamY)
      .attr('r', 8)
      .attr('fill', d => d.supportType === 'free' ? 'transparent' : 'hsl(var(--destructive))')
      .attr('stroke', 'currentColor')
      .attr('stroke-width', 2);

    // --- 3. SFD & BMD (only when analysis results are available) ---
    if (!results) return;

    // Derive per-node shear and moment values from the reactions array.
    // reactions layout: [u, v, θ] per node → v (index base+1) is vertical reaction.
    // For a simple visualisation, we use vertical reactions as shear ordinates
    // and compute moment by cumulative trapezoidal integration along x.
    const sfdData = sortedNodes.map((node, i) => {
      const base  = state.nodes.indexOf(node) * 3;
      const shear = results.reactions[base + 1] ?? 0;
      return { x: node.x, v: shear };
    });

    const bmdData = sortedNodes.map((node, i) => {
      // Moment at node = reaction moment DOF (base+2)
      const base   = state.nodes.indexOf(node) * 3;
      const moment = results.reactions[base + 2] ?? 0;
      return { x: node.x, m: moment };
    });

    const vMax = d3.max(sfdData, d => Math.abs(d.v)) || 1;
    const mMax = d3.max(bmdData, d => Math.abs(d.m)) || 1;

    const yScaleSFD = d3.scaleLinear()
      .domain([-vMax, vMax])
      .range([sfdY + 45, sfdY - 45]);

    // BMD drawn on tension side: positive moment curves downward (civil convention)
    const yScaleBMD = d3.scaleLinear()
      .domain([-mMax, mMax])
      .range([bmdY - 45, bmdY + 45]);

    // SFD — stepped area (point loads produce vertical jumps)
    svg.append('path')
      .datum(sfdData)
      .attr('fill', 'rgba(59,130,246,0.25)')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2)
      .attr('d', d3.area<(typeof sfdData)[number]>()
        .curve(d3.curveStepAfter)
        .x(d => xScale(d.x))
        .y0(sfdY)
        .y1(d => yScaleSFD(d.v))
      );

    // SFD baseline + label
    svg.append('line')
      .attr('x1', 50).attr('x2', width - 50)
      .attr('y1', sfdY).attr('y2', sfdY)
      .attr('stroke', 'currentColor').attr('stroke-width', 1).attr('opacity', 0.4);
    svg.append('text')
      .attr('x', 50).attr('y', sfdY - 52)
      .text('SFD').attr('fill', 'currentColor').attr('font-size', '12px');

    // BMD — linear between nodes (switch to curveNatural for UDL parabolas)
    svg.append('path')
      .datum(bmdData)
      .attr('fill', 'rgba(239,68,68,0.25)')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 2)
      .attr('d', d3.area<(typeof bmdData)[number]>()
        .curve(d3.curveLinear)
        .x(d => xScale(d.x))
        .y0(bmdY)
        .y1(d => yScaleBMD(d.m))
      );

    // BMD baseline + label
    svg.append('line')
      .attr('x1', 50).attr('x2', width - 50)
      .attr('y1', bmdY).attr('y2', bmdY)
      .attr('stroke', 'currentColor').attr('stroke-width', 1).attr('opacity', 0.4);
    svg.append('text')
      .attr('x', 50).attr('y', bmdY - 52)
      .text('BMD').attr('fill', 'currentColor').attr('font-size', '12px');

  }, [state, results]);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ minHeight: '600px' }}
    />
  );
}
