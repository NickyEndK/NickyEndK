import { CONFIG } from './config.js';
import { STAR_SHAPES } from './shapes.js';
import { randomBetween, checkOverlap } from './utils.js';

const svg = document.getElementById('starfield');
const SVG_NS = "http://www.w3.org/2000/svg";
const stars = [];

function createStarData() {
    for (let i = 0; i < CONFIG.STAR_COUNT; i++) {
        for (let attempt = 0; attempt < CONFIG.MAX_ATTEMPTS; attempt++) {
            const size = randomBetween(CONFIG.STAR_MIN_SIZE, CONFIG.STAR_MAX_SIZE);
            const shape = STAR_SHAPES[Math.floor(Math.random() * STAR_SHAPES.length)];
            
            const candidate = {
                id: i,
                x: randomBetween(size / 2, window.innerWidth - size / 2),
                y: randomBetween(size / 2, window.innerHeight - size / 2),
                size,
                rotation: randomBetween(0, 360),
                shape,
                alpha: randomBetween(CONFIG.MIN_ALPHA, CONFIG.MAX_ALPHA),
                element: null
            };

            if (!checkOverlap(candidate, stars, CONFIG.OVERLAP_PADDING)) {
                stars.push(candidate);
                break;
            }
        }
    }
}

function render() {
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    stars.forEach(data => {
        const el = document.createElementNS(SVG_NS, 'use');
        el.setAttribute('href', data.shape.id);
        el.setAttribute('fill', '#ffffff');
        data.element = el;
        updateTransform(data);
        svg.appendChild(el);
    });
}

function updateTransform(data) {
    const scale = data.size / data.shape.originalSize;
    const center = data.shape.originalSize / 2;
    data.element.setAttribute('transform', 
        `translate(${data.x}, ${data.y}) rotate(${data.rotation}) scale(${scale}) translate(${-center}, ${-center})`
    );
}

function animate() {
    stars.forEach(star => {
        star.alpha = 0.5 + Math.sin(Date.now() / CONFIG.TWINKLE_SPEED + star.id) * 0.4;
        star.element.setAttribute('opacity', star.alpha);
    });
    requestAnimationFrame(animate);
}

// Start everything
createStarData();
render();
animate();
