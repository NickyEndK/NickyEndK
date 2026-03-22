import { CONFIG } from './config.js';

const SVG_NS = "http://www.w3.org/2000/svg";

export function createStarElement(data) {
    const use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', `#${data.def.id}`); 
    use.setAttribute('fill', CONFIG.STAR_COLOR); // Config driven
    use.setAttribute('opacity', data.alpha);
    const scale = data.size / data.def.originalSize;
    const offset = data.def.originalSize / 2;
    use.setAttribute('transform', `translate(${data.x}, ${data.y}) rotate(${data.rotation}) scale(${scale}) translate(${-offset}, ${-offset})`);
    return use;
}

export function drawLine(s1, s2) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', s1.x); line.setAttribute('y1', s1.y);
    line.setAttribute('x2', s1.x); line.setAttribute('y2', s1.y);
    line.setAttribute('stroke', CONFIG.LINE_COLOR); // Config driven
    line.setAttribute('stroke-width', CONFIG.LINE_WIDTH);
    line.setAttribute('opacity', '0');
    line.dataset.tx = s2.x; line.dataset.ty = s2.y;
    return line;
}
