import { Point } from "./point";
import { Vec } from "./vec";
import { Line } from "./line";
import { Triangle } from "./triangle";

export type Polygon = Array<Point>;

export function Polygon(points: Array<Point>): Polygon {
  return points;
}

// Statically check if the vertices are given in CCW order
// You can either use `ensureCounterclockwise`
// or simply assert `as CCWPolygon` if you know what your doing.
export type CCWPolygon = Array<Point> & { readonly __brand: unique symbol };
export function CCWPolygon(poly: Polygon): CCWPolygon {
  return Polygon.ensureCounterclockwise(poly);
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

  // For each vertex, compute the offset lines of its adjacent edges
  for (let i = 0; i < n; i++) {
    const prev = polygon[(i + n - 1) % n];
    const curr = polygon[i];
    const next = polygon[(i + 1) % n];

    // Get vectors for the two edges
    const v1 = Vec.sub(curr, prev);
    const v2 = Vec.sub(next, curr);

    // Get normalized normals (rotate90 gives us the normal pointing outward for CCW)
    const n1 = Vec.normalize(Vec.rotate90(v1));
    const n2 = Vec.normalize(Vec.rotate90(v2));

    // Create offset lines by moving the original edges outward
    const l1 = {
      a: Vec.add(prev, Vec.mulS(n1, distance)),
      b: Vec.add(curr, Vec.mulS(n1, distance)),
    };

    const l2 = {
      a: Vec.add(curr, Vec.mulS(n2, distance)),
      b: Vec.add(next, Vec.mulS(n2, distance)),
    };

    // Find intersection of the offset lines
    const intersection = Line.intersect(l1, l2, true);

    // If lines are parallel or nearly parallel, fall back to simple offset
    if (!intersection) {
      result.push(Vec.add(curr, Vec.mulS(n1, distance)));
    } else {
      result.push(intersection);
    }
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
  const edges1 = polygon1.map((point, i) => [
    point,
    polygon1[(i + 1) % polygon1.length],
  ]);
  const edges2 = polygon2.map((point, i) => [
    point,
    polygon2[(i + 1) % polygon2.length],
  ]);

  for (const [p1, p2] of edges1) {
    for (const [q1, q2] of edges2) {
      if (Line.intersect(p1, p2, q1, q2)) {
        return true;
      }
    }
  }

  return false;
};

Polygon.visibilityPolygon = (polygon: Polygon, point: Point): Polygon => {
  if (!Polygon.isPointInside(polygon, point)) {
    throw new Error("Viewpoint must be inside the polygon");
  }

  const n = polygon.length;
  const visibleVertices: Point[] = [];

  // Process each vertex of the polygon
  for (let i = 0; i < n; i++) {
    const vertex = polygon[i];
    const nextVertex = polygon[(i + 1) % n];

    // Check if the vertex is visible
    if (isVertexVisible(polygon, point, vertex, i)) {
      visibleVertices.push(vertex);
    }

    // Check if the edge intersects with any ray from the viewpoint
    const intersections = findEdgeIntersections(
      point,
      vertex,
      nextVertex,
      polygon,
    );
    visibleVertices.push(...intersections);
  }

  // Sort vertices by angle around the viewpoint
  const sortedVertices = visibleVertices.sort((a, b) => {
    const angleA = Math.atan2(a.y - point.y, a.x - point.x);
    const angleB = Math.atan2(b.y - point.y, b.x - point.x);
    return angleA - angleB;
  });

  return sortedVertices;
};

/**
 * Checks if a vertex is visible from a viewpoint
 */
const isVertexVisible = (
  polygon: Polygon,
  viewpoint: Point,
  vertex: Point,
  vertexIndex: number,
): boolean => {
  const n = polygon.length;
  const ray = { a: viewpoint, b: vertex };

  // Check against all edges except those adjacent to the vertex
  for (let i = 0; i < n; i++) {
    const nextI = (i + 1) % n;

    // Skip edges adjacent to the vertex
    if (i === vertexIndex || nextI === vertexIndex) continue;

    const edge = { a: polygon[i], b: polygon[nextI] };

    // If there's an intersection, the vertex is not visible
    if (Line.intersect(ray, edge)) return false;
  }

  return true;
};

/**
 * Finds intersection points between a view ray and a polygon edge
 */
const findEdgeIntersections = (
  viewpoint: Point,
  edgeStart: Point,
  edgeEnd: Point,
): Point[] => {
  const intersections: Point[] = [];
  const edge = { a: edgeStart, b: edgeEnd };

  // Get the angle range of the edge from the viewpoint
  const startAngle = Math.atan2(
    edgeStart.y - viewpoint.y,
    edgeStart.x - viewpoint.x,
  );
  const endAngle = Math.atan2(edgeEnd.y - viewpoint.y, edgeEnd.x - viewpoint.x);

  // Check a few angles in between for potential visibility changes
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = startAngle * (1 - t) + endAngle * t;

    // Create a ray at this angle
    const ray = {
      a: viewpoint,
      b: {
        x: viewpoint.x + Math.cos(angle) * 1000, // Use a large enough distance
        y: viewpoint.y + Math.sin(angle) * 1000,
      },
    };

    // Find the closest intersection point
    const intersection = Line.intersect(ray, edge);
    if (intersection) {
      intersections.push(intersection);
    }
  }

  return intersections;
};

