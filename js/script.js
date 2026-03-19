/**
 * INITIAL SETUP
 */
const svg = document.getElementById('starfield');
const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * CONFIGURATION CONSTANTS
 */
const STAR_COUNT      = 200;
const STAR_MIN_SIZE   = 5;   
const STAR_MAX_SIZE   = 10;
const OVERLAP_PADDING = 4;
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
const WOLF_PATTERN = [];
const WOLF_CONNECTIONS = [];
let globalNodeIndex = 0;

// Algorithm: Read paths, create a star at every anchor point, connect the dots
WOLF_PATHS.forEach(pathStr => {
    const pairs = pathStr.match(/\d+\.\d+,\d+\.\d+/g);
    if (pairs) {
        const pathStartIndex = globalNodeIndex;
        pairs.forEach((pair, localIndex) => {
            const [rx, ry] = pair.split(',').map(Number);
            WOLF_PATTERN.push({ rx, ry, def: starDefs[Math.floor(Math.random() * starDefs.length)] });
            
            // Connect to previous star in this path line
            if (localIndex > 0) WOLF_CONNECTIONS.push([globalNodeIndex - 1, globalNodeIndex]);
            globalNodeIndex++;
        });
        // If the path ends with Z, loop the final line back to the start of the shape
        if (pathStr.trim().endsWith('Z')) WOLF_CONNECTIONS.push([globalNodeIndex - 1, pathStartIndex]);
    }
});

const WOLF_SCALE          = 3.8;
const WOLF_PATTERN_WIDTH  = 80 * WOLF_SCALE;
const WOLF_PATTERN_HEIGHT = 110 * WOLF_SCALE;
const WOLF_STAR_SIZE      = 5;    

const stars = [];
let wolfOffset   = { x: 0, y: 0 };
let wolfRevealed = false;
const wolfStarData = [];
const wolfLines    = [];

// =======================

/**
 * UTILITY: RANDOMIZER
 */
function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * OVERLAP LOGIC
 */
function overlaps(candidate, existingStar) {
    const dx = candidate.x - existingStar.x;
    const dy = candidate.y - existingStar.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const minDist = (candidate.size / 2) + (existingStar.size / 2) + OVERLAP_PADDING;
    return distance < minDist;
}

/**
 * STAR PLACEMENT (Calculating Data)
 */
/**
 * STAR PLACEMENT (Calculating Data)
 */
function placeStars() {
    stars.length = 0;
    svg.innerHTML = '';
    wolfStarData.length = 0;
    wolfLines.length = 0;
    wolfRevealed = false;

    // Choose a random position for the wolf constellation
    const margin = 30;
    const maxX = window.innerWidth  - WOLF_PATTERN_WIDTH  - margin;
    const maxY = window.innerHeight - WOLF_PATTERN_HEIGHT - margin;
    
    // Clamp so the pattern stays on-screen
    wolfOffset.x = randomBetween(margin, Math.max(margin, maxX));
    wolfOffset.y = randomBetween(margin, Math.max(margin, maxY));

    // 1. GENERATE THE WOLF STARS FIRST
    WOLF_PATTERN.forEach((pt, idx) => {
        wolfStarData.push({
            id:       'wolf_' + idx,
            x:        wolfOffset.x + pt.rx * WOLF_SCALE,
            y:        wolfOffset.y + pt.ry * WOLF_SCALE,
            size:     WOLF_STAR_SIZE,
            rotation: 0,
            def:      pt.def,
            alpha:    randomBetween(MIN_ALPHA, MAX_ALPHA),
            color:    '#ffffff',
            element:  null,
        });
    });

    // 2. GENERATE BACKGROUND STARS EVERYWHERE ELSE
    for (let i = 0; i < STAR_COUNT; i++) {
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            const size = randomBetween(STAR_MIN_SIZE, STAR_MAX_SIZE);
            const def  = starDefs[Math.floor(Math.random() * starDefs.length)];
            
            const candidate = {
                id: i,
                x: randomBetween(size / 2, window.innerWidth  - size / 2),
                y: randomBetween(size / 2, window.innerHeight - size / 2),
                size:     size,
                rotation: randomBetween(0, 360),
                def:      def,
                alpha:    randomBetween(MIN_ALPHA, MAX_ALPHA),
                color:    '#ffffff',
                element:  null
            };

            // Check if it overlaps other background stars OR the wolf stars
            const overlapsBackground = stars.some(existing => overlaps(candidate, existing));
            const overlapsWolf = wolfStarData.some(existing => overlaps(candidate, existing));

            // Only place the star if the spot is completely empty
            if (!overlapsBackground && !overlapsWolf) {
                stars.push(candidate);
                break;
            }
        }
    }
}
    // Build wolf constellation star data objects
    WOLF_PATTERN.forEach((pt, idx) => {
        wolfStarData.push({
            id:       'wolf_' + idx,
            x:        wolfOffset.x + pt.rx * WOLF_SCALE,
            y:        wolfOffset.y + pt.ry * WOLF_SCALE,
            size:     WOLF_STAR_SIZE,
            rotation: 0,
            def:      pt.def,
            alpha:    randomBetween(MIN_ALPHA, MAX_ALPHA),
            color:    '#ffffff',
            element:  null,
        });
    });
