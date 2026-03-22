export const CONFIG = {
    BG_COLOR: '#000000',
    STAR_COLOR: '#ffffff',
    LINE_COLOR: '#ffffff',

    // Fix: Added missing rotation values for the constellation
    CONSTELLATION_ROT_MIN: 0,
    CONSTELLATION_ROT_MAX: 360,

    CANVAS_PADDING: 50,
    CLICK_RADIUS: 20,
    STAR_ROT_MIN: 0,
    STAR_ROT_MAX: 360,

    STAR_COUNT: 200,
    STAR_MIN_SIZE: 3,
    STAR_MAX_SIZE: 6,
    MIN_STAR_ALPHA: 0.2,
    MAX_STAR_ALPHA: 1.0,
    
    LINE_DRAW_SPEED: 0.08,
    LINE_WIDTH: 0.8,
    LINE_OPACITY: 0.7,
    
    // Fix: Lowered buffers to allow background stars to actually appear
    LINE_BUFFER: 3,
    STAR_BUFFER_CONST: 3,
    STAR_BUFFER_BG: 3,
    MAX_PLACEMENT_ATTEMPTS: 100
};
