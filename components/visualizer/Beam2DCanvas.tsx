'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { BeamState, AnalysisResults } from '@/lib/types/structural';

interface Beam2DProps {
  state: BeamState;
  results: AnalysisResults | null;
}

export default function Beam2DCanvas({ state, results }: Beam2DProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const draw = useCallback(() => {
    if (!svgRef.current) return;

    const width  = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Skip if the SVG hasn't been laid out yet (clientWidth is 0 before paint)
    if (width === 0 || height === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (state.nodes.length === 0) {
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#94a3b8')
        .attr('font-size', '14px')
        .text('Add nodes in the right panel to begin');
      return;
    }

    const beamY = height * 0.25;
    const sfdY  = height * 0.55;
    const bmdY  = height * 0.85;

    const xMin     = d3.min(state.nodes, d => d.x) ?? 0;
    const xMax     = d3.max(state.nodes, d => d.x) ?? 10;
    const xPad     = Math.max((xMax - xMin) * 0.15, 1);
    const xScale   = d3.scaleLinear()
      .domain([xMin - xPad, xMax + xPad])
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
      .attr('stroke-linecap', 'round')
      .attr('d', d3.line<(typeof sortedNodes)[number]>()
        .x(d => xScale(d.x))
        .y(beamY)
      );

    // --- 2. X-axis tick labels ---
    const nodeLayer = svg.append('g').attr('class', 'node-layer');

    sortedNodes.forEach(node => {
      const cx = xScale(node.x);

      // Support symbol below the beam line
      if (node.supportType !== 'free') {
        if (node.supportType === 'fixed') {
          // Hatched rectangle
          nodeLayer.append('rect')
            .attr('x', cx - 10).attr('y', beamY)
            .attr('width', 20).attr('height', 18)
            .attr('fill', 'hsl(var(--destructive))')
            .attr('opacity', 0.8);
        } else if (node.supportType === 'pinned') {
          // Triangle
          const triPath = `M${cx},${beamY} L${cx - 12},${beamY + 20} L${cx + 12},${beamY + 20} Z`;
          nodeLayer.append('path')
            .attr('d', triPath)
            .attr('fill', 'hsl(var(--destructive))')
            .attr('opacity', 0.85);
          // Ground line
          nodeLayer.append('line')
            .attr('x1', cx - 14).attr('x2', cx + 14)
            .attr('y1', beamY + 20).attr('y2', beamY + 20)
            .attr('stroke', 'hsl(var(--destructive))')
            .attr('stroke-width', 2);
        } else if (node.supportType === 'roller') {
          // Circle on ground
          nodeLayer.append('circle')
            .attr('cx', cx).attr('cy', beamY + 14)
            .attr('r', 7)
            .attr('fill', 'none')
            .attr('stroke', 'hsl(var(--destructive))')
            .attr('stroke-width', 2);
          // Ground line
          nodeLayer.append('line')
            .attr('x1', cx - 14).attr('x2', cx + 14)
            .attr('y1', beamY + 21).attr('y2', beamY + 21)
            .attr('stroke', 'hsl(var(--destructive))')
            .attr('stroke-width', 2);
        }
      }

      // Node dot on beam
      nodeLayer.append('circle')
        .attr('cx', cx).attr('cy', beamY)
        .attr('r', 5)
        .attr('fill', 'hsl(var(--primary))')
        .attr('stroke', 'white')
        .attr('stroke-width', 1.5);

      // X label
      nodeLayer.append('text')
        .attr('x', cx).attr('y', beamY - 14)
        .attr('text-anchor', 'middle')
        .attr('fill', 'currentColor')
        .attr('font-size', '11px')
        .text(`${node.x}m`);

      // Support type label
      if (node.supportType !== 'free') {
        nodeLayer.append('text')
          .attr('x', cx).attr('y', beamY + 40)
          .attr('text-anchor', 'middle')
          .attr('fill', 'hsl(var(--destructive))')
          .attr('font-size', '10px')
          .text(node.supportType);
      }
    });

    // Draw point loads (arrows) from the loads array
    state.loads.forEach(load => {
      if (load.type !== 'point' && load.type !== 'moment') return;
      if (!load.nodeId) return;
      const targetNode = state.nodes.find(n => n.id === load.nodeId);
      if (!targetNode) return;
      const cx = xScale(targetNode.x);
      const arrowLen = 35;
      const isDown = load.magnitude < 0;
      const yStart = isDown ? beamY - arrowLen : beamY + arrowLen;

      if (load.type === 'point') {
        // Arrow line
        nodeLayer.append('line')
          .attr('x1', cx).attr('y1', yStart)
          .attr('x2', cx).attr('y2', beamY)
          .attr('stroke', '#f59e0b')
          .attr('stroke-width', 2)
          .attr('marker-end', 'url(#arrow)');
        // Magnitude label
        nodeLayer.append('text')
          .attr('x', cx + 6).attr('y', yStart)
          .attr('fill', '#f59e0b')
          .attr('font-size', '11px')
          .text(`${Math.abs(load.magnitude)}kN`);
      }
    });

    // Arrowhead marker definition
    const defs = svg.append('defs');
    defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8).attr('refY', 0)
      .attr('markerWidth', 6).attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#f59e0b');

    // --- 3. UDL arrows on elements ---
    state.loads.forEach(load => {
      if (load.type !== 'udl') return;
      if (!load.elementId) return;
      const el = state.elements.find(e => e.id === load.elementId);
      if (!el) return;
      const sn = state.nodes.find(n => n.id === el.startNodeId);
      const en = state.nodes.find(n => n.id === el.endNodeId);
      if (!sn || !en) return;
      const x1 = xScale(Math.min(sn.x, en.x));
      const x2 = xScale(Math.max(sn.x, en.x));
      const arrowY = beamY - 30;
      const step = (x2 - x1) / 5;
      for (let xPos = x1; xPos <= x2 + 0.1; xPos += step) {
        nodeLayer.append('line')
          .attr('x1', xPos).attr('y1', arrowY)
          .attr('x2', xPos).attr('y2', beamY)
          .attr('stroke', '#f59e0b').attr('stroke-width', 1.5);
      }
      nodeLayer.append('line')
        .attr('x1', x1).attr('y1', arrowY)
        .attr('x2', x2).attr('y2', arrowY)
        .attr('stroke', '#f59e0b').attr('stroke-width', 1.5);
      nodeLayer.append('text')
        .attr('x', (x1 + x2) / 2).attr('y', arrowY - 5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#f59e0b').attr('font-size', '11px')
        .text(`${load.magnitude}kN/m`);
    });

    // --- 4. SFD & BMD (only when analysis results are available) ---
    if (!results) return;

    const sfdData = sortedNodes.map(node => {
      const base  = state.nodes.findIndex(n => n.id === node.id) * 3;
      const shear = results.reactions[base + 1] ?? 0;
      return { x: node.x, v: shear };
    });

    const bmdData = sortedNodes.map(node => {
      const base   = state.nodes.findIndex(n => n.id === node.id) * 3;
      const moment = results.reactions[base + 2] ?? 0;
      return { x: node.x, m: moment };
    });

    const vMax = d3.max(sfdData, d => Math.abs(d.v)) || 1;
    const mMax = d3.max(bmdData, d => Math.abs(d.m)) || 1;

    const yScaleSFD = d3.scaleLinear()
      .domain([-vMax, vMax])
      .range([sfdY + 45, sfdY - 45]);

    const yScaleBMD = d3.scaleLinear()
      .domain([-mMax, mMax])
      .range([bmdY - 45, bmdY + 45]);

    // SFD — stepped area
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

    svg.append('line')
      .attr('x1', 50).attr('x2', width - 50)
      .attr('y1', sfdY).attr('y2', sfdY)
      .attr('stroke', 'currentColor').attr('stroke-width', 1).attr('opacity', 0.4);
    svg.append('text')
      .attr('x', 50).attr('y', sfdY - 52)
      .text('SFD (kN)').attr('fill', 'currentColor').attr('font-size', '12px');

    // BMD — linear between nodes
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

    svg.append('line')
      .attr('x1', 50).attr('x2', width - 50)
      .attr('y1', bmdY).attr('y2', bmdY)
      .attr('stroke', 'currentColor').attr('stroke-width', 1).attr('opacity', 0.4);
    svg.append('text')
      .attr('x', 50).attr('y', bmdY - 52)
      .text('BMD (kN·m)').attr('fill', 'currentColor').attr('font-size', '12px');

  }, [state, results]);

  // Re-draw whenever state/results change, and also whenever the SVG is resized
  useEffect(() => {
    draw();

    const observer = new ResizeObserver(() => draw());
    if (svgRef.current) observer.observe(svgRef.current);
    return () => observer.disconnect();
  }, [draw]);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ minHeight: '600px' }}
    />
  );
}
