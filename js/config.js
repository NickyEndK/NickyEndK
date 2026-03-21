export const CONFIG = {
    STAR_COUNT: 200,
    STAR_MIN_SIZE: 3,
    STAR_MAX_SIZE: 6,
    MIN_STAR_ALPHA: 0.2,
    MAX_STAR_ALPHA: 1.0,
    
    // Constellation Visuals
    LINE_DRAW_SPEED: 0.08,
    LINE_WIDTH: 0.8,
    LINE_OPACITY: 0.7,
    
    // Collision Thresholds (The "Void" Fixes)
    LINE_BUFFER: 500,         // Space between lines and BG stars
    STAR_BUFFER_CONST: 500,   // Space between constellation stars and BG stars
    STAR_BUFFER_BG: 3,      // Space between individual BG stars
    
    MAX_PLACEMENT_ATTEMPTS: 100
};
