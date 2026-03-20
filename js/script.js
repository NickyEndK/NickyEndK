/**
 * INITIAL SETUP
 */
const svg = document.getElementById('starfield');
const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * CONFIGURATION CONSTANTS
 */
const STAR_COUNT      = 200;
const STAR_MIN_SIZE   = 3;   
const STAR_MAX_SIZE   = 6;
const OVERLAP_PADDING = 2; // Reduced padding for a tighter, more natural look
const MAX_ATTEMPTS    = 100;
const MIN_ALPHA       = 0.2;
const MAX_ALPHA       = 1.0;

const starDefs =[
    { id: '#star1', originalSize: 100 },
    { id: '#star2', originalSize: 100 },
    { id: '#star3', originalSize: 100 },
    { id: '#star4', originalSize: 100 }
];

const WOLF_PATHS = [
  "M14.500,96.500 L23.500,78.500 L26.500,64.500 L26.500,49.500 L32.500,47.500 L16.500,33.500 L2.500,33.500 L9.500,28.500 L2.500,28.500 L9.500,24.500 L6.500,20.500 L22.500,23.500 L39.500,9.500 L40.500,2.500 L43.500,9.500 L55.500,6.500 L67.500,12.500 L50.500,13.500 L61.500,16.500 L69.500,26.500 L55.500,25.500 L48.500,34.500 L35.500,42.500 L37.500,47.500 L40.500,46.500 L43.500,51.500 L52.500,55.500 L51.500,87.500 L56.500,100.500",
  "M50.500,66.500 L44.500,76.500 L44.500,100.500",
  "M45.500,88.500 L51.500,99.500",
  "M41.500,84.500 L41.500,100.500",
  "M37.500,84.500 L24.500,99.500 L38.500,92.500 L39.500,100.500",
  "M18.500,99.500 L31.500,57.500 L38.500,72.500 L26.500,84.500"
];

function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    // Vector from p1 to p2
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return Math.hypot(px - x1, py - y1); // degenerate segment

    // Project point onto line
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;

    return Math.hypot(px - projX, py - projY);
}

const WOLF_PATTERN = [];
const WOLF_CONNECTIONS = [];
let globalNodeIndex = 0;

WOLF_PATHS.forEach(pathStr => {
    const pairs = pathStr.match(/\d+\.\d+,\d+\.\d+/g);
    if (pairs) {
        const pathStartIndex = globalNodeIndex;
        pairs.forEach((pair, localIndex) => {
            const [rx, ry] = pair.split(',').map(Number);
            WOLF_PATTERN.push({ rx, ry, def: starDefs[Math.floor(Math.random() * starDefs.length)] });
            if (localIndex > 0) WOLF_CONNECTIONS.push([globalNodeIndex - 1, globalNodeIndex]);
            globalNodeIndex++;
        });
        if (pathStr.trim().endsWith('Z')) WOLF_CONNECTIONS.push([globalNodeIndex - 1, pathStartIndex]);
    }
});

// GLOBAL VARIABLES
let WOLF_SCALE          = 0;
let WOLF_PATTERN_WIDTH  = 0;
let WOLF_PATTERN_HEIGHT = 0;

const stars = [];
let wolfOffset   = { x: 0, y: 0 };
let wolfRevealed = false;
let isDrawing    = false;     
const wolfStarData = [];
const wolfLines    = [];

// =======================

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Checks if a candidate star overlaps with an existing star.
 * If they are too close, it returns the maximum size the candidate 
 * can be to avoid overlapping.
 */
function getSafeSize(candidateX, candidateY, targetSize, existingStar, padding = OVERLAP_PADDING) {
    const dist = Math.hypot(candidateX - existingStar.x, candidateY - existingStar.y);
    const combinedRadius = (targetSize / 2) + (existingStar.size / 2) + padding;

    if (dist < combinedRadius) {
        // Calculate size that would perfectly touch the neighbor with padding
        return Math.max(1.5, (dist - padding) * 2 - existingStar.size);
    }
    return targetSize;
}