Polygon.largestConvexContaining = (
  polygon: CCWPolygon,
  point: Point,
): CCWPolygon => {
  if (!Polygon.isPointInside(polygon, point)) {
    throw new Error("Point must be inside the polygon");
  }

  // Get all possible triangles in the polygon
  const triangles = Polygon.getAllTriangles(polygon);

  // Filter triangles that contain the point
  const containingTriangles = triangles.filter((triangle) =>
    Triangle.isPointInside(triangle, point),
  );

  if (containingTriangles.length === 0) {
    throw new Error("No valid triangles found containing the point");
  }

  // Start with the triangle containing the point that has the largest area
  let bestTriangle = containingTriangles.reduce((max, triangle) =>
    Triangle.area(triangle) > Triangle.area(max) ? triangle : max,
  );

  // Initialize result with the best triangle's vertices
  let result: Polygon = [bestTriangle.a, bestTriangle.b, bestTriangle.c];

  // Try to add more vertices to make the polygon larger while keeping it convex
  for (const vertex of polygon) {
    // Skip vertices already in the result
    if (result.some((p) => p.x === vertex.x && p.y === vertex.y)) continue;

    // Try adding the vertex at each possible position
    for (let i = 0; i <= result.length; i++) {
      const candidate = [...result.slice(0, i), vertex, ...result.slice(i)];

      // Check if adding this vertex creates a valid convex polygon
      // that lies inside the original polygon and contains the point
      if (isValidConvexSubPolygon(polygon, candidate as CCWPolygon, point)) {
        result = candidate;
        break;
      }
    }
  }

  return Polygon.ensureCounterclockwise(result);
};

/**
 * Helper function to check if a polygon is:
 * 1. Convex
 * 2. Inside the original polygon
 * 3. Contains the given point
 */
const isValidConvexSubPolygon = (
  originalPolygon: Polygon,
  candidate: CCWPolygon,
  point: Point,
): boolean => {
  // Check if the polygon is convex (no reflex vertices)
  if (Polygon.getReflexVertices(candidate).length > 0) {
    return false;
  }

  // Check if the point is inside the candidate polygon
  if (!Polygon.isPointInside(candidate, point)) {
    return false;
  }

  // Check if all vertices of the candidate are vertices of the original polygon
  for (const vertex of candidate) {
    if (!originalPolygon.some((p) => p.x === vertex.x && p.y === vertex.y)) {
      return false;
    }
  }

  // Check if any edge of the candidate intersects with the original polygon
  const n = candidate.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    if (
      !isEdgeValid(
        originalPolygon,
        originalPolygon.findIndex(
          (p) => p.x === candidate[i].x && p.y === candidate[i].y,
        ),
        originalPolygon.findIndex(
          (p) => p.x === candidate[j].x && p.y === candidate[j].y,
        ),
      )
    ) {
      return false;
    }
  }

  return true;
};

