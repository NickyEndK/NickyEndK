/**
 * INITIAL SETUP
 */
const svg = document.getElementById('starfield');
const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * CONFIGURATION CONSTANTS
 */
const STAR_COUNT      = 200;
const STAR_MIN_SIZE   = 5;   // Increased slightly so they are easier to see
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
// Notice: We map each star to its ID and its original grid size!
// Refined coordinates (0-100) based on Angel.svg silhouette
const WOLF_PATHS = [
  "M45.500,79.500 C44.840,76.861 44.831,74.120 45.500,71.500 C45.722,70.630 46.017,69.775 46.389,68.942 C47.510,66.426 49.263,64.251 51.500,62.500 ",
  "M39.500,98.500 L37.500,89.500 C36.766,89.928 36.026,90.360 35.289,90.790 C35.087,90.907 34.630,91.174 34.427,91.293 C32.625,92.344 28.476,94.764 25.500,96.500 C25.500,97.167 25.500,97.833 25.500,98.500 L39.500,98.500 Z",
  "M43.500,48.500 L50.500,50.500 L52.500,53.500 C52.500,55.198 52.500,56.895 52.500,58.593 C52.500,58.895 52.500,59.198 52.500,59.500 C52.167,60.500 51.833,61.500 51.500,62.500 C51.349,65.679 51.197,68.859 51.046,72.038 C50.864,75.859 50.682,79.679 50.500,83.500 C52.500,88.500 54.500,93.500 56.500,98.500 L51.500,98.500 L45.500,85.500 ",
  "M44.500,79.500 L44.500,98.500 L41.500,98.500 C41.500,94.981 41.500,91.461 41.500,87.942 C41.500,86.128 41.500,84.314 41.500,82.500 ",
  "M37.500,46.500 C36.847,47.111 36.183,47.443 35.500,47.500 C34.968,47.544 34.192,47.210 33.500,47.500 C32.975,47.720 32.650,48.196 32.500,48.500 C31.740,50.040 33.024,52.302 34.500,53.500 C35.210,54.077 36.729,55.025 37.500,54.500 C38.332,53.934 37.595,52.132 38.500,51.500 C38.987,51.160 39.557,51.460 40.500,51.500 C42.781,51.597 45.552,50.403 42.500,46.500 C41.748,45.539 40.702,44.864 39.500,44.500 L37.500,46.500 L35.500,43.500 L35.500,40.500 L49.500,34.500 L50.500,28.500 C50.829,28.152 51.157,27.823 51.500,27.500 C55.566,23.664 59.504,22.442 61.500,22.500 C62.380,22.526 63.936,22.844 65.500,23.500 C68.085,24.585 70.034,26.829 70.500,26.500 C71.135,26.051 69.538,21.887 66.500,18.500 C64.565,16.342 62.191,14.678 59.500,13.500 L50.500,13.500 L51.500,11.500 L57.500,11.500 L68.500,11.500 C66.505,8.728 63.719,6.630 60.500,5.500 C56.939,4.250 53.064,4.262 49.500,5.500 L41.500,9.500 C43.450,6.534 43.618,3.922 42.500,2.500 C41.972,1.829 41.001,1.213 40.500,1.500 C39.749,1.930 40.677,4.846 40.500,6.500 C40.334,8.052 38.105,12.015 33.500,15.500 C29.956,18.182 25.891,20.187 21.500,21.500 L13.500,21.500 L6.500,19.500 L9.500,23.500 L6.500,24.500 L2.500,27.500 L10.500,26.500 L6.500,28.500 L3.500,31.500 C6.499,31.050 9.522,31.048 12.500,31.500 C17.089,32.196 20.672,33.685 23.500,35.500 C24.531,36.161 25.520,36.898 26.461,37.707 C28.423,39.395 30.110,41.341 31.500,43.500 C31.833,43.833 32.167,44.167 32.500,44.500 L32.500,46.500 L27.500,47.500 L27.500,61.500 L26.500,64.500 L24.500,76.500 C22.596,78.665 20.925,81.003 19.500,83.500 C17.028,87.832 15.350,92.554 14.500,97.500 L17.500,98.500 C20.979,92.691 23.984,86.686 26.500,80.500 C28.753,74.960 30.922,68.776 31.500,65.500 C32.521,59.716 32.272,55.716 33.500,55.500 C35.099,55.219 37.179,61.719 38.500,66.500 C38.626,66.956 38.759,67.421 38.843,67.963 C39.059,69.349 39.023,71.046 38.500,72.500 C37.430,75.477 34.479,76.955 33.500,77.500 C27.873,80.630 23.302,88.162 19.500,98.500 L24.500,98.500 C26.093,95.243 28.107,92.222 30.500,89.500 C32.852,86.825 35.536,84.476 38.500,82.500 "
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

const WOLF_SCALE = 3.8;
const WOLF_PATTERN_WIDTH = 80 * WOLF_SCALE;
const WOLF_PATTERN_HEIGHT = 110 * WOLF_SCALE;
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
function placeStars() {
    stars.length = 0;
    svg.innerHTML = '';
    angelStarData.length = 0;
    angelLines.length = 0;
    angelRevealed = false;

    // Choose a random position for the angel constellation
    const margin = 30;
    const maxX = window.innerWidth  - ANGEL_PATTERN_WIDTH  - margin;
    const maxY = window.innerHeight - ANGEL_PATTERN_HEIGHT - margin;
    // Clamp so the pattern stays on-screen even on small viewports
    angelOffset.x = randomBetween(margin, Math.max(margin, maxX));
    angelOffset.y = randomBetween(margin, Math.max(margin, maxY));

    // Place random background stars, skipping any that land inside the angel bounding box
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

            // Clear random stars from the angel bounding box (account for star radius)
            const insideAngel = (
                candidate.x + candidate.size / 2 >= angelOffset.x &&
                candidate.x - candidate.size / 2 <= angelOffset.x + ANGEL_PATTERN_WIDTH &&
                candidate.y + candidate.size / 2 >= angelOffset.y &&
                candidate.y - candidate.size / 2 <= angelOffset.y + ANGEL_PATTERN_HEIGHT
            );

            if (!insideAngel && !stars.some(existing => overlaps(candidate, existing))) {
                stars.push(candidate);
                break;
            }
        }
    }

    // Build angel constellation star data objects
    ANGEL_PATTERN.forEach((pt, idx) => {
        angelStarData.push({
            id:       'angel_' + idx,
            x:        angelOffset.x + pt.rx * ANGEL_SCALE,
            y:        angelOffset.y + pt.ry * ANGEL_SCALE,
            size:     ANGEL_STAR_SIZE,
            rotation: 0,
            def:      pt.def,
            alpha:    randomBetween(MIN_ALPHA, MAX_ALPHA),
            color:    '#ffffff',
            element:  null,
        });
    });
}

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
        
        // Reference the ID from our defs (<use href="#star1">)
        starUse.setAttribute('href', starData.def.id);
        
        // Apply Color and Opacity
        starUse.setAttribute('fill',    starData.color);
        starUse.setAttribute('opacity', starData.alpha);
        
        // Position it
        updateStarTransform(starUse, starData);

        svg.appendChild(starUse);
        
        // Save the SVG element to our data object so we can move it later!
        starData.element = starUse;
    });

    // Angel constellation stars — initially look like ordinary stars
    angelStarData.forEach(starData => {
        const starUse = document.createElementNS(SVG_NS, 'use');
        starUse.setAttribute('href',    starData.def.id);
        starUse.setAttribute('fill',    starData.color);
        starUse.setAttribute('opacity', starData.alpha);
        updateStarTransform(starUse, starData);
        svg.appendChild(starUse);
        starData.element = starUse;
    });

    // Constellation lines — hidden until the Angel is revealed
    ANGEL_CONNECTIONS.forEach(([i, j]) => {
        const line = document.createElementNS(SVG_NS, 'line');
        const s1   = angelStarData[i];
        const s2   = angelStarData[j];
        line.setAttribute('x1',           s1.x);
        line.setAttribute('y1',           s1.y);
        line.setAttribute('x2',           s2.x);
        line.setAttribute('y2',           s2.y);
        line.setAttribute('stroke',       'gold');
        line.setAttribute('stroke-width', '0.8');
        line.setAttribute('opacity',      '0');
        svg.appendChild(line);
        angelLines.push(line);
    });
}