function placeStars() {
    stars.length = 0;
    svg.innerHTML = '';
    wolfStarData.length = 0;
    wolfLines.length = 0;
    wolfRevealed = false;
    isDrawing = false;
    
    const minScreenDim = Math.min(window.innerWidth, window.innerHeight);
    WOLF_SCALE = (minScreenDim * 0.75) / 110; 
    WOLF_SCALE = Math.max(0.5, WOLF_SCALE); 
    WOLF_PATTERN_WIDTH  = 80 * WOLF_SCALE;
    WOLF_PATTERN_HEIGHT = 110 * WOLF_SCALE;
    
    const margin = 50;
    const maxX = window.innerWidth  - WOLF_PATTERN_WIDTH  - margin;
    const maxY = window.innerHeight - WOLF_PATTERN_HEIGHT - margin;
    
    wolfOffset.x = randomBetween(margin, Math.max(margin, maxX));
    wolfOffset.y = randomBetween(margin, Math.max(margin, maxY));

    const wolfAngle = randomBetween(-Math.PI / 2, Math.PI / 2);
    const centerX = WOLF_PATTERN_WIDTH / 2;
    const centerY = WOLF_PATTERN_HEIGHT / 2;

    // 1. PLACE ANGEL STARS FIRST (They define the shape)
    WOLF_PATTERN.forEach((pt, idx) => {
        const px = pt.rx * WOLF_SCALE;
        const py = pt.ry * WOLF_SCALE;
        const dx = px - centerX;
        const dy = py - centerY;
        
        const rotatedX = dx * Math.cos(wolfAngle) - dy * Math.sin(wolfAngle);
        const rotatedY = dx * Math.sin(wolfAngle) + dy * Math.cos(wolfAngle);
        const finalX = wolfOffset.x + centerX + rotatedX;
        const finalY = wolfOffset.y + centerY + rotatedY;

        let size = randomBetween(STAR_MIN_SIZE, STAR_MAX_SIZE);

        wolfStarData.forEach(existing => {
            size = getSafeSize(finalX, finalY, size, existing, 1.5);
        });

        wolfStarData.push({
            id:       'wolf_' + idx,
            x:        finalX,
            y:        finalY,
            size:     size,
            rotation: randomBetween(0, 360),
            def:      pt.def,
            alpha:    randomBetween(MIN_ALPHA, MAX_ALPHA),
            color:    '#ffffff',
            element:  null,
        });
    });

    // 2. PLACE BACKGROUND STARS (They react to everything)
    for (let i = 0; i < STAR_COUNT; i++) {
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            let size = randomBetween(STAR_MIN_SIZE, STAR_MAX_SIZE);
            const x = randomBetween(size / 2, window.innerWidth - size / 2);
            const y = randomBetween(size / 2, window.innerHeight - size / 2);
            
            // --- NEW LOGIC: Check proximity to constellation ---
            // A. Check against Angel Stars (joints) — use tighter buffer to preserve joints
            const jointBuffer = 6 * WOLF_SCALE;
            let tooClose = wolfStarData.some(wolfStar => 
                Math.hypot(x - wolfStar.x, y - wolfStar.y) < jointBuffer
            );

            // B. Check against line segments — use slightly larger buffer for visual clarity
            if (!tooClose) {
                const lineBuffer = 8 * WOLF_SCALE;
                tooClose = WOLF_CONNECTIONS.some(([i, j]) => {
                    const s1 = wolfStarData[i];
                    const s2 = wolfStarData[j];
                    return pointToSegmentDistance(x, y, s1.x, s1.y, s2.x, s2.y) < lineBuffer;
                });
            }

            if (tooClose) continue; // Skip this candidate star if too close to constellation

            // --- ORIGINAL LOGIC: Check against other background stars ---
            // Check against existing Background Stars
            let isOverlappingBG = false;
            for (const bgStar of stars) {
                const dist = Math.hypot(x - bgStar.x, y - bgStar.y);
                if (dist < (size / 2) + (bgStar.size / 2) + OVERLAP_PADDING) {
                    isOverlappingBG = true;
                    break;
                }
            }

            if (!isOverlappingBG) {
                stars.push({
                    id: i,
                    x: x,
                    y: y,
                    size: size,
                    rotation: randomBetween(0, 360),
                    def: starDefs[Math.floor(Math.random() * starDefs.length)],
                    alpha: randomBetween(MIN_ALPHA, MAX_ALPHA),
                    color: '#ffffff',
                    element: null
                });
                break; // Successfully placed star, move to next one
            }
        }
    }
}

