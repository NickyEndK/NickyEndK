// --- CONFIGURATION OBJECT ---
const CONFIG = {
    STAR_COUNT: 200,
    STAR_MIN_SIZE: 3,
    STAR_MAX_SIZE: 6,
    OVERLAP_PADDING_BG: 2, 
    MAX_STAR_PLACEMENT_ATTEMPTS: 100,
    MIN_STAR_ALPHA: 0.2,
    MAX_STAR_ALPHA: 1.0,

    STAR_DEFS: [
        { id: '#star1', originalSize: 100 },
        { id: '#star2', originalSize: 100 },
        { id: '#star3', originalSize: 100 },
        { id: '#star4', originalSize: 100 }
    ],

    CONSTELLATIONS: {
        wolf: {
            paths: [
                "M14.500,96.500 L23.500,78.500 L26.500,64.500 L26.500,49.500 L32.500,47.500 L16.500,33.500 L2.500,33.500 L9.500,28.500 L2.500,28.500 L9.500,24.500 L6.500,20.500 L22.500,23.500 L39.500,9.500 L40.500,2.500 L43.500,9.500 L55.500,6.500 L67.500,12.500 L50.500,13.500 L61.500,16.500 L69.500,26.500 L55.500,25.500 L48.500,34.500 L35.500,42.500 L37.500,47.500 L40.500,46.500 L43.500,51.500 L52.500,55.500 L51.500,87.500 L56.500,100.500",
                "M50.500,66.500 L44.500,76.500 L44.500,100.500",
                "M45.500,88.500 L51.500,99.500",
                "M41.500,84.500 L41.500,100.500",
                "M37.500,84.500 L24.500,99.500 L38.500,92.500 L39.500,100.500",
                "M18.500,99.500 L31.500,57.500 L38.500,72.500 L26.500,84.500"
            ],
            scale: 0.75,
            clickBuffer: 15,
        }
    },

    LINE_DRAW_SPEED: 0.08,
};

const svg = document.getElementById('starfield');
const SVG_NS = "http://www.w3.org/2000/svg";

let stars = [];
let constellationData = { stars: [], lines: [], connections: [] };
let constellationId = null;
let constellationOffset = { x: 0, y: 0 };
let constellationRevealed = false;
let isDrawing = false;
let CURRENT_SCALE = 1; // Track the calculated scale globally

function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function placeStars(id) {
    if (!CONFIG.CONSTELLATIONS[id]) return;
    constellationId = id;
    const config = CONFIG.CONSTELLATIONS[id];

    // Reset
    stars = [];
    constellationData = { stars: [], lines: [], connections: [] };
    constellationRevealed = false;
    isDrawing = false;
    svg.innerHTML = '';

    const minDim = Math.min(window.innerWidth, window.innerHeight);
    const baseScale = (minDim * 0.75) / 110;
    CURRENT_SCALE = Math.max(0.5, baseScale) * (config.scale || 1);

    const patternPoints = [];
    let globalIdx = 0;

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
            if (pathStr.trim().endsWith('Z')) constellationData.connections.push([globalIdx - 1, startIdx]);
        }
    });

    // Wolf width is closer to 80 units based on paths
    const scaledW = 80 * CURRENT_SCALE;
    const scaledH = 110 * CURRENT_SCALE;
    const margin = 50;

    constellationOffset.x = randomBetween(margin, Math.max(margin, window.innerWidth - scaledW - margin));
    constellationOffset.y = randomBetween(margin, Math.max(margin, window.innerHeight - scaledH - margin));

    const angle = randomBetween(-Math.PI / 4, Math.PI / 4);
    const cx = scaledW / 2;
    const cy = scaledH / 2;

    // 1. Constellation Stars - NO SHRINKING
    patternPoints.forEach((pt, idx) => {
        const dx = (pt.rx * CURRENT_SCALE) - cx;
        const dy = (pt.ry * CURRENT_SCALE) - cy;
        const finalX = constellationOffset.x + cx + (dx * Math.cos(angle) - dy * Math.sin(angle));
        const finalY = constellationOffset.y + cy + (dx * Math.sin(angle) + dy * Math.cos(angle));

        constellationData.stars.push({
            id: `c_${idx}`,
            x: finalX, y: finalY,
            size: randomBetween(CONFIG.STAR_MIN_SIZE, CONFIG.STAR_MAX_SIZE),
            rotation: randomBetween(0, 360),
            def: pt.def,
            alpha: randomBetween(CONFIG.MIN_STAR_ALPHA, CONFIG.MAX_STAR_ALPHA),
            color: '#ffffff'
        });
    });

    // 2. Background Stars with SCALED Buffers
    const jointBuffer = 6 * CURRENT_SCALE;
    const lineBuffer = 8 * CURRENT_SCALE;

    for (let i = 0; i < CONFIG.STAR_COUNT; i++) {
        for (let attempt = 0; attempt < CONFIG.MAX_STAR_PLACEMENT_ATTEMPTS; attempt++) {
            const size = randomBetween(CONFIG.STAR_MIN_SIZE, CONFIG.STAR_MAX_SIZE);
            const x = randomBetween(size, window.innerWidth - size);
            const y = randomBetween(size, window.innerHeight - size);

            let tooClose = constellationData.stars.some(s => Math.hypot(x - s.x, y - s.y) < jointBuffer);
            if (!tooClose) {
                tooClose = constellationData.connections.some(([i1, i2]) => {
                    const s1 = constellationData.stars[i1];
                    const s2 = constellationData.stars[i2];
                    return pointToSegmentDistance(x, y, s1.x, s1.y, s2.x, s2.y) < lineBuffer;
                });
            }

            if (!tooClose) {
                const overlap = stars.some(s => Math.hypot(x - s.x, y - s.y) < (size/2 + s.size/2 + CONFIG.OVERLAP_PADDING_BG));
                if (!overlap) {
                    stars.push({ id: `bg_${i}`, x, y, size, rotation: randomBetween(0, 360), def: CONFIG.STAR_DEFS[Math.floor(Math.random() * CONFIG.STAR_DEFS.length)], alpha: randomBetween(CONFIG.MIN_STAR_ALPHA, CONFIG.MAX_STAR_ALPHA), color: '#ffffff' });
                    break;
                }
            }
        }
    }
}

