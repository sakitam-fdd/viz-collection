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