Polygon.centroid = (polygon: Polygon): Point => {
  const n = polygon.length;
  if (n < 3) throw new Error("Polygon must have at least 3 vertices");

  let area = 0;
  let center = Vec(0, 0);

  // Loop through all vertices
  for (let i = 0; i < n; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % n];

    // Compute signed area of triangle formed with origin
    const crossProduct = Vec.cross(p1, p2);
    area += crossProduct;

    // Accumulate weighted centroid coordinates
    center = Vec.add(center, Vec.mulS(Vec.add(p1, p2), crossProduct));
  }

  // Complete the area calculation
  area /= 2;

  // Compute final centroid coordinates
  return Vec.divS(center, 6 * area);
};

// WACHSPRESS COORDS
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

Polygon.findInscribedConvexWithPoint = (
  polygon: CCWPolygon,
  point: Point,
  k: number = 1
): CCWPolygon => {
  if (!Polygon.isPointInside(polygon, point)) {
    throw new Error("Point must be inside the polygon");
  }

  // Step 1: Identify convex and concave vertices
  const reflexVertices = new Set(Polygon.getReflexVertices(polygon));
  const convexVertices = polygon.filter((_, i) => !reflexVertices.has(i));

  // Step 2: Find k-nearest convex vertices to point A
  const sortedByDistance = [...convexVertices].sort(
    (a, b) => Vec.dist(point, a) - Vec.dist(point, b)
  );
  let currentPolygon = sortedByDistance.slice(0, k) as CCWPolygon;

  // Ensure the initial polygon contains the point
  while (!Polygon.isPointInside(currentPolygon, point) && k < sortedByDistance.length) {
    currentPolygon = sortedByDistance.slice(0, ++k) as CCWPolygon;
  }

  if (!Polygon.isPointInside(currentPolygon, point)) {
    throw new Error("Could not find initial convex polygon containing point");
  }

  // Step 3: Try to add remaining convex vertices
  for (const vertex of convexVertices) {
    // Skip vertices already in the polygon
    if (currentPolygon.some(v => v.x === vertex.x && v.y === vertex.y)) continue;

    // Try adding the vertex at each possible position
    for (let i = 0; i <= currentPolygon.length; i++) {
      const candidate = [
        ...currentPolygon.slice(0, i),
        vertex,
        ...currentPolygon.slice(i)
      ];

      // Check if adding this vertex maintains a valid convex polygon
      if (isValidConvexSubPolygon(polygon, candidate as CCWPolygon, point)) {
        currentPolygon = candidate as CCWPolygon;
        break;
      }
    }
  }

  // Step 4: Ensure convexity and containment
  const convexHull = computeConvexHull(currentPolygon);
  
  // Verify the convex hull is still contained in the original polygon
  // and contains the point
  if (
    isPolygonContained(convexHull, polygon) &&
    Polygon.isPointInside(convexHull, point)
  ) {
    return convexHull;
  }

  return currentPolygon;
};

/**
 * Compute the convex hull of a set of points using Graham Scan
 */
const computeConvexHull = (points: Point[]): CCWPolygon => {
  if (points.length < 3) return points as CCWPolygon;

  // Find point with lowest y-coordinate (and leftmost if tied)
  const start = points.reduce((min, p) => 
    p.y < min.y || (p.y === min.y && p.x < min.x) ? p : min
  );

  // Sort points by polar angle with respect to start point
  const sorted = points
    .filter(p => p !== start)
    .sort((a, b) => {
      const angleA = Math.atan2(a.y - start.y, a.x - start.x);
      const angleB = Math.atan2(b.y - start.y, b.x - start.x);
      return angleA - angleB;
    });

  // Initialize hull with start point and first two sorted points
  const hull = [start, sorted[0]];
  
  // Process remaining points
  for (let i = 1; i < sorted.length; i++) {
    while (
      hull.length >= 2 &&
      !isLeftTurn(
        hull[hull.length - 2],
        hull[hull.length - 1],
        sorted[i]
      )
    ) {
      hull.pop();
    }
    hull.push(sorted[i]);
  }

  return hull as CCWPolygon;
};

