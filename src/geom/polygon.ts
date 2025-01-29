import { Point } from "./point";
import { Vec } from "./vec";
import { Line } from "./line";
import { Triangle } from "./triangle";

export type Polygon = Array<Point>;

// Statically check if the vertices are given in CCW order
// You can either use `ensureCounterclockwise` 
// or simply assert `as CCWPolygon` if you know what your doing.
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

    const A = Triangle.signedTriangleArea(prev, curr, next);
    const A_i = Triangle.signedTriangleArea(point, prev, curr);
    const A_i1 = Triangle.signedTriangleArea(point, curr, next);

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
    if (Triangle.signedTriangleArea(prev, curr, next) > 0) {
      reflexVertices.push(i);
    }
  }

  return reflexVertices;
};

Polygon.decompose = (polygon: CCWPolygon): Polygon[] => {
  const n = polygon.length;
  const reflexVertices = Polygon.getReflexVertices(polygon);

  // If polygon is already convex, return it as is
  if (reflexVertices.length === 0) {
    return [polygon];
  }

  // Track the best split we've found
  let bestSplit: { poly1: Polygon; poly2: Polygon } | null = null;
  let bestScore = Infinity;

  // Try to split from each reflex vertex
  for (const i of reflexVertices) {
    // Try to connect to every other vertex
    for (let j = 0; j < n; j++) {
      if (Math.abs(i - j) <= 1 || Math.abs(i - j) === n - 1) continue;

      if (Polygon.isDiagonalValid(polygon, i, j)) {
        // Build potential sub-polygons
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

        // Score this split based on how balanced the sub-polygons are
        const score = Math.abs(poly1.length - poly2.length);
        if (score < bestScore) {
          bestScore = score;
          bestSplit = { poly1, poly2 };
        }
      }
    }
  }

  // If we found a valid split, use it
  if (bestSplit) {
    return [
      ...Polygon.decompose(bestSplit.poly1 as CCWPolygon),
      ...Polygon.decompose(bestSplit.poly2 as CCWPolygon),
    ];
  }

  // If we can't find a valid diagonal, return the polygon as is
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

Polygon.getAllTriangles = (polygon: Polygon): Triangle[] => {
  const n = polygon.length;
  if (n < 3) return [];

  const triangles: Triangle[] = [];

  // Try all possible combinations of three vertices
  for (let i = 0; i < n - 2; i++) {
    for (let j = i + 1; j < n - 1; j++) {
      for (let k = j + 1; k < n; k++) {
        // Check if this forms a valid interior triangle
        if (isTriangleValid(polygon, i, j, k)) {
          triangles.push(Triangle(polygon[i], polygon[j], polygon[k]));
        }
      }
    }
  }

  return triangles;
};

/**
 * Helper function to check if a triangle formed by three vertex indices is valid
 */
const isTriangleValid = (
  polygon: Polygon,
  i: number,
  j: number,
  k: number,
): boolean => {
  // Get the triangle vertices
  const a = polygon[i];
  const b = polygon[j];
  const c = polygon[k];

  // Check if all three edges of the triangle are valid diagonals
  // (or polygon edges)
  if (
    !isEdgeValid(polygon, i, j) ||
    !isEdgeValid(polygon, j, k) ||
    !isEdgeValid(polygon, k, i)
  ) {
    return false;
  }

  // Compute the centroid of the triangle
  const centroid = {
    x: (a.x + b.x + c.x) / 3,
    y: (a.y + b.y + c.y) / 3,
  };

  // Check if the centroid is inside the polygon
  return Polygon.isPointInside(polygon, centroid);
};

/**
 * Helper function to check if an edge between two vertices is valid
 * (either a polygon edge or a valid diagonal)
 */
const isEdgeValid = (polygon: Polygon, i: number, j: number): boolean => {
  const n = polygon.length;

  // If indices are adjacent in the polygon, the edge is valid
  if (Math.abs(i - j) === 1 || Math.abs(i - j) === n - 1) {
    return true;
  }

  // Otherwise, check if it's a valid diagonal
  return Polygon.isDiagonalValid(polygon, i, j);
};

Polygon.offset = (polygon: CCWPolygon, distance: number): CCWPolygon => {
  const n = polygon.length;
  if (n < 3) return polygon;

  const result: Polygon = [];

  for (let i = 0; i < n; i++) {
    const prev = polygon[(i + n - 1) % n];
    const curr = polygon[i];
    const next = polygon[(i + 1) % n];


    // Calculate normalized vectors for both edges
    const v1 = Vec.sub(curr, prev);
    const v2 = Vec.sub(curr, next);

    const bisector = Vec.bisector(v1, v2);

    // Check if the angle is reflex
    const crossProduct = Vec.cross(v1, v2);
    const isReflex = crossProduct < 0;

    // If the angle is reflex, flip the direction of the bisector
    const adjustedBisector = isReflex ? Vec.mulS(bisector, -1) : bisector;

        
    result.push(Vec.add(curr, Vec.mulS(adjustedBisector, distance)));
  }

  return result as CCWPolygon;
};

Polygon.area = (polygon: Polygon): number => {
  const n = polygon.length;
  let area = 0;

  for (let i = 0; i < n; i++) {
    const { x: x1, y: y1 } = polygon[i];
    const { x: x2, y: y2 } = polygon[(i + 1) % n];
    area += x1 * y2 - x2 * y1;
  }

  return Math.abs(area) / 2;
};

Polygon.overlap = (polygon1: Polygon, polygon2: Polygon): boolean => {
  // Check if any vertex of polygon1 is inside polygon2
  for (const point of polygon1) {
    if (Polygon.isPointInside(polygon2, point)) {
      return true;
    }
  }

  // Check if any vertex of polygon2 is inside polygon1
  for (const point of polygon2) {
    if (Polygon.isPointInside(polygon1, point)) {
      return true;
    }
  }

  // Check if any edge of polygon1 intersects with any edge of polygon2
  const edges1 = polygon1.map((point, i) => [point, polygon1[(i + 1) % polygon1.length]]);
  const edges2 = polygon2.map((point, i) => [point, polygon2[(i + 1) % polygon2.length]]);

  for (const [p1, p2] of edges1) {
    for (const [q1, q2] of edges2) {
      if (Line.intersect(p1, p2, q1, q2)) {
        return true;
      }
    }
  }

  return false;
};
