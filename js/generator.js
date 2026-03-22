import { CONFIG } from './config.js';
import { STARS } from './stars.js';
import { randomBetween, pointToSegmentDistance } from './mathUtils.js';

export function generateStarfield(constellationId, constellations, width, height) {
    const config = constellations[constellationId];
    const constellationStars = [];
    const connections = [];
    const backgroundStars = [];

    // 1. Nastavení úhlu rotace a celkového měřítka souhvězdí
    const angleRad = randomBetween(CONFIG.CONSTELLATION_ROT_MIN, CONFIG.CONSTELLATION_ROT_MAX) * (Math.PI / 180);
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    const minDim = Math.min(width, height);
    const scale = (Math.max(0.5, (minDim * 0.75) / 110)) * (config.scale || 1);
    
    // Výchozí střed souhvězdí, kolem kterého probíhá rotace
    const centerX = 35; 
    const centerY = 50;

    let localStars = [];
    let globalIdx = 0;

    // FÁZE 1: Výpočet tvaru "nanečisto" v lokálních souřadnicích
    // Zde se body pouze rotují a škálují, ještě se neumisťují na finální obrazovku.
    config.paths.forEach(pathStr => {
        const pairs = pathStr.match(/-?\d+\.?\d*,-?\d+\.?\d*/g);
        if (pairs) {
            pairs.forEach((pair, localIdx) => {
                const [rx, ry] = pair.split(',').map(Number);
                
                const tx = (rx - centerX) * scale;
                const ty = (ry - centerY) * scale;
                
                const rotatedX = tx * cos - ty * sin;
                const rotatedY = tx * sin + ty * cos;

                localStars.push({
                    localX: rotatedX,
                    localY: rotatedY,
                    size: randomBetween(CONFIG.STAR_MIN_SIZE, CONFIG.STAR_MAX_SIZE),
                    rotation: randomBetween(CONFIG.STAR_ROT_MIN, CONFIG.STAR_ROT_MAX),
                    def: STARS[Math.floor(Math.random() * STARS.length)],
                    alpha: randomBetween(CONFIG.MIN_STAR_ALPHA, CONFIG.MAX_STAR_ALPHA)
                });
                
                if (localIdx > 0) connections.push([globalIdx - 1, globalIdx]);
                globalIdx++;
            });
        }
    });

    // FÁZE 2: Detekce reálných rozměrů (Bounding Box)
    // Projde všechny vypočítané body a najde nejkrajnější hodnoty, čímž zjistí skutečnou šířku a výšku tvaru.
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    localStars.forEach(s => {
        if (s.localX < minX) minX = s.localX;
        if (s.localX > maxX) maxX = s.localX;
        if (s.localY < minY) minY = s.localY;
        if (s.localY > maxY) maxY = s.localY;
    });

    // FÁZE 3: Výpočet bezpečné zóny pro umístění na obrazovku
    // Odečte velikost souhvězdí a ochranný padding od okrajů okna.
    const padding = CONFIG.CANVAS_PADDING;
    
    let minOffX = padding - minX;
    let maxOffX = (width - padding) - maxX;
    
    let minOffY = padding - minY;
    let maxOffY = (height - padding) - maxY;

    // Pokud je souhvězdí větší než samotné okno, vycentruje ho přesně doprostřed.
    if (minOffX > maxOffX) {
        minOffX = (width / 2) - ((minX + maxX) / 2);
        maxOffX = minOffX;
    }
    if (minOffY > maxOffY) {
        minOffY = (height / 2) - ((minY + maxY) / 2);
        maxOffY = minOffY;
    }

    // Výběr jedné náhodné souřadnice uvnitř bezpečné zóny
    const offX = randomBetween(minOffX, maxOffX);
    const offY = randomBetween(minOffY, maxOffY);

    // FÁZE 4: Aplikování finální pozice
    // Přičte vypočítaný bezpečný offset k lokálním bodům.
    localStars.forEach(s => {
        constellationStars.push({
            x: s.localX + offX,
            y: s.localY + offY,
            size: s.size,
            rotation: s.rotation,
            def: s.def,
            alpha: s.alpha
        });
    });

    // FÁZE 5: Rozmístění hvězd v pozadí
    // Hledá náhodné pozice a kontroluje, zda nezasahují do souhvězdí, spojovacích čar nebo jiných hvězd.
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
                    rotation: randomBetween(CONFIG.STAR_ROT_MIN, CONFIG.STAR_ROT_MAX), 
                    def: STARS[Math.floor(Math.random() * STARS.length)], 
                    alpha: randomBetween(CONFIG.MIN_STAR_ALPHA, CONFIG.MAX_STAR_ALPHA) 
                });
                break;
            }
        }
    }
    
    return { constellationStars, backgroundStars, connections };
}
