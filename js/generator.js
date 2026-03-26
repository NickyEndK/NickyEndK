// generator.js
// Generates all star and connection data for a given constellation.
// Pure function — no DOM interaction, no side effects.
//
// Exports:
//   generateStarfield(constellationId, constellations, width, height)
//   → { constellationStars, backgroundStars, connections }

import { CONFIG } from './config.js';
import { STARS } from './stars.js';
import { randomBetween, pointToSegmentDistance } from './mathUtils.js';

export function generateStarfield(constellationId, constellations, width, height) {
    const config = constellations[constellationId];
    const constellationStars = [];
    const connections = [];
    const backgroundStars = [];

    // --- Phase 1: Rotation & scale setup ---
    // Pick a random rotation angle and calculate a scale that fits ~75% of the smaller viewport dimension.
    const angleRad = randomBetween(CONFIG.CONSTELLATION_ROT_MIN, CONFIG.CONSTELLATION_ROT_MAX) * (Math.PI / 180);
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    const minDim = Math.min(width, height);
    const scale = (Math.max(0.5, (minDim * 0.75) / 110)) * (config.scale || 1);

    // The origin point in the constellation's local coordinate space to rotate around.
    const centerX = 35;
    const centerY = 50;

    let localStars = [];
    let globalIdx = 0;

    // --- Phase 2: Parse paths into local (pre-offset) star positions ---
    // Each path string contains "x,y" pairs. Every point becomes a star;
    // consecutive points within a path are connected by a line.
    config.paths.forEach(pathStr => {
        const pairs = pathStr.match(/-?\d+\.?\d*,-?\d+\.?\d*/g);
        if (pairs) {
            pairs.forEach((pair, localIdx) => {
                const [rx, ry] = pair.split(',').map(Number);

                // Translate to rotation origin, then rotate
                const tx = (rx - centerX) * scale;
                const ty = (ry - centerY) * scale;
                const rotatedX = tx * cos - ty * sin;
                const rotatedY = tx * sin + ty * cos;

                localStars.push({
                    localX: rotatedX,
                    localY: rotatedY,
                    size:     randomBetween(CONFIG.STAR_MIN_SIZE, CONFIG.STAR_MAX_SIZE),
                    rotation: randomBetween(CONFIG.STAR_ROT_MIN, CONFIG.STAR_ROT_MAX),
                    def:      STARS[Math.floor(Math.random() * STARS.length)],
                    alpha:    randomBetween(CONFIG.MIN_STAR_ALPHA, CONFIG.MAX_STAR_ALPHA)
                });

                if (localIdx > 0) connections.push([globalIdx - 1, globalIdx]);
                globalIdx++;
            });
        }
    });

    // --- Phase 3: Bounding box detection ---
    // Find the actual extents of the rotated/scaled shape in local space.
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    localStars.forEach(s => {
        if (s.localX < minX) minX = s.localX;
        if (s.localX > maxX) maxX = s.localX;
        if (s.localY < minY) minY = s.localY;
        if (s.localY > maxY) maxY = s.localY;
    });

    // --- Phase 4: Safe placement zone ---
    // Calculate the range of offsets that keep the constellation within CANVAS_PADDING of all edges.
    const padding = CONFIG.CANVAS_PADDING;

    let minOffX = padding - minX;
    let maxOffX = (width - padding) - maxX;
    let minOffY = padding - minY;
    let maxOffY = (height - padding) - maxY;

    // If the constellation is larger than the viewport, just center it.
    if (minOffX > maxOffX) {
        minOffX = (width / 2) - ((minX + maxX) / 2);
        maxOffX = minOffX;
    }
    if (minOffY > maxOffY) {
        minOffY = (height / 2) - ((minY + maxY) / 2);
        maxOffY = minOffY;
    }

    // Pick one random position within the safe zone.
    const offX = randomBetween(minOffX, maxOffX);
    const offY = randomBetween(minOffY, maxOffY);

    // --- Phase 5: Apply final position ---
    // Add the safe offset to every local point to get screen coordinates.
    localStars.forEach(s => {
        constellationStars.push({
            x:        s.localX + offX,
            y:        s.localY + offY,
            size:     s.size,
            rotation: s.rotation,
            def:      s.def,
            alpha:    s.alpha
        });
    });

    // --- Phase 6: Background star placement ---
    // Scatter STAR_COUNT stars randomly, rejecting any that are too close to:
    //   - a constellation star (STAR_BUFFER_CONST)
    //   - a constellation line  (LINE_BUFFER)
    //   - another background star (STAR_BUFFER_BG)
    // Each star gets MAX_PLACEMENT_ATTEMPTS tries before being skipped.
    for (let starIdx = 0; starIdx < CONFIG.STAR_COUNT; starIdx++) {
        for (let attempt = 0; attempt < CONFIG.MAX_PLACEMENT_ATTEMPTS; attempt++) {
            const size = randomBetween(CONFIG.STAR_MIN_SIZE, CONFIG.STAR_MAX_SIZE);
            const x = randomBetween(size, width - size);
            const y = randomBetween(size, height - size);

            let tooClose = constellationStars.some(s => Math.hypot(x - s.x, y - s.y) < CONFIG.STAR_BUFFER_CONST);
            if (!tooClose) {
                tooClose = connections.some(([fromIdx, toIdx]) => {
                    return pointToSegmentDistance(
                        x, y,
                        constellationStars[fromIdx].x, constellationStars[fromIdx].y,
                        constellationStars[toIdx].x,   constellationStars[toIdx].y
                    ) < CONFIG.LINE_BUFFER;
                });
            }
            if (!tooClose) {
                tooClose = backgroundStars.some(s => Math.hypot(x - s.x, y - s.y) < CONFIG.STAR_BUFFER_BG);
            }

            if (!tooClose) {
                backgroundStars.push({
                    x, y, size,
                    rotation: randomBetween(CONFIG.STAR_ROT_MIN, CONFIG.STAR_ROT_MAX),
                    def:      STARS[Math.floor(Math.random() * STARS.length)],
                    alpha:    randomBetween(CONFIG.MIN_STAR_ALPHA, CONFIG.MAX_STAR_ALPHA)
                });
                break;
            }
        }
    }

    return { constellationStars, backgroundStars, connections };
}