/**
 * Helper function to check if three points make a left turn
 */
const isLeftTurn = (p1: Point, p2: Point, p3: Point): boolean => {
  return (
    (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x) > 0
  );
};

/**
 * Check if polygon A is completely contained within polygon B
 */
const isPolygonContained = (polyA: Polygon, polyB: Polygon): boolean => {
  // Check if all vertices of A are inside B
  return polyA.every(point => Polygon.isPointInside(polyB, point));
};

Polygon.visibleWachspressCoords = (
  polygon: CCWPolygon,
  point: Point,
): (number | null)[] => {
  const n = polygon.length;
  const result: (number | null)[] = new Array(n).fill(null);
  
  // First pass: create a reduced polygon of only visible vertices
  const visibleIndices: number[] = [];
  const visibleVertices: Point[] = [];
  
  for (let i = 0; i < n; i++) {
    if (isVertexVisible(polygon, point, polygon[i], i)) {
      visibleIndices.push(i);
      visibleVertices.push(polygon[i]);
    }
  }

  // If we have fewer than 3 visible vertices, we can't compute coordinates
  if (visibleVertices.length < 3) {
    return result;
  }

  // Second pass: compute Wachspress coordinates for the reduced polygon
  const reducedPolygon = visibleVertices as CCWPolygon;
  const coords = Polygon.wachspressCoords(reducedPolygon, point);

  // Map the coordinates back to the original polygon indices
  for (let i = 0; i < visibleIndices.length; i++) {
    result[visibleIndices[i]] = coords[i];
  }

  return result;
};

Polygon.pointFromVisibleWachspressCoords = (
  polygon: CCWPolygon,
  coords: (number | null)[],
): Point => {
  if (polygon.length !== coords.length) {
    throw new Error(
      "Number of coordinates must match number of polygon vertices",
    );
  }

  // Compute weighted sum of vertices
  const point = { x: 0, y: 0 };
  let weightSum = 0;

  for (let i = 0; i < polygon.length; i++) {
    if (coords[i] !== null) {
      point.x += coords[i]! * polygon[i].x;
      point.y += coords[i]! * polygon[i].y;
      weightSum += coords[i]!;
    }
  }

  if (weightSum === 0) {
    throw new Error("Sum of visible Wachspress coordinates must not be zero");
  }

  // Normalize the point by the sum of the weights
  point.x /= weightSum;
  point.y /= weightSum;

  return point;
};

export type MeanValueCoords = number[];

Polygon.meanValueCoords = (polygon: Polygon, point: Point): MeanValueCoords => {
  const n = polygon.length;
  const weights: number[] = new Array(n);
  let weightSum = 0;

  // Compute weights for each vertex
  for (let i = 0; i < n; i++) {
    const curr = polygon[i];
    const prev = polygon[(i + n - 1) % n];
    const next = polygon[(i + 1) % n];

    // Get vectors from point to vertices
    const r_i = Vec.sub(curr, point);
    const r_prev = Vec.sub(prev, point);
    const r_next = Vec.sub(next, point);

    // Get lengths of vectors
    const len_i = Vec.len(r_i);
    const len_prev = Vec.len(r_prev);
    const len_next = Vec.len(r_next);

    // Skip if point coincides with vertex
    if (len_i < 1e-10) {
      return new Array(n).fill(0).map((_, j) => (j === i ? 1 : 0));
    }

    // Compute angles
    const alpha = Math.acos(Vec.dot(r_prev, r_i) / (len_prev * len_i));
    const beta = Math.acos(Vec.dot(r_i, r_next) / (len_i * len_next));

    // Compute weight
    const weight = (Math.tan(alpha / 2) + Math.tan(beta / 2)) / len_i;
    weights[i] = weight;
    weightSum += weight;
  }

  // Normalize weights to get coordinates that sum to 1
  return weights.map(w => w / weightSum);
};

