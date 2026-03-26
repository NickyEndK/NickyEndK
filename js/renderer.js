// renderer.js
// SVG element factories. Responsible only for creating elements — no logic, no state.
//
// Exports:
//   createStarElement(data) — returns a <use> element for a star
//   drawLine(s1, s2)        — returns a <line> element ready for animation

import { CONFIG } from './config.js';

const SVG_NS = "http://www.w3.org/2000/svg";

// createStarElement(data)
// Creates a <use> referencing a star shape from <defs>.
// Positions, rotates, and scales it so its visual center lands exactly on data.x / data.y.
// cx/cy on the star def are auto-calculated in main.js via getBBox() — no manual values needed.
export function createStarElement(data) {
    const use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', `#${data.def.id}`);
    use.setAttribute('fill', CONFIG.STAR_COLOR);
    use.setAttribute('opacity', data.alpha);
    const scale = data.size / data.def.originalSize;
    const cx = data.def.cx;
    const cy = data.def.cy;
    // Transform order (right-to-left):
    //   1. translate(-cx, -cy)  — move shape so its visual center is at origin
    //   2. scale(scale)         — resize from originalSize to target size
    //   3. rotate(rotation)     — spin around origin (= visual center)
    //   4. translate(x, y)      — move to final position on canvas
    use.setAttribute('transform', `translate(${data.x}, ${data.y}) rotate(${data.rotation}) scale(${scale}) translate(${-cx}, ${-cy})`);
    return use;
}

// drawLine(s1, s2)
// Creates a <line> from s1 to s2, initially collapsed to a point at s1 (x2=x1, y2=y1).
// The animation in main.js reveal() expands x2/y2 toward the target stored in dataset.
export function drawLine(s1, s2) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', s1.x);
    line.setAttribute('y1', s1.y);
    line.setAttribute('x2', s1.x); // Starts collapsed — animated outward by reveal()
    line.setAttribute('y2', s1.y);
    line.setAttribute('stroke', CONFIG.LINE_COLOR);
    line.setAttribute('stroke-width', CONFIG.LINE_WIDTH);
    line.setAttribute('opacity', '0');
    line.dataset.tx = s2.x; // Target x — read by the animation loop
    line.dataset.ty = s2.y; // Target y — read by the animation loop
    return line;
}