/**
 * INIT DOM: Creates the <use> elements (Runs only once)
 */
function initDOM() {
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    svg.setAttribute('width',  window.innerWidth);
    svg.setAttribute('height', window.innerHeight);

    // Random background stars
    stars.forEach(starData => {
        const starUse = document.createElementNS(SVG_NS, 'use');
        starUse.setAttribute('href', starData.def.id);
        starUse.setAttribute('fill',    starData.color);
        starUse.setAttribute('opacity', starData.alpha);
        updateStarTransform(starUse, starData);
        svg.appendChild(starUse);
        starData.element = starUse;
    });

    // Wolf constellation stars — initially look like ordinary stars
    wolfStarData.forEach(starData => {
        const starUse = document.createElementNS(SVG_NS, 'use');
        starUse.setAttribute('href',    starData.def.id);
        starUse.setAttribute('fill',    starData.color);
        starUse.setAttribute('opacity', starData.alpha);
        updateStarTransform(starUse, starData);
        svg.appendChild(starUse);
        starData.element = starUse;
    });

    // Constellation lines — hidden until the Wolf is revealed
    WOLF_CONNECTIONS.forEach(([i, j]) => {
        const line = document.createElementNS(SVG_NS, 'line');
        const s1   = wolfStarData[i];
        const s2   = wolfStarData[j];
        line.setAttribute('x1',           s1.x);
        line.setAttribute('y1',           s1.y);
        line.setAttribute('x2',           s2.x);
        line.setAttribute('y2',           s2.y);
        line.setAttribute('stroke',       'gold');
        line.setAttribute('stroke-width', '0.8');
        line.setAttribute('opacity',      '0');
        svg.appendChild(line);
        wolfLines.push(line);
    });
}

/**
 * MATH: Properly aligns, rotates, and scales the stars
 */
function updateStarTransform(element, data) {
    const scale = data.size / data.def.originalSize;
    const cx = data.def.originalSize / 2;
    const cy = data.def.originalSize / 2;
    element.setAttribute(
        'transform', 
        `translate(${data.x}, ${data.y}) rotate(${data.rotation}) scale(${scale}) translate(${-cx}, ${-cy})`
    );
}

/**
 * REVEAL WOLF: Called when the user clicks inside the constellation bounding box.
 */
function revealWolf() {
    wolfRevealed = true;
    wolfStarData.forEach(s => {
        s.color = 'gold';
        s.alpha = 1.0;
        s.element.setAttribute('fill',    'gold');
        s.element.setAttribute('opacity', '1');
    });
    wolfLines.forEach(line => {
        line.setAttribute('opacity', '0.7');
    });
}

/**
 * ANIMATION LOOP
 */
function animate() {
    // Twinkle random background stars
    stars.forEach(star => {
        star.alpha = 0.5 + Math.sin(Date.now() / 300 + star.id) * 0.4;
        star.element.setAttribute('opacity', star.alpha);
        updateStarTransform(star.element, star);
    });

    // Animate wolf constellation stars
    if (!wolfRevealed) {
        wolfStarData.forEach((star, idx) => {
            star.alpha = 0.5 + Math.sin(Date.now() / 300 + idx * 1.3) * 0.4;
            star.element.setAttribute('opacity', star.alpha);
        });
    } else {
        const pulse = 0.85 + Math.sin(Date.now() / 600) * 0.15;
        wolfStarData.forEach(star => {
            star.element.setAttribute('opacity', pulse);
        });
        wolfLines.forEach(line => {
            line.setAttribute('opacity', pulse * 0.7);
        });
    }

    requestAnimationFrame(animate);
}

/**
 * INITIALIZATION
 */
function init() {
    placeStars();
    initDOM();

    // Click anywhere inside the wolf bounding box to reveal it
    svg.addEventListener('click', e => {
        if (wolfRevealed) return;
        if (
            e.clientX >= wolfOffset.x &&
            e.clientX <= wolfOffset.x + WOLF_PATTERN_WIDTH &&
            e.clientY >= wolfOffset.y &&
            e.clientY <= wolfOffset.y + WOLF_PATTERN_HEIGHT
        ) {
            revealWolf();
        }
    });

    animate();
}
window.addEventListener('resize', () => {
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    svg.setAttribute('width',  window.innerWidth);
    svg.setAttribute('height', window.innerHeight);
});
console.log(`Number of stars generated: ${stars.length}`);
init();
