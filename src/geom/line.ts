import { Point } from "./point";

type Line = {
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