Polygon.pointFromMeanValueCoords = (
  polygon: Polygon,
  coords: MeanValueCoords
): Point => {
  if (polygon.length !== coords.length) {
    throw new Error("Number of coordinates must match number of polygon vertices");
  }

  // Check if coordinates sum to approximately 1
  const sum = coords.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1) > 1e-10) {
    throw new Error("Mean value coordinates must sum to 1");
  }

  // Compute weighted sum of vertices
  return polygon.reduce(
    (point, vertex, i) => Vec.add(point, Vec.mulS(vertex, coords[i])),
    Vec(0, 0)
  );
};

Polygon.visibleMeanValueCoords = (
  polygon: CCWPolygon,
  point: Point,
): (number | null)[] => {
  const n = polygon.length;
  const result: (number | null)[] = new Array(n).fill(null);
  
  // First pass: identify visible vertices
  const visibleIndices: number[] = [];
  const visibleVertices: Point[] = [];
  
  for (let i = 0; i < n; i++) {
    if (isVertexVisible(polygon, point, polygon[i], i)) {
      visibleIndices.push(i);
      visibleVertices.push(polygon[i]);
    }
  }

  // If we have fewer than 2 visible vertices, we can't compute meaningful coordinates
  if (visibleVertices.length < 2) {
    return result;
  }

  // Second pass: compute mean value coordinates for visible vertices
  const weights: number[] = new Array(visibleVertices.length);
  let weightSum = 0;

  for (let i = 0; i < visibleVertices.length; i++) {
    const curr = visibleVertices[i];
    const prev = visibleVertices[(i + visibleVertices.length - 1) % visibleVertices.length];
    const next = visibleVertices[(i + 1) % visibleVertices.length];

    // Get vectors from point to vertices
    const r_i = Vec.sub(curr, point);
    const r_prev = Vec.sub(prev, point);
    const r_next = Vec.sub(next, point);

    // Get lengths of vectors
    const len_i = Vec.len(r_i);
    const len_prev = Vec.len(r_prev);
    const len_next = Vec.len(r_next);

    // Skip if point coincides with vertex
    if (len_i < 1e-10) {
      const finalResult = new Array(n).fill(null);
      finalResult[visibleIndices[i]] = 1;
      return finalResult;
    }

    // Compute angles
    const alpha = Math.acos(Vec.dot(r_prev, r_i) / (len_prev * len_i));
    const beta = Math.acos(Vec.dot(r_i, r_next) / (len_i * len_next));

    // Compute weight
    const weight = (Math.tan(alpha / 2) + Math.tan(beta / 2)) / len_i;
    weights[i] = weight;
    weightSum += weight;
  }

  // Normalize weights and assign to visible vertices
  for (let i = 0; i < visibleVertices.length; i++) {
    result[visibleIndices[i]] = weights[i] / weightSum;
  }

  return result;
};

Polygon.pointFromVisibleMeanValueCoords = (
  polygon: CCWPolygon,
  coords: (number | null)[],
): Point => {
  if (polygon.length !== coords.length) {
    throw new Error(
      "Number of coordinates must match number of polygon vertices",
    );
  }

  // Compute weighted sum of vertices
  const point = { x: 0, y: 0 };
  let weightSum = 0;

  for (let i = 0; i < polygon.length; i++) {
    if (coords[i] !== null) {
      point.x += coords[i]! * polygon[i].x;
      point.y += coords[i]! * polygon[i].y;
      weightSum += coords[i]!;
    }
  }

  if (Math.abs(weightSum) < 1e-10) {
    throw new Error("Sum of visible mean value coordinates must not be zero");
  }

  // Normalize the point by the sum of the weights
  point.x /= weightSum;
  point.y /= weightSum;

  return point;
};