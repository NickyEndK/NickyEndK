export const CONFIG = {
    // Colors (Moved from style.css and renderer.js)
    BG_COLOR: '#000000',
    STAR_COLOR: '#ffffff',
    LINE_COLOR: '#ffffff',

    // Space & Placement (Moved from generator.js and main.js)
    CANVAS_PADDING: 50,
    CLICK_RADIUS: 20,
    STAR_ROT_MIN: 0,
    STAR_ROT_MAX: 360,

    // Star Settings
    STAR_COUNT: 200,
    STAR_MIN_SIZE: 3,
    STAR_MAX_SIZE: 6,
    MIN_STAR_ALPHA: 0.2,
    MAX_STAR_ALPHA: 1.0,
    
    // Existing Visuals
    LINE_DRAW_SPEED: 0.08,
    LINE_WIDTH: 0.8,
    LINE_OPACITY: 0.7,
    
    // Existing Collision Thresholds
    LINE_BUFFER: 500,
    STAR_BUFFER_CONST: 500,
    STAR_BUFFER_BG: 3,
    MAX_PLACEMENT_ATTEMPTS: 100
};
