export const MAP_WIDTH = 900;
export const MAP_HEIGHT = 700;

export const ALGERIA_BOUNDS = {
  minLon: -8.7,
  maxLon: 12.0,
  minLat: 18.9,
  maxLat: 37.1
};

export function projectPoint(longitude, latitude) {
  const { minLon, maxLon, minLat, maxLat } = ALGERIA_BOUNDS;
  const x = ((longitude - minLon) / (maxLon - minLon)) * MAP_WIDTH;
  const y = ((maxLat - latitude) / (maxLat - minLat)) * MAP_HEIGHT;
  return { x, y };
}

const outlineCoordinates = [
  [-8.68, 27.66], [-8.68, 29.50], [-7.60, 32.10], [-6.50, 34.10],
  [-5.50, 35.10], [-4.00, 35.40], [-2.20, 35.10], [-1.10, 35.60],
  [0.30, 36.00], [1.60, 36.60], [3.20, 36.80], [5.00, 36.90],
  [6.50, 37.00], [8.30, 36.90], [9.50, 36.40], [8.60, 34.80],
  [7.50, 34.00], [6.60, 33.20], [7.60, 31.70], [8.50, 30.10],
  [9.00, 28.00], [9.90, 26.50], [11.00, 25.00], [12.00, 23.90],
  [11.50, 23.50], [9.50, 23.70], [7.50, 24.50], [5.50, 24.80],
  [3.00, 25.50], [1.00, 26.00], [-1.00, 26.50], [-3.00, 27.00],
  [-5.00, 27.30], [-6.80, 27.50]
];

export const ALGERIA_OUTLINE = outlineCoordinates
  .map(([longitude, latitude], index) => {
    const { x, y } = projectPoint(longitude, latitude);
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  })
  .join(' ') + ' Z';
