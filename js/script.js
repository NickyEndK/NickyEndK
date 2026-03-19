/**
 * INITIAL SETUP
 */
const svg = document.getElementById('starfield');
const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * CONFIGURATION CONSTANTS
 */
const STAR_COUNT      = 200;
const STAR_MIN_SIZE   = 1;
const STAR_MAX_SIZE   = 10;
const OVERLAP_PADDING = 4;
const MAX_ATTEMPTS    = 100;
const MIN_ALPHA       = 0.2;
const MAX_ALPHA       = 1.0;

const starPaths = [
    'Stars/star1.svg',
    'Stars/star2.svg',
    'Stars/star3.svg',
    'Stars/star4.svg'
];

const stars = [];

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
 * RENDER: Creates the actual SVG elements
 */
function render() {
    // Clear the SVG
    svg.innerHTML = '';
    
    // Set the viewBox to match the current window size
    // This keeps the coordinate system 1:1 with pixels
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);

    stars.forEach(starData => {
        const starImg = document.createElementNS(SVG_NS, 'image');
        
        starImg.setAttribute('href', starData.path);
        starImg.setAttribute('width', starData.size);
        starImg.setAttribute('height', starData.size);
        
        // Position the star (adjusting so x,y is the center)
        const xPos = starData.x - starData.size / 2;
        const yPos = starData.y - starData.size / 2;
        
        starImg.setAttribute('x', xPos);
        starImg.setAttribute('y', yPos);
        starImg.setAttribute('opacity', starData.alpha);
        
        // Apply rotation around the center of the star
        starImg.setAttribute('transform', `rotate(${starData.rotation}, ${starData.x}, ${starData.y})`);

        svg.appendChild(starImg);
    });
}

/**
 * STAR PLACEMENT
 */
function placeStars() {
    stars.length = 0; 

    for (let i = 0; i < STAR_COUNT; i++) {
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            const size = randomBetween(STAR_MIN_SIZE, STAR_MAX_SIZE);
            
            const candidate = {
                x: randomBetween(size / 2, window.innerWidth - size / 2),
                y: randomBetween(size / 2, window.innerHeight - size / 2),
                size,
                rotation: randomBetween(0, 360), // SVG uses degrees
                path: starPaths[Math.floor(Math.random() * starPaths.length)],
                alpha: randomBetween(MIN_ALPHA, MAX_ALPHA)
            };

            if (!stars.some(existing => overlaps(candidate, existing))) {
                stars.push(candidate);
                break;
            }
        }
    }
}

/**
 * INITIALIZATION
 */
function init() {
    placeStars();
    render();
}

// Re-generate on resize to keep the density correct for the new window size
window.addEventListener('resize', () => {
    init();
});

init();
