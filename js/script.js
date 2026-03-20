// --- CONFIGURATION OBJECT ---
// Place all your adjustable values and constellation definitions here.
const CONFIG = {
    // General Starfield Settings
    STAR_COUNT: 200,
    STAR_MIN_SIZE: 3,
    STAR_MAX_SIZE: 6,
    OVERLAP_PADDING_BG: 2, // Padding between background stars
    OVERLAP_PADDING_WOLF_STAR: 1.5, // Padding around the visible "joint" stars of the constellation
    MAX_STAR_PLACEMENT_ATTEMPTS: 100,
    MIN_STAR_ALPHA: 0.2,
    MAX_STAR_ALPHA: 1.0,

    // Define your star shapes (SVG symbols) here
    STAR_DEFS: [
        { id: '#star1', originalSize: 100 },
        { id: '#star2', originalSize: 100 },
        { id: '#star3', originalSize: 100 },
        { id: '#star4', originalSize: 100 }
    ],

    // Define your constellations here
    CONSTELLATIONS: {
        wolf: { // Unique ID for the constellation
            paths: [ // The raw path data defining the constellation's lines
                "M14.500,96.500 L23.500,78.500 L26.500,64.500 L26.500,49.500 L32.500,47.500 L16.500,33.500 L2.500,33.500 L9.500,28.500 L2.500,28.500 L9.500,24.500 L6.500,20.500 L22.500,23.500 L39.500,9.500 L40.500,2.500 L43.500,9.500 L55.500,6.500 L67.500,12.500 L50.500,13.500 L61.500,16.500 L69.500,26.500 L55.500,25.500 L48.500,34.500 L35.500,42.500 L37.500,47.500 L40.500,46.500 L43.500,51.500 L52.500,55.500 L51.500,87.500 L56.500,100.500",
                "M50.500,66.500 L44.500,76.500 L44.500,100.500",
                "M45.500,88.500 L51.500,99.500",
                "M41.500,84.500 L41.500,100.500",
                "M37.500,84.500 L24.500,99.500 L38.500,92.500 L39.500,100.500",
                "M18.500,99.500 L31.500,57.500 L38.500,72.500 L26.500,84.500"
            ],
            scale: 0.75, // Multiplier for the base constellation size (0.75 means 75% of the default calculation)
            clickBuffer: 15, // How close (in pixels) a click must be to a star or line to trigger the reveal
            // Example of constellation-specific star settings
            // STAR_MIN_SIZE: 4,
            // STAR_MAX_SIZE: 7
        },
        // Add more constellations like this:
        /*
        big_dipper: {
            paths: [
                "M10,10 L20,20 L30,15 L40,25 L50,20 L60,30 L70,25"
            ],
            scale: 0.6,
            clickBuffer: 12,
        },
        */
    },

    // Animation Settings
    LINE_DRAW_SPEED: 0.08, // Higher is faster (0.08 is the original speed)
};

// --- END OF CONFIG ---

/**
INITIAL SETUP
*/
const svg = document.getElementById('starfield');
const SVG_NS = "http://www.w3.org/2000/svg";

// GLOBAL VARIABLES
let stars = []; // Background stars
let constellationData = {}; // Holds stars and lines for the active constellation
let constellationId = null; // Identifier for the currently loaded constellation
let constellationOffset = { x: 0, y: 0 }; // Position of the constellation on the screen
let constellationRevealed = false;
let isDrawing = false;

// Helper function for distance from point to line segment
function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.hypot(px - projX, py - projY);
}

// Helper function for random numbers
function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Checks if a candidate star overlaps with an existing star.
 * If they are too close, it returns the maximum size the candidate
 * can be to avoid overlapping.
 */
