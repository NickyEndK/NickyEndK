// constellations.js
// Constellation definitions. Each key is a constellation id used in generateStarfield().
//
// Fields per constellation:
//   paths       — array of SVG polyline strings; each string is a chain of "x,y" points
//                 representing one connected segment of the constellation.
//                 Stars are placed at every point; lines connect consecutive points within a path.
//   scale       — multiplier applied on top of the auto-calculated viewport scale (1 = default fit)

export const CONSTELLATIONS = {
    wolf: {
        paths: [
            "M14.500,96.500 L23.500,78.500 L26.500,64.500 L26.500,49.500 L32.500,47.500 L16.500,33.500 L2.500,33.500 L9.500,28.500 L2.500,28.500 L9.500,24.500 L6.500,20.500 L22.500,23.500 L39.500,9.500 L40.500,2.500 L43.500,9.500 L55.500,6.500 L67.500,12.500 L50.500,13.500 L61.500,16.500 L69.500,26.500 L55.500,25.500 L48.500,34.500 L35.500,42.500 L37.500,47.500 L40.500,46.500 L43.500,51.500 L52.500,55.500 L51.500,87.500 L56.500,100.500",
            "M50.500,66.500 L44.500,76.500 L44.500,100.500",
            "M45.500,88.500 L51.500,99.500",
            "M41.500,84.500 L41.500,100.500",
            "M37.500,84.500 L24.500,99.500 L38.500,92.500 L39.500,100.500",
            "M18.500,99.500 L31.500,57.500 L38.500,72.500 L26.500,84.500"
        ],
        scale: 1,
    }
};
