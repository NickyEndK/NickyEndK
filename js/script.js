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

// Notice: We map each star to its ID and its original grid size!
// Refined coordinates (0-100) based on Angel.svg silhouette
const ANGEL_PATTERN = [
    // Hair & Head
    { rx: 48, ry: 6,  def: starDefs[0] }, // 0: Top hair peak
    { rx: 72, ry: 12, def: starDefs[1] }, // 1: Right hair high
    { rx: 88, ry: 30, def: starDefs[2] }, // 2: Right hair low (behind)
    { rx: 62, ry: 42, def: starDefs[3] }, // 3: Back of head/neck join
    { rx: 22, ry: 30, def: starDefs[0] }, // 4: Left hair spike
    { rx: 18, ry: 45, def: starDefs[1] }, // 5: Front face/mouth tip
    { rx: 52, ry: 50, def: starDefs[2] }, // 6: Neck base
    
    // Bowtie
    { rx: 52, ry: 54, def: starDefs[3] }, // 7: Bowtie center
    { rx: 46, ry: 53, def: starDefs[0] }, // 8: Bowtie left
    { rx: 58, ry: 53, def: starDefs[1] }, // 9: Bowtie right
    
    // Upper Arms (Long/High)
    { rx: 48, ry: 62, def: starDefs[2] }, // 10: Upper Left Shoulder
    { rx: 35, ry: 75, def: starDefs[3] }, // 11: Upper Left Elbow
    { rx: 22, ry: 90, def: starDefs[0] }, // 12: Upper Left Hand
    { rx: 64, ry: 62, def: starDefs[1] }, // 13: Upper Right Shoulder
    { rx: 78, ry: 75, def: starDefs[2] }, // 14: Upper Right Elbow
    { rx: 88, ry: 90, def: starDefs[3] }, // 15: Upper Right Hand

    // Lower Arms & Waist
    { rx: 54, ry: 78, def: starDefs[0] }, // 16: Waist
    { rx: 50, ry: 70, def: starDefs[1] }, // 17: Lower Left Shoulder
    { rx: 40, ry: 88, def: starDefs[2] }, // 18: Lower Left Elbow
    { rx: 32, ry: 98, def: starDefs[3] }, // 19: Lower Left Hand
    { rx: 58, ry: 70, def: starDefs[0] }, // 20: Lower Right Shoulder
    { rx: 70, ry: 88, def: starDefs[1] }, // 21: Lower Right Elbow
    { rx: 80, ry: 98, def: starDefs[2] }, // 22: Lower Right Hand

    // Feet
    { rx: 52, ry: 98, def: starDefs[3] }, // 23: Left Foot
    { rx: 58, ry: 98, def: starDefs[0] }  // 24: Right Foot
];

const ANGEL_CONNECTIONS = [
    // Head Contour
    [0, 1], [1, 2], [2, 3], [3, 6], [6, 5], [5, 4], [4, 0],
    // Bowtie Details
    [6, 7], [7, 8], [7, 9], [8, 9],
    // Upper Arm Set
    [10, 11], [11, 12], [13, 14], [14, 15],
    // Lower Arm Set
    [17, 18], [18, 19], [20, 21], [21, 22],
    // Body & Legs
    [6, 16], [16, 23], [16, 24]
];

const ANGEL_SCALE          = 3.8;  
const ANGEL_STAR_SIZE      = 5;    
const ANGEL_PATTERN_WIDTH  = 90 * ANGEL_SCALE; 
const ANGEL_PATTERN_HEIGHT = 100 * ANGEL_SCALE;
const stars = [];
let angelOffset   = { x: 0, y: 0 };
let angelRevealed = false;
const angelStarData = [];
const angelLines    = [];

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
