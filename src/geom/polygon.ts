import { Point } from "./point";
import { Line } from "./line";

export type Polygon = Array<Point>;
export type CCWPolygon = Array<Point> & { readonly __brand: unique symbol };

export function Polygon(points: Array<Point>): Polygon {
  return points;
}

// Assumption: The polygon is simple (does not intersect itself)
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

export type WachspressCoords = number[];

Polygon.wachspressCoords = (
  polygon: CCWPolygon,
  point: Point,
): WachspressCoords => {
  const n = polygon.length;
  const weights: number[] = new Array(n);
  let weightSum = 0;

  // Compute weights for each vertex
  for (let i = 0; i < n; i++) {
    const prev = polygon[(i + n - 1) % n];
    const curr = polygon[i];
    const next = polygon[(i + 1) % n];

    const A = signedTriangleArea(prev, curr, next);
    const A_i = signedTriangleArea(point, prev, curr);
    const A_i1 = signedTriangleArea(point, curr, next);

    // Compute weight for current vertex
    const weight = A / (A_i * A_i1);
    weights[i] = weight;
    weightSum += weight;
  }

  // Normalize weights to get coordinates that sum to 1
  return weights.map((w) => w / weightSum);
};

Polygon.pointFromWachspressCoords = (
  polygon: CCWPolygon,
  coords: WachspressCoords,
): Point => {
  if (polygon.length !== coords.length) {
    throw new Error(
      "Number of coordinates must match number of polygon vertices",
    );
  }

  // Check if coordinates sum to approximately 1
  const sum = coords.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1) > 1e-10) {
    throw new Error("Wachspress coordinates must sum to 1");
  }

  // Compute weighted sum of vertices
  const point = { x: 0, y: 0 };
  for (let i = 0; i < polygon.length; i++) {
    point.x += coords[i] * polygon[i].x;
    point.y += coords[i] * polygon[i].y;
  }

  return point;
};

Polygon.ensureCounterclockwise = (polygon: Polygon): CCWPolygon => {
  if (polygon.length < 3) return polygon as CCWPolygon;

  // Compute the signed area of the polygon
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    area += (polygon[j].x - polygon[i].x) * (polygon[j].y + polygon[i].y);
  }

  // If area is negative, polygon is clockwise, so reverse the points
  return (area < 0 ? [...polygon].reverse() : polygon) as CCWPolygon;
};

// Returns the indexes of the reflex vertexes
Polygon.getReflexVertices = (polygon: CCWPolygon): number[] => {
  const n = polygon.length;
  if (n < 3) return [];

  const reflexVertices: number[] = [];

  for (let i = 0; i < n; i++) {
    const prev = polygon[(i + n - 1) % n];
    const curr = polygon[i];
    const next = polygon[(i + 1) % n];

    // If the signed area is positive, the angle is reflex (> 180 degrees)
    if (signedTriangleArea(prev, curr, next) > 0) {
      reflexVertices.push(i);
    }
  }

  return reflexVertices;
};

// Helper function to compute the signed area of a triangle
const signedTriangleArea = (a: Point, b: Point, c: Point): number => {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
};

Polygon.decompose = (polygon: CCWPolygon): Polygon[] => {
  const n = polygon.length;
  const reflexVertices = Polygon.getReflexVertices(polygon);

  // If polygon is already convex, return it as is
  if (reflexVertices.length == 0) {
    return [polygon];
  }

  // Try to split from each reflex vertex
  for (const i of reflexVertices) {
    // Try to connect to every other vertex
    for (let j = 0; j < n; j++) {
      if (Math.abs(i - j) <= 1 || Math.abs(i - j) === n - 1) continue; // Skip adjacent vertices

      // Check if diagonal is valid (lies inside polygon and doesn't intersect edges)
      if (Polygon.isDiagonalValid(polygon, i, j)) {
        // Split polygon into two parts along the diagonal
        const poly1: Polygon = [];
        const poly2: Polygon = [];

        // Build first sub-polygon (from i to j)
        let k = i;
        while (k !== j) {
          poly1.push(polygon[k]);
          k = (k + 1) % n;
        }
        poly1.push(polygon[j]);

        // Build second sub-polygon (from j to i)
        k = j;
        while (k !== i) {
          poly2.push(polygon[k]);
          k = (k + 1) % n;
        }
        poly2.push(polygon[i]);

        // Recursively decompose the sub-polygons
        return [
          ...Polygon.decompose(poly1 as CCWPolygon),
          ...Polygon.decompose(poly2 as CCWPolygon),
        ];
      }
    }
  }

  // If we can't find a valid diagonal, return the polygon as is
  // (this shouldn't happen for simple polygons)
  return [polygon];
};

/**
 * Checks if a diagonal between vertices i and j is valid:
 * - Lies inside the polygon
 * - Doesn't intersect any edges
 */
Polygon.isDiagonalValid = (polygon: Polygon, i: number, j: number): boolean => {
  const n = polygon.length;
  const start = polygon[i];
  const end = polygon[j];

  // Check if diagonal lies inside the polygon
  const midpoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };
  if (!Polygon.isPointInside(polygon, midpoint)) {
    return false;
  }

  // Check for intersection with all non-adjacent edges
  for (let k = 0; k < n; k++) {
    const nextK = (k + 1) % n;

    // Skip edges that share vertices with the diagonal
    if (k === i || k === j || nextK === i || nextK === j) {
      continue;
    }

    if (
      Line.intersect({ a: start, b: end }, { a: polygon[k], b: polygon[nextK] })
    ) {
      return false;
    }
  }

  return true;
};