function getSafeSize(candidateX, candidateY, targetSize, existingStar, padding = CONFIG.OVERLAP_PADDING_BG) {
    const dist = Math.hypot(candidateX - existingStar.x, candidateY - existingStar.y);
    const combinedRadius = (targetSize / 2) + (existingStar.size / 2) + padding;
    if (dist < combinedRadius) {
        return Math.max(1.5, (dist - padding) * 2 - existingStar.size);
    }
    return targetSize;
}

/**
 * Places all stars (background and constellation) based on the selected constellation config.
 * @param {string} id - The ID of the constellation to load (e.g., 'wolf').
 */
function placeStars(id) {
    if (!CONFIG.CONSTELLATIONS[id]) {
        console.error(`Constellation with ID '${id}' not found in CONFIG.`);
        return;
    }
    constellationId = id;
    const config = CONFIG.CONSTELLATIONS[constellationId];

    // Reset state variables
    stars.length = 0;
    constellationData.stars = [];
    constellationData.lines = [];
    constellationRevealed = false;
    isDrawing = false;
    svg.innerHTML = ''; // Clear the SVG canvas

    const minScreenDim = Math.min(window.innerWidth, window.innerHeight);
    // Use the specific scale from the constellation config, falling back to 1 if not defined
    const scaleMultiplier = config.scale !== undefined ? config.scale : 1;
    const baseScale = (minScreenDim * 0.75) / 110;
    const WOLF_SCALE = Math.max(0.5, baseScale) * scaleMultiplier;

    const pathStrings = config.paths;
    const patternPoints = [];
    const connections = [];
    let globalNodeIndex = 0;

    pathStrings.forEach(pathStr => {
        const pairs = pathStr.match(/\d+\.\d+,\d+\.\d+/g);
        if (pairs) {
            const pathStartIndex = globalNodeIndex;
            pairs.forEach((pair, localIndex) => {
                const [rx, ry] = pair.split(',').map(Number);
                patternPoints.push({ rx, ry, def: CONFIG.STAR_DEFS[Math.floor(Math.random() * CONFIG.STAR_DEFS.length)] });
                if (localIndex > 0) connections.push([globalNodeIndex - 1, globalNodeIndex]);
                globalNodeIndex++;
            });
            if (pathStr.trim().endsWith('Z')) connections.push([globalNodeIndex - 1, pathStartIndex]); // Close path if needed
        }
    });

    const rawWidth = 110; // Assuming the raw data fits in a 110x110 box based on the original script's scaling logic
    const rawHeight = 110;
    const scaledWidth = rawWidth * WOLF_SCALE;
    const scaledHeight = rawHeight * WOLF_SCALE;

    const margin = 50;
    const maxX = window.innerWidth - scaledWidth - margin;
    const maxY = window.innerHeight - scaledHeight - margin;

    constellationOffset.x = randomBetween(margin, Math.max(margin, maxX));
    constellationOffset.y = randomBetween(margin, Math.max(margin, maxY));

    const angle = randomBetween(-Math.PI / 2, Math.PI / 2);
    const centerX = scaledWidth / 2;
    const centerY = scaledHeight / 2;

    // 1. PLACE CONSTELLATION STARS FIRST
    patternPoints.forEach((pt, idx) => {
        const px = pt.rx * WOLF_SCALE;
        const py = pt.ry * WOLF_SCALE;
        const dx = px - centerX;
        const dy = py - centerY;

        const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle);
        const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle);
        const finalX = constellationOffset.x + centerX + rotatedX;
        const finalY = constellationOffset.y + centerY + rotatedY;

        let size = randomBetween(
            config.STAR_MIN_SIZE ?? CONFIG.STAR_MIN_SIZE, // Use constellation-specific or general setting
            config.STAR_MAX_SIZE ?? CONFIG.STAR_MAX_SIZE
        );

        // Check overlap with other constellation stars
        constellationData.stars.forEach(existing => {
            size = getSafeSize(finalX, finalY, size, existing, CONFIG.OVERLAP_PADDING_WOLF_STAR);
        });

        constellationData.stars.push({
            id: `const_${constellationId}_star_${idx}`,
            x: finalX,
            y: finalY,
            size: size,
            rotation: randomBetween(0, 360),
            def: pt.def,
            alpha: randomBetween(CONFIG.MIN_STAR_ALPHA, CONFIG.MAX_STAR_ALPHA),
            color: '#ffffff',
            element: null,
        });
    });

    // 2. PLACE BACKGROUND STARS
    for (let i = 0; i < CONFIG.STAR_COUNT; i++) {
        for (let attempt = 0; attempt < CONFIG.MAX_STAR_PLACEMENT_ATTEMPTS; attempt++) {
            let size = randomBetween(CONFIG.STAR_MIN_SIZE, CONFIG.STAR_MAX_SIZE);
            const x = randomBetween(size / 2, window.innerWidth - size / 2);
            const y = randomBetween(size / 2, window.innerHeight - size / 2);

            // --- CHECK PROXIMITY TO CONSTELLATION ---
            const starBuffer = (config.clickBuffer || 15) * 1.5; // Slightly larger than click buffer for visual spacing
            let tooClose = constellationData.stars.some(constStar =>
                Math.hypot(x - constStar.x, y - constStar.y) < starBuffer
            );

            if (!tooClose) {
                const lineBuffer = config.clickBuffer || 15; // Same as click buffer or slightly smaller
                tooClose = connections.some(([i_idx, j_idx]) => {
                    const s1 = constellationData.stars[i_idx];
                    const s2 = constellationData.stars[j_idx];
                    return pointToSegmentDistance(x, y, s1.x, s1.y, s2.x, s2.y) < lineBuffer;
                });
            }

            if (tooClose) continue;

            // --- CHECK PROXIMITY TO OTHER BACKGROUND STARS ---
            let isOverlappingBG = false;
            for (const bgStar of stars) {
                const dist = Math.hypot(x - bgStar.x, y - bgStar.y);
                if (dist < (size / 2) + (bgStar.size / 2) + CONFIG.OVERLAP_PADDING_BG) {
                    isOverlappingBG = true;
                    break;
                }
            }

            if (!isOverlappingBG) {
                stars.push({
                    id: `bg_star_${i}`,
                    x: x,
                    y: y,
                    size: size,
                    rotation: randomBetween(0, 360),
                    def: CONFIG.STAR_DEFS[Math.floor(Math.random() * CONFIG.STAR_DEFS.length)],
                    alpha: randomBetween(CONFIG.MIN_STAR_ALPHA, CONFIG.MAX_STAR_ALPHA),
                    color: '#ffffff',
                    element: null
                });
                break;
            }
        }
    }

    // Store connections for later use in drawing and click detection
    constellationData.connections = connections;
}

