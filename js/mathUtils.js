// mathUtils.js
// Shared math helpers.

// randomBetween(min, max)
// Returns a random float in the range [min, max).
export function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

// pointToSegmentDistance(px, py, x1, y1, x2, y2)
// Returns the shortest distance from point (px, py) to the line segment (x1,y1)→(x2,y2).
// Used by generator.js to enforce LINE_BUFFER around constellation lines.
export function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return Math.hypot(px - x1, py - y1); // Segment is a point
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
