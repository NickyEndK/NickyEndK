// main.js
// Application entry point and orchestrator.
// Responsibilities: initialize SVG, wire up all modules, handle user interaction.
//
// Functions:
//   init()    — sets up the SVG, calculates star centers, generates and renders the starfield
//   reveal()  — animates constellation lines sequentially on trigger
//   handleInteraction(clientX, clientY) — shared handler for click and touch events

import { CONFIG } from './config.js';
import { CONSTELLATIONS } from './constellations.js';
import { STARS } from './stars.js';
import { generateStarfield } from './generator.js';
import { createStarElement, drawLine } from './renderer.js';

const svg = document.getElementById('starfield');
let currentData = null;
let isDrawing  = false;
let revealed   = false;

// --- init ---
// Called once on load. Sets up the SVG viewport, computes star centers via getBBox(),
// generates the starfield, and renders everything into the DOM in one batch.
function init() {
    document.body.style.backgroundColor = CONFIG.BG_COLOR;

    // Lock the internal coordinate space to the current viewport size.
    // preserveAspectRatio + slice means the scene scales like a background-image on resize.
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');

    svg.innerHTML = '<defs></defs>';
    const defs = svg.querySelector('defs');

    // --- Star shape definitions ---
    // Add each star path to <defs> so they can be reused via <use>.
    STARS.forEach(star => {
        const g = document.createElementNS("http://www.w3.org/2000/svg", 'g');
        g.setAttribute('id', star.id);
        const path = document.createElementNS("http://www.w3.org/2000/svg", 'path');
        path.setAttribute('d', star.path);
        g.appendChild(path);
        defs.appendChild(g);
    });

    // --- Auto-calculate star centers ---
    // Now that paths are in the DOM, getBBox() gives us the real bounding box.
    // cx/cy are written onto each STARS entry so renderer.js can use them.
    // This means adding new star shapes never requires manual center measurement.
    STARS.forEach(star => {
        const path = svg.querySelector(`#${star.id} path`);
        const bb = path.getBBox();
        star.cx = bb.x + bb.width / 2;
        star.cy = bb.y + bb.height / 2;
    });

    // --- Generate starfield data ---
    currentData = generateStarfield('wolf', CONSTELLATIONS, window.innerWidth, window.innerHeight);

    // --- Render into DOM ---
    // Uses a DocumentFragment to batch all DOM insertions into one reflow.
    // Draw order: background stars → lines (hidden) → constellation stars on top.
    const frag  = document.createDocumentFragment();
    const gLines = document.createElementNS("http://www.w3.org/2000/svg", 'g');

    currentData.backgroundStars.forEach(s => frag.appendChild(createStarElement(s)));

    currentData.lines = currentData.connections.map(([i, j]) => {
        const line = drawLine(currentData.constellationStars[i], currentData.constellationStars[j]);
        gLines.appendChild(line);
        return line;
    });

    frag.appendChild(gLines);
    currentData.constellationStars.forEach(s => frag.appendChild(createStarElement(s)));
    svg.appendChild(frag);
}

// --- reveal ---
// Animates constellation lines one by one using requestAnimationFrame.
// Each line expands from its start point to its end point over multiple frames.
// Guarded by isDrawing and revealed flags — can only run once.
function reveal() {
    if (revealed || isDrawing) return;
    isDrawing = true;
    let idx = 0;

    const drawNext = () => {
        if (idx >= currentData.lines.length) {
            revealed  = true;
            isDrawing = false;
            return;
        }
        const l = currentData.lines[idx];
        l.setAttribute('opacity', CONFIG.LINE_OPACITY);

        let prog = 0;
        const x1 = parseFloat(l.getAttribute('x1'));
        const y1 = parseFloat(l.getAttribute('y1'));
        const tx = parseFloat(l.dataset.tx);
        const ty = parseFloat(l.dataset.ty);

        const animate = () => {
            prog += CONFIG.LINE_DRAW_SPEED;
            if (prog >= 1) {
                l.setAttribute('x2', tx);
                l.setAttribute('y2', ty);
                idx++;
                drawNext();
            } else {
                l.setAttribute('x2', x1 + (tx - x1) * prog);
                l.setAttribute('y2', y1 + (ty - y1) * prog);
                requestAnimationFrame(animate);
            }
        };
        animate();
    };
    drawNext();
}

// --- handleInteraction(clientX, clientY) ---
// Converts screen coordinates to SVG viewBox coordinates via the CTM inverse matrix,
// then checks if the point is within CLICK_RADIUS of any constellation star.
// Shared by both click and touch handlers.
function handleInteraction(clientX, clientY) {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

    const hit = currentData.constellationStars.some(s =>
        Math.hypot(svgP.x - s.x, svgP.y - s.y) < CONFIG.CLICK_RADIUS
    );
    if (hit) reveal();
}

// --- Event listeners ---
svg.addEventListener('click', e => {
    handleInteraction(e.clientX, e.clientY);
});

// Touch support — passive: false allows preventDefault() to suppress the 300ms tap delay.
svg.addEventListener('touchstart', e => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    handleInteraction(touch.clientX, touch.clientY);
}, { passive: false });

// --- Start ---
init();
