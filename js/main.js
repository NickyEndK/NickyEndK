import { CONFIG } from './config.js';
import { CONSTELLATIONS } from './constellations.js';
import { STARS } from './stars.js';
import { generateStarfield } from './generator.js';
import { createStarElement, drawLine } from './renderer.js';

const svg = document.getElementById('starfield');
let currentData = null;
let isDrawing = false;
let revealed = false;

function init() {
    document.body.style.backgroundColor = CONFIG.BG_COLOR;
    
    // Nastavení pevného viewBoxu při prvním načtení. Určuje "vnitřní" rozlišení plátna.
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    
    // Instrukce pro prohlížeč: Při změně velikosti okna zachovej poměr stran 
    // a celý obsah přizpůsob oknu (chová se jako plynulý zoom/oddálení).
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    
    svg.innerHTML = '<defs></defs>';
    
    // Příprava definic SVG tvarů hvězd pro pozdější znovupoužití (zvyšuje výkon).
    const defs = svg.querySelector('defs');
    STARS.forEach(star => {
        const g = document.createElementNS("http://www.w3.org/2000/svg", 'g');
        g.setAttribute('id', star.id);
        const path = document.createElementNS("http://www.w3.org/2000/svg", 'path');
        path.setAttribute('d', star.path);
        g.appendChild(path);
        defs.appendChild(g);
    });

    // Získání vygenerovaných dat pro zadané souhvězdí.
    currentData = generateStarfield('wolf', CONSTELLATIONS, window.innerWidth, window.innerHeight);
    
    // Vykreslení elementů do DocumentFragmentu před hromadným vložením do DOMu (zabraňuje překreslování).
    const frag = document.createDocumentFragment();
    const gLines = document.createElementNS("http://www.w3.org/2000/svg", 'g');
    
    currentData.backgroundStars.forEach(s => frag.appendChild(createStarElement(s)));
    
    currentData.lines = currentData.connections.map(([i, j]) => {
        const line = drawLine(currentData.constellationStars[i], currentData.constellationStars[j]);
        gLines.appendChild(line);
        return line;
    });
    
    frag.appendChild(gLines);
    currentData.constellationStars.forEach(s => frag.appendChild(createStarElement(s)));
    svg.appendChild(frag);
}

// Funkce pro postupnou animaci spojovacích čar souhvězdí.
function reveal() {
    if (revealed || isDrawing) return;
    isDrawing = true;
    let idx = 0;
    
    const drawNext = () => {
        if (idx >= currentData.lines.length) { 
            revealed = true; 
            isDrawing = false; 
            return; 
        }
        const l = currentData.lines[idx];
        l.setAttribute('opacity', CONFIG.LINE_OPACITY);
        let prog = 0;
        const x1 = parseFloat(l.getAttribute('x1')), y1 = parseFloat(l.getAttribute('y1'));
        const tx = parseFloat(l.dataset.tx), ty = parseFloat(l.dataset.ty);

        const animate = () => {
            prog += CONFIG.LINE_DRAW_SPEED;
            if (prog >= 1) { 
                l.setAttribute('x2', tx); 
                l.setAttribute('y2', ty); 
                idx++; 
                drawNext(); 
            } else { 
                l.setAttribute('x2', x1 + (tx - x1) * prog); 
                l.setAttribute('y2', y1 + (ty - y1) * prog); 
                requestAnimationFrame(animate); 
            }
        };
        animate();
    };
    drawNext();
}

// Detekce kliknutí v blízkosti bodu souhvězdí spouští animaci odhalení.
svg.addEventListener('click', e => {
    // Vzhledem k tomu, že se SVG při změně okna škáluje automaticky (zoomuje), 
    // události myši se mapují rovnou na původní souřadnice viewBoxu.
    
    // Kód vytvoří transformační matici SVG, aby správně přepočítal kliknutí myši z pixelů obrazovky 
    // do vnitřních koordinátů viewBoxu.
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

    const hit = currentData.constellationStars.some(s => 
        Math.hypot(svgP.x - s.x, svgP.y - s.y) < CONFIG.CLICK_RADIUS
    );
    if (hit) reveal();
});

// Spuštění aplikace.
init();