/**
 * MATH: Properly aligns, rotates, and scales the stars
 */
function updateStarTransform(element, data) {
    // Figure out how much we need to shrink/grow the original shape
    const scale = data.size / data.def.originalSize;
    // Find the center of the original shape
    const cx = data.def.originalSize / 2;
    const cy = data.def.originalSize / 2;
    
    // Move to X,Y -> Rotate -> Scale -> Shift so the center of the shape aligns with X,Y
    element.setAttribute(
        'transform', 
        `translate(${data.x}, ${data.y}) rotate(${data.rotation}) scale(${scale}) translate(${-cx}, ${-cy})`
    );
}

/**
 * REVEAL ANGEL: Called when the user clicks inside the constellation bounding box.
 * Turns the constellation stars gold and shows the connecting lines.
 */
function revealAngel() {
    angelRevealed = true;
    angelStarData.forEach(s => {
        s.color = 'gold';
        s.alpha = 1.0;
        s.element.setAttribute('fill',    'gold');
        s.element.setAttribute('opacity', '1');
    });
    angelLines.forEach(line => {
        line.setAttribute('opacity', '0.7');
    });
}

/**
 * ANIMATION LOOP (Runs 60 times a second)
 */
function animate() {
    // Twinkle random background stars
    stars.forEach(star => {
        // We use Math.sin and the star's ID so they don't all twinkle at the exact same time
        star.alpha = 0.5 + Math.sin(Date.now() / 300 + star.id) * 0.4;
        
        // Apply the updated rotation and opacity to the DOM element
        star.element.setAttribute('opacity', star.alpha);
        updateStarTransform(star.element, star);
    });

    // Animate angel constellation stars
    if (!angelRevealed) {
        // Twinkle like ordinary stars before reveal
        angelStarData.forEach((star, idx) => {
            star.alpha = 0.5 + Math.sin(Date.now() / 300 + idx * 1.3) * 0.4;
            star.element.setAttribute('opacity', star.alpha);
        });
    } else {
        // Gentle golden pulse after reveal
        const pulse = 0.85 + Math.sin(Date.now() / 600) * 0.15;
        angelStarData.forEach(star => {
            star.element.setAttribute('opacity', pulse);
        });
        angelLines.forEach(line => {
            line.setAttribute('opacity', pulse * 0.7);
        });
    }

    // Request the next frame to keep the animation going
    requestAnimationFrame(animate);
}

/**
 * INITIALIZATION
 */
function init() {
    placeStars();
    initDOM();

    // Click anywhere inside the angel bounding box to reveal the constellation
    svg.addEventListener('click', e => {
        if (angelRevealed) return;
        if (
            e.clientX >= angelOffset.x &&
            e.clientX <= angelOffset.x + ANGEL_PATTERN_WIDTH &&
            e.clientY >= angelOffset.y &&
            e.clientY <= angelOffset.y + ANGEL_PATTERN_HEIGHT
        ) {
            revealAngel();
        }
    });

    animate(); // Start the animation loop!
}
window.addEventListener('resize', () => {
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    svg.setAttribute('width',  window.innerWidth);
    svg.setAttribute('height', window.innerHeight);
});
console.log(`Number of stars generated: ${stars.length}`);
init();