function initDOM() {
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    svg.setAttribute('width',  window.innerWidth);
    svg.setAttribute('height', window.innerHeight);

    const fragment = document.createDocumentFragment();

    const bgGroup = document.createElementNS(SVG_NS, 'g');
    bgGroup.id = 'layer-background-stars';

    const lineGroup = document.createElementNS(SVG_NS, 'g');
    lineGroup.id = 'layer-wolf-lines';

    const wolfStarGroup = document.createElementNS(SVG_NS, 'g');
    wolfStarGroup.id = 'layer-wolf-stars';

    stars.forEach(starData => {
        const starUse = document.createElementNS(SVG_NS, 'use');
        starUse.setAttribute('href', starData.def.id);
        starUse.setAttribute('fill',    starData.color);
        starUse.setAttribute('opacity', starData.alpha);
        updateStarTransform(starUse, starData);
        bgGroup.appendChild(starUse);
        starData.element = starUse;
    });

    wolfStarData.forEach(starData => {
        const starUse = document.createElementNS(SVG_NS, 'use');
        starUse.setAttribute('href',    starData.def.id);
        starUse.setAttribute('fill',    starData.color);
        starUse.setAttribute('opacity', starData.alpha);
        updateStarTransform(starUse, starData);
        wolfStarGroup.appendChild(starUse);
        starData.element = starUse;
    });

    WOLF_CONNECTIONS.forEach(([i, j]) => {
        const line = document.createElementNS(SVG_NS, 'line');
        const s1   = wolfStarData[i];
        const s2   = wolfStarData[j];
        
        line.setAttribute('x1', s1.x);
        line.setAttribute('y1', s1.y);
        line.setAttribute('x2', s1.x); 
        line.setAttribute('y2', s1.y); 
        line.setAttribute('stroke', '#ffffff'); 
        line.setAttribute('stroke-width', '0.8');
        line.setAttribute('opacity', '0');
        
        line.dataset.targetX = s2.x;
        line.dataset.targetY = s2.y;
        
        lineGroup.appendChild(line);
        wolfLines.push(line);
    });

    fragment.appendChild(bgGroup);
    fragment.appendChild(lineGroup);
    fragment.appendChild(wolfStarGroup);
    
    svg.appendChild(fragment);
}

function updateStarTransform(element, data) {
    const scale = data.size / data.def.originalSize;
    const cx = data.def.originalSize / 2;
    const cy = data.def.originalSize / 2;
    element.setAttribute(
        'transform', 
        `translate(${Math.round(data.x)}, ${Math.round(data.y)}) rotate(${Math.round(data.rotation)}) scale(${scale}) translate(${-cx}, ${-cy})`
    );
}

function revealWolf() {
    if (wolfRevealed || isDrawing) return;
    isDrawing = true;

    wolfStarData.forEach(s => {
        s.color = '#ffffff';
    });

    function drawNextLine(index) {
        if (index >= wolfLines.length) {
            wolfRevealed = true;
            isDrawing = false;
            return;
        }

        const line = wolfLines[index];
        line.setAttribute('opacity', '0.7'); 
        
        const startX = parseFloat(line.getAttribute('x1'));
        const startY = parseFloat(line.getAttribute('y1'));
        const targetX = parseFloat(line.dataset.targetX);
        const targetY = parseFloat(line.dataset.targetY);
        
        let progress = 0;
        const speed = 0.08; 

        function frame() {
            progress += speed;
            if (progress >= 1) {
                line.setAttribute('x2', targetX);
                line.setAttribute('y2', targetY);
                drawNextLine(index + 1);
            } else {
                line.setAttribute('x2', startX + (targetX - startX) * progress);
                line.setAttribute('y2', startY + (targetY - startY) * progress);
                requestAnimationFrame(frame);
            }
        }
        requestAnimationFrame(frame);
    }

    drawNextLine(0);
}

function init() {
    placeStars();
    initDOM();

    svg.addEventListener('click', e => {
        if (wolfRevealed) return;
        
        const cx = wolfOffset.x + WOLF_PATTERN_WIDTH / 2;
        const cy = wolfOffset.y + WOLF_PATTERN_HEIGHT / 2;
        const clickRadius = WOLF_PATTERN_HEIGHT / 2;
        
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        
        if ((dx * dx + dy * dy) <= (clickRadius * clickRadius)) {
            revealWolf();
        }
    });
}

window.addEventListener('resize', () => {
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    svg.setAttribute('width',  window.innerWidth);
    svg.setAttribute('height', window.innerHeight);
});

init();
