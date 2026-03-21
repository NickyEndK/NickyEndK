import { CONFIG } from './config.js';
import { CONSTELLATIONS } from './constellations.js';
import { randomBetween, pointToSegmentDistance } from './mathUtils.js';

const svg = document.getElementById('starfield');
const SVG_NS = "http://www.w3.org/2000/svg";

let stars = [];
let constellationData = { stars: [], lines: [], connections: [] };
let constellationId = null;
let currentScale = 1;
let isDrawing = false;
let revealed = false;

function createStarElement(data) {
    const use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', data.def.id);
    use.setAttribute('fill', '#ffffff');
    use.setAttribute('opacity', data.alpha);
    const scale = data.size / data.def.originalSize;
    const offset = data.def.originalSize / 2;
    use.setAttribute('transform', `translate(${data.x}, ${data.y}) rotate(${data.rotation}) scale(${scale}) translate(${-offset}, ${-offset})`);
    return use;
}

function placeStars(id) {
    const config = CONSTELLATIONS[id];
    constellationId = id;
    stars = [];
    constellationData = { stars: [], lines: [], connections: [] };
    svg.innerHTML = '';

    const minDim = Math.min(window.innerWidth, window.innerHeight);
    currentScale = (Math.max(0.5, (minDim * 0.75) / 110)) * (config.scale || 1);

    // 1. Process Constellation Points
    let globalIdx = 0;
    const patternPoints = [];
    config.paths.forEach(pathStr => {
        const pairs = pathStr.match(/\d+\.\d+,\d+\.\d+/g);
        if (pairs) {
            const startIdx = globalIdx;
            pairs.forEach((pair, localIdx) => {
                const [rx, ry] = pair.split(',').map(Number);
                patternPoints.push({ rx, ry, def: CONFIG.STAR_DEFS[Math.floor(Math.random() * CONFIG.STAR_DEFS.length)] });
                if (localIdx > 0) constellationData.connections.push([globalIdx - 1, globalIdx]);
                globalIdx++;
            });
        }
    });

    const offX = randomBetween(50, window.innerWidth - (80 * currentScale) - 50);
    const offY = randomBetween(50, window.innerHeight - (110 * currentScale) - 50);

    patternPoints.forEach((pt, idx) => {
        constellationData.stars.push({
            x: offX + (pt.rx * currentScale),
            y: offY + (pt.ry * currentScale),
            size: randomBetween(CONFIG.STAR_MIN_SIZE, CONFIG.STAR_MAX_SIZE),
            rotation: randomBetween(0, 360),
            def: pt.def,
            alpha: randomBetween(CONFIG.MIN_STAR_ALPHA, CONFIG.MAX_STAR_ALPHA)
        });
    });

    // 2. Generate Background Stars (Avoiding Constellation lines/points)
    for (let i = 0; i < CONFIG.STAR_COUNT; i++) {
        for (let attempt = 0; attempt < CONFIG.MAX_STAR_PLACEMENT_ATTEMPTS; attempt++) {
            const size = randomBetween(CONFIG.STAR_MIN_SIZE, CONFIG.STAR_MAX_SIZE);
            const x = randomBetween(size, window.innerWidth - size);
            const y = randomBetween(size, window.innerHeight - size);

            let tooClose = constellationData.stars.some(s => Math.hypot(x - s.x, y - s.y) < 15);
            if (!tooClose) {
                tooClose = constellationData.connections.some(([i1, i2]) => {
                    const s1 = constellationData.stars[i1];
                    const s2 = constellationData.stars[i2];
                    return pointToSegmentDistance(x, y, s1.x, s1.y, s2.x, s2.y) < 20;
                });
            }

            if (!tooClose) {
                stars.push({ x, y, size, rotation: randomBetween(0, 360), def: CONFIG.STAR_DEFS[Math.floor(Math.random() * CONFIG.STAR_DEFS.length)], alpha: randomBetween(CONFIG.MIN_STAR_ALPHA, CONFIG.MAX_STAR_ALPHA) });
                break;
            }
        }
    }
}

function initDOM() {
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    const frag = document.createDocumentFragment();
    const gLines = document.createElementNS(SVG_NS, 'g');
    
    stars.forEach(s => frag.appendChild(createStarElement(s)));
    
    constellationData.connections.forEach(([i, j]) => {
        const line = document.createElementNS(SVG_NS, 'line');
        const s1 = constellationData.stars[i];
        const s2 = constellationData.stars[j];
        line.setAttribute('x1', s1.x); line.setAttribute('y1', s1.y);
        line.setAttribute('x2', s1.x); line.setAttribute('y2', s1.y);
        line.setAttribute('stroke', '#ffffff'); line.setAttribute('stroke-width', '0.8');
        line.setAttribute('opacity', '0');
        line.dataset.tx = s2.x; line.dataset.ty = s2.y;
        gLines.appendChild(line);
        constellationData.lines.push(line);
    });
    
    frag.appendChild(gLines);
    constellationData.stars.forEach(s => frag.appendChild(createStarElement(s)));
    svg.appendChild(frag);
}

function reveal() {
    if (revealed || isDrawing) return;
    isDrawing = true;
    let idx = 0;
    const drawNext = () => {
        if (idx >= constellationData.lines.length) { revealed = true; isDrawing = false; return; }
        const l = constellationData.lines[idx];
        l.setAttribute('opacity', '0.7');
        let prog = 0;
        const x1 = parseFloat(l.getAttribute('x1')), y1 = parseFloat(l.getAttribute('y1'));
        const tx = parseFloat(l.dataset.tx), ty = parseFloat(l.dataset.ty);
        const animate = () => {
            prog += CONFIG.LINE_DRAW_SPEED;
            if (prog >= 1) { l.setAttribute('x2', tx); l.setAttribute('y2', ty); idx++; drawNext(); }
            else { l.setAttribute('x2', x1 + (tx - x1) * prog); l.setAttribute('y2', y1 + (ty - y1) * prog); requestAnimationFrame(animate); }
        };
        animate();
    };
    drawNext();
}

// Start
placeStars('wolf');
initDOM();

svg.addEventListener('click', e => {
    const buf = (CONSTELLATIONS[constellationId].clickBuffer || 15) * currentScale;
    const hit = constellationData.stars.some(s => Math.hypot(e.clientX - s.x, e.clientY - s.y) < buf);
    if (hit) reveal();
});

window.addEventListener('resize', () => { placeStars('wolf'); initDOM(); });
