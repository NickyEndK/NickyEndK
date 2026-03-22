import { CONFIG } from './config.js';
import { STARS } from './stars.js';
import { randomBetween, pointToSegmentDistance } from './mathUtils.js';

export function generateStarfield(constellationId, constellations, width, height) {
    const config = constellations[constellationId];
    const constellationStars = [];
    const connections = [];
    const backgroundStars = [];

    // 1. Setup Rotation (-45 to 45 degrees)
    const angleDeg = randomBetween(-45, 45);
    const angleRad = angleDeg * (Math.PI / 180);
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    // 2. Define Placement Zones (Percentages of screen)
    const zones = [
        { x: [0.1, 0.2], y: [0.1, 0.2] }, // Top Left
        { x: [0.7, 0.8], y: [0.1, 0.2] }, // Top Right
        { x: [0.1, 0.2], y: [0.7, 0.8] }, // Bottom Left
        { x: [0.7, 0.8], y: [0.7, 0.8] }, // Bottom Right
        { x: [0.4, 0.5], y: [0.4, 0.5] }, // Center
        { x: [0.6, 0.7], y: [0.4, 0.5] }  // Slight Right
    ];
    const zone = zones[Math.floor(Math.random() * zones.length)];

    // 3. Scale and Position
    const minDim = Math.min(width, height);
    const scale = (Math.max(0.5, (minDim * 0.75) / 110)) * (config.scale || 1);
    
    // Pick actual pixel offset based on selected zone
    const offX = width * randomBetween(zone.x[0], zone.x[1]);
    const offY = height * randomBetween(zone.y[0], zone.y[1]);

    // Approximate center of the Wolf SVG data to rotate around its own axis
    const centerX = 35; 
    const centerY = 50;

    let globalIdx = 0;
    config.paths.forEach(pathStr => {
        const pairs = pathStr.match(/\d+\.\d+,\d+\.\d+/g);
        if (pairs) {
            pairs.forEach((pair, localIdx) => {
                const [rxRaw, ryRaw] = pair.split(',').map(Number);
                
                // Translate to origin (0,0) based on wolf center, then scale
                const tx = (rxRaw - centerX) * scale;
                const ty = (ryRaw - centerY) * scale;

                // Apply 2D Rotation Matrix
                const rotatedX = tx * cos - ty * sin;
                const rotatedY = tx * sin + ty * cos;

                constellationStars.push({
                    x: offX + rotatedX,
                    y: offY + rotatedY,
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

    // 4. Generate Background Stars (Logic remains same, using new constellation positions)
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
