import { Point } from "./point";

type Polygon = Array<Point>;

export function Polygon(points: Array<Point>): Polygon {
  return points;
}

// Assumption: The polygon is simple (does not intersect itself)
// Assumption: The polygon vertices are ordered either clockwise or counterclockwise
// Assumption: The point is not exactly on the edge of the polygon
Polygon.isPointInside = (polygon: Polygon, point: Point): boolean => {
  let inside = false;
  const { x, y } = point;
  const n = polygon.length;

  // Loop through each edge of the polygon
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y;
    const xj = polygon[j].x,
      yj = polygon[j].y;

    // Check if the point is on the correct side of the edge
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
};

export type WachspressCoords = number[]

Polygon.WachspressCoords = (polygon: Polygon, point: Point): WachspressCoords => {
  const n = polygon.length;
  const weights: number[] = new Array(n);
  let weightSum = 0;

  // Compute weights for each vertex
  for (let i = 0; i < n; i++) {
    const prev = polygon[(i + n - 1) % n];
    const curr = polygon[i];
    const next = polygon[(i + 1) % n];

    const A_i = signedTriangleArea(point, prev, curr);
    const A_i1 = signedTriangleArea(point, curr, next);
    
    // Compute weight for current vertex
    const weight = A_i * A_i1;
    weights[i] = weight;
    weightSum += weight;
  }

  // Normalize weights to get coordinates that sum to 1
  return weights.map(w => w / weightSum);
};

Polygon.pointFromWachspressCoords = (polygon: Polygon, coords: WachspressCoords): Point => {
  if (polygon.length !== coords.length) {
    throw new Error('Number of coordinates must match number of polygon vertices');
  }

  // Check if coordinates sum to approximately 1
  const sum = coords.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1) > 1e-10) {
    throw new Error('Wachspress coordinates must sum to 1');
  }

  // Compute weighted sum of vertices
  const point = { x: 0, y: 0 };
  for (let i = 0; i < polygon.length; i++) {
    point.x += coords[i] * polygon[i].x;
    point.y += coords[i] * polygon[i].y;
  }

  return point;
};

Polygon.ensureCounterclockwise = (polygon: Polygon): Polygon => {
  if (polygon.length < 3) return [...polygon];

  // Compute the signed area of the polygon
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    area += (polygon[j].x - polygon[i].x) * (polygon[j].y + polygon[i].y);
  }

  // If area is negative, polygon is clockwise, so reverse the points
  return area < 0 ? [...polygon].reverse() : polygon;
};

// Helper function to compute the signed area of a triangle
const signedTriangleArea = (a: Point, b: Point, c: Point): number => {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
};