function initDOM() {
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    const frag = document.createDocumentFragment();
    const gLines = document.createElementNS(SVG_NS, 'g');
    
    // BG Stars
    stars.forEach(s => frag.appendChild(createStarElement(s)));
    
    // Constellation Lines
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

function createStarElement(data) {
    const use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', data.def.id);
    use.setAttribute('fill', data.color);
    use.setAttribute('opacity', data.alpha);
    const scale = data.size / data.def.originalSize;
    const offset = data.def.originalSize / 2;
    use.setAttribute('transform', `translate(${data.x}, ${data.y}) rotate(${data.rotation}) scale(${scale}) translate(${-offset}, ${-offset})`);
    return use;
}

function reveal() {
    if (constellationRevealed || isDrawing) return;
    isDrawing = true;
    let idx = 0;
    const draw = () => {
        if (idx >= constellationData.lines.length) { constellationRevealed = true; isDrawing = false; return; }
        const l = constellationData.lines[idx];
        l.setAttribute('opacity', '0.7');
        let prog = 0;
        const x1 = parseFloat(l.getAttribute('x1')), y1 = parseFloat(l.getAttribute('y1'));
        const tx = parseFloat(l.dataset.tx), ty = parseFloat(l.dataset.ty);
        const frame = () => {
            prog += CONFIG.LINE_DRAW_SPEED;
            if (prog >= 1) { l.setAttribute('x2', tx); l.setAttribute('y2', ty); idx++; draw(); }
            else { l.setAttribute('x2', x1 + (tx - x1) * prog); l.setAttribute('y2', y1 + (ty - y1) * prog); requestAnimationFrame(frame); }
        };
        frame();
    };
    draw();
}

function init() {
    placeStars('wolf');
    initDOM();
    svg.addEventListener('click', e => {
        const config = CONFIG.CONSTELLATIONS[constellationId];
        const buf = (config.clickBuffer || 15) * CURRENT_SCALE; // Scaled click detection
        const hit = constellationData.stars.some(s => Math.hypot(e.clientX - s.x, e.clientY - s.y) < buf) ||
                    constellationData.connections.some(([i, j]) => pointToSegmentDistance(e.clientX, e.clientY, constellationData.stars[i].x, constellationData.stars[i].y, constellationData.stars[j].x, constellationData.stars[j].y) < buf);
        if (hit) reveal();
    });
}

window.addEventListener('resize', () => { if (constellationId) { placeStars(constellationId); initDOM(); } });
init();
