import { Point } from "./point";

export type Line = {
  a: Point;
  b: Point;
};

export function Line(a: Point, b: Point): Line {
  return { a, b };
}

Line.intersect = (a: Line, b: Line, inf = false): Point | null => {
  // Line line intersection
  const x1 = a.a.x;
  const y1 = a.a.y;
  const x2 = a.b.x;
  const y2 = a.b.y;

  const x3 = b.a.x;
  const y3 = b.a.y;
  const x4 = b.b.x;
  const y4 = b.b.y;

  const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  // Use small epsilon for floating point comparison
  const EPSILON = 1e-10;
  if (Math.abs(d) < EPSILON) return null;

  const xi =
    ((x3 - x4) * (x1 * y2 - y1 * x2) - (x1 - x2) * (x3 * y4 - y3 * x4)) / d;
  const yi =
    ((y3 - y4) * (x1 * y2 - y1 * x2) - (y1 - y2) * (x3 * y4 - y3 * x4)) / d;

  // Check if intersection point lies on both line segments
  // Use small epsilon for boundary checks
  if (
    !inf &&
    (xi < Math.min(x1, x2) - EPSILON ||
      xi > Math.max(x1, x2) + EPSILON ||
      xi < Math.min(x3, x4) - EPSILON ||
      xi > Math.max(x3, x4) + EPSILON ||
      yi < Math.min(y1, y2) - EPSILON ||
      yi > Math.max(y1, y2) + EPSILON ||
      yi < Math.min(y3, y4) - EPSILON ||
      yi > Math.max(y3, y4) + EPSILON)
  ) {
    return null;
  }

  return Point(xi, yi);
};

// Return the offset of the intersection point on line a
// Intersections on the line segment are between 0 and 1
// Intersections outside the line segment are < 0 or > 1
Line.intersectOffset = (a: Line, b: Line): number | null => {
  const x1 = a.a.x;
  const y1 = a.a.y;
  const x2 = a.b.x;
  const y2 = a.b.y;

  const x3 = b.a.x;
  const y3 = b.a.y;
  const x4 = b.b.x;
  const y4 = b.b.y;

  // Calculate the denominator of the intersection point
  const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  // Check if lines are parallel (denominator is 0, or very close to 0)
  const EPSILON = 1e-10;
  if (Math.abs(denominator) < EPSILON) return null; // Lines are parallel or coincident

  // Calculate the intersection point using the parameter t
  const tNumerator = (x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4);
  const t = tNumerator / denominator;

  // Calculate the intersection point using the parameter u
  const uNumerator = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3));
  const u = uNumerator / denominator;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return t; // Percentage along the first line segment
  } else {
    return null; // Intersection is outside the line segment bounds
  }
};
