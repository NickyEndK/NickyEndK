export function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

export function checkOverlap(candidate, existingStars, padding) {
    return existingStars.some(existing => {
        const dx = candidate.x - existing.x;
        const dy = candidate.y - existing.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDist = (candidate.size / 2) + (existing.size / 2) + padding;
        return distance < minDist;
    });
}
