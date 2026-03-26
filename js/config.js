// config.js
export const CONFIG = {

    // -------------------------------------------------------------------------
    // COLORS
    // -------------------------------------------------------------------------
    BG_COLOR:   '#000000',  // Page/body background color
    STAR_COLOR: '#ffffff',  // Fill color for all star shapes (constellation + background)
    LINE_COLOR: '#ffffff',  // Stroke color for constellation connection lines

    // -------------------------------------------------------------------------
    // CONSTELLATION PLACEMENT
    // -------------------------------------------------------------------------
    CONSTELLATION_ROT_MIN: 0,   // Minimum random rotation of the whole constellation (degrees)
    CONSTELLATION_ROT_MAX: 45,  // Maximum random rotation of the whole constellation (degrees)
    CANVAS_PADDING: 50,         // Minimum distance (px) the constellation must stay from viewport edges

    // -------------------------------------------------------------------------
    // STAR SHAPES — shared by both constellation and background stars
    // -------------------------------------------------------------------------
    STAR_ROT_MIN:  0,    // Minimum random rotation of an individual star shape (degrees)
    STAR_ROT_MAX:  360,  // Maximum random rotation of an individual star shape (degrees)
    STAR_MIN_SIZE: 3,    // Minimum rendered size of a star (px)
    STAR_MAX_SIZE: 6,    // Maximum rendered size of a star (px)
    MIN_STAR_ALPHA: 0.2, // Minimum opacity of a star (0–1)
    MAX_STAR_ALPHA: 1.0, // Maximum opacity of a star (0–1)

    // -------------------------------------------------------------------------
    // CONSTELLATION LINE ANIMATION
    // -------------------------------------------------------------------------
    LINE_DRAW_SPEED: 0.08, // How fast each line animates in per frame (progress 0→1, higher = faster)
    LINE_WIDTH:      0.8,  // Stroke width of constellation lines (px)
    LINE_OPACITY:    0.7,  // Final opacity of fully drawn constellation lines (0–1)

    // -------------------------------------------------------------------------
    // BACKGROUND STAR PLACEMENT — collision avoidance
    // -------------------------------------------------------------------------
    LINE_BUFFER:      10,  // Min distance (px) a background star must keep from any constellation line
    STAR_BUFFER_CONST: 8,  // Min distance (px) a background star must keep from any constellation star
    STAR_BUFFER_BG:    3,  // Min distance (px) between two background stars (prevents clumping)

    // -------------------------------------------------------------------------
    // INTERACTION
    // -------------------------------------------------------------------------
    CLICK_RADIUS: 20, // How close (px, in SVG coords) a click/tap must be to a constellation star to trigger reveal

    // -------------------------------------------------------------------------
    // PERFORMANCE
    // -------------------------------------------------------------------------
    STAR_COUNT:            200, // Number of background stars to attempt to place
    MAX_PLACEMENT_ATTEMPTS: 100 // Max tries per background star before giving up and skipping it
};