/**
 * Initializes the DOM elements for stars and lines based on placed data.
 */
function initDOM() {
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    svg.setAttribute('width', window.innerWidth);
    svg.setAttribute('height', window.innerHeight);

    const fragment = document.createDocumentFragment();

    const bgGroup = document.createElementNS(SVG_NS, 'g');
    bgGroup.id = 'layer-background-stars';

    const lineGroup = document.createElementNS(SVG_NS, 'g');
    lineGroup.id = 'layer-constellation-lines';

    const constStarGroup = document.createElementNS(SVG_NS, 'g');
    constStarGroup.id = 'layer-constellation-stars';

    // Create background stars
    stars.forEach(starData => {
        const starUse = document.createElementNS(SVG_NS, 'use');
        starUse.setAttribute('href', starData.def.id);
        starUse.setAttribute('fill', starData.color);
        starUse.setAttribute('opacity', starData.alpha);
        updateStarTransform(starUse, starData);
        bgGroup.appendChild(starUse);
        starData.element = starUse;
    });

    // Create constellation stars
    constellationData.stars.forEach(starData => {
        const starUse = document.createElementNS(SVG_NS, 'use');
        starUse.setAttribute('href', starData.def.id);
        starUse.setAttribute('fill', starData.color);
        starUse.setAttribute('opacity', starData.alpha);
        updateStarTransform(starUse, starData);
        constStarGroup.appendChild(starUse);
        starData.element = starUse;
    });

    // Create constellation lines (initially invisible)
    constellationData.connections.forEach(([i, j], index) => {
        const line = document.createElementNS(SVG_NS, 'line');
        const s1 = constellationData.stars[i];
        const s2 = constellationData.stars[j];

        line.setAttribute('x1', s1.x);
        line.setAttribute('y1', s1.y);
        line.setAttribute('x2', s1.x); // Start collapsed
        line.setAttribute('y2', s1.y);
        line.setAttribute('stroke', '#ffffff');
        line.setAttribute('stroke-width', '0.8');
        line.setAttribute('opacity', '0');

        line.dataset.targetX = s2.x;
        line.dataset.targetY = s2.y;
        line.dataset.id = `line_${index}`; // For potential debugging

        lineGroup.appendChild(line);
        constellationData.lines.push(line);
    });

    fragment.appendChild(bgGroup);
    fragment.appendChild(lineGroup);
    fragment.appendChild(constStarGroup);

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

/**
 * Reveals the constellation by animating the lines.
 */
function revealConstellation() {
    if (constellationRevealed || isDrawing) return;
    isDrawing = true;

    // Optionally change the color of the constellation stars when revealed
    // constellationData.stars.forEach(s => { s.color = '#ffffaa'; }); // Uncomment if desired
    // initDOM(); // Re-run initDOM to reflect color changes if needed

    function drawNextLine(index) {
        if (index >= constellationData.lines.length) {
            constellationRevealed = true;
            isDrawing = false;
            return;
        }

        const line = constellationData.lines[index];
        line.setAttribute('opacity', '0.7');

        const startX = parseFloat(line.getAttribute('x1'));
        const startY = parseFloat(line.getAttribute('y1'));
        const targetX = parseFloat(line.dataset.targetX);
        const targetY = parseFloat(line.dataset.targetY);

        let progress = 0;
        const speed = CONFIG.LINE_DRAW_SPEED;

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

/**
 * Checks if a click event occurred near the active constellation.
 * @param {Event} e - The click event.
 * @returns {boolean} - True if the click was near the constellation.
 */
function isClickNearConstellation(e) {
    if (!constellationId || constellationRevealed) return false;
    const config = CONFIG.CONSTELLATIONS[constellationId];
    const buffer = config.clickBuffer || 15; // Default buffer if not specified

    const clickX = e.clientX;
    const clickY = e.clientY;

    // Check if click is near any constellation star
    for (const star of constellationData.stars) {
        if (Math.hypot(clickX - star.x, clickY - star.y) < buffer) {
            return true;
        }
    }

    // Check if click is near any constellation line
    for (const [i, j] of constellationData.connections) {
        const s1 = constellationData.stars[i];
        const s2 = constellationData.stars[j];
        if (pointToSegmentDistance(clickX, clickY, s1.x, s1.y, s2.x, s2.y) < buffer) {
            return true;
        }
    }

    return false; // Click was not near the constellation
}

// --- INITIALIZATION ---
function init() {
    // Load the 'wolf' constellation initially. You can change this call to load a different one.
    placeStars('wolf');
    initDOM();

    svg.addEventListener('click', e => {
        if (isClickNearConstellation(e)) {
            revealConstellation();
        }
        // Add logic here to handle clicks for *other* constellations if you have multiple active ones
    });
}

// Handle window resize
window.addEventListener('resize', () => {
    // You might want to reload the constellation on resize, or adjust positions/sizes dynamically.
    // For now, re-initializing the whole thing is simplest.
    if (constellationId) {
        placeStars(constellationId); // Reload the same constellation with new window dimensions
        initDOM();
    }
});

init(); // Start the script
