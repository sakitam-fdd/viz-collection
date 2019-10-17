import proj4 from 'proj4';

/**
 * update min max for extent
 * @param points
 * @param min
 * @param max
 */
export function updateExtent(points: any[], min: number[], max: number[]) {
  for (let i = 0; i < points.length; i++) {
    min[0] = Math.min(points[i][0], min[0]);
    min[1] = Math.min(points[i][1], min[1]);
    max[0] = Math.max(points[i][0], max[0]);
    max[1] = Math.max(points[i][1], max[1]);
  }
}

export function transformExtent(extent: number[], source: string, destination: string) {
  return [
    ...proj4(source, destination, [extent[0], extent[1]]),
    ...proj4(source, destination, [extent[2], extent[3]]),
  ];
}

export function toLonLat(coordinates: number[]): number[] {
  return proj4('EPSG:3857', 'EPSG:4326', coordinates);
}
