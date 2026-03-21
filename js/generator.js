import { CONFIG } from './config.js';
import { STARS } from './stars.js';
import { randomBetween, pointToSegmentDistance } from './mathUtils.js';

export function generateStarfield(constellationId, constellations, width, height) {
    const config = constellations[constellationId];
    const constellationStars = [];
    const connections = [];
    const backgroundStars = [];

    // 1. Scale and Position Constellation
    const minDim = Math.min(width, height);
    const scale = (Math.max(0.5, (minDim * 0.75) / 110)) * (config.scale || 1);
    const offX = randomBetween(50, width - (80 * scale) - 50);
    const offY = randomBetween(50, height - (110 * scale) - 50);

    let globalIdx = 0;
    config.paths.forEach(pathStr => {
        const pairs = pathStr.match(/\d+\.\d+,\d+\.\d+/g);
        if (pairs) {
            pairs.forEach((pair, localIdx) => {
                const [rx, ry] = pair.split(',').map(Number);
                constellationStars.push({
                    x: offX + (rx * scale),
                    y: offY + (ry * scale),
                    size: randomBetween(CONFIG.STAR_MIN_SIZE, CONFIG.STAR_MAX_SIZE),
                    rotation: randomBetween(0, 360),
                    def: STARS[Math.floor(Math.random() * STARS.length)],
                    alpha: randomBetween(CONFIG.MIN_STAR_ALPHA, CONFIG.MAX_STAR_ALPHA)
                });
                if (localIdx > 0) connections.push([globalIdx - 1, globalIdx]);
                globalIdx++;
            });
        }
    });

    // 2. Generate Background Stars
    for (let i = 0; i < CONFIG.STAR_COUNT; i++) {
        for (let attempt = 0; attempt < CONFIG.MAX_PLACEMENT_ATTEMPTS; attempt++) {
            const size = randomBetween(CONFIG.STAR_MIN_SIZE, CONFIG.STAR_MAX_SIZE);
            const x = randomBetween(size, width - size);
            const y = randomBetween(size, height - size);

            let tooClose = constellationStars.some(s => Math.hypot(x - s.x, y - s.y) < CONFIG.STAR_BUFFER_CONST);
            
            if (!tooClose) {
                tooClose = connections.some(([i1, i2]) => {
                    return pointToSegmentDistance(x, y, constellationStars[i1].x, constellationStars[i1].y, constellationStars[i2].x, constellationStars[i2].y) < CONFIG.LINE_BUFFER;
                });
            }

            if (!tooClose) {
                tooClose = backgroundStars.some(s => Math.hypot(x - s.x, y - s.y) < CONFIG.STAR_BUFFER_BG);
            }

            if (!tooClose) {
                backgroundStars.push({ 
                    x, y, size, 
                    rotation: randomBetween(0, 360), 
                    def: STARS[Math.floor(Math.random() * STARS.length)], 
                    alpha: randomBetween(CONFIG.MIN_STAR_ALPHA, CONFIG.MAX_STAR_ALPHA) 
                });
                break;
            }
        }
    }

    return { constellationStars, backgroundStars, connections };
}
