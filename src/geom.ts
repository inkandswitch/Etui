export type Point = {
  x: number;
  y: number;
};

export function Point(x: number, y: number): Point {
  return { x, y };
}

export type StrokePoint = {
  x: number;
  y: number;
  pressure: number;
  tilt_x: number;
  tilt_y: number;
};

export function StrokePoint(
  x: number,
  y: number,
  pressure: number,
  tilt_x: number,
  tilt_y: number,
): StrokePoint {
  return { x, y, pressure, tilt_x, tilt_y };
}

// Convert to weighted vector
StrokePoint.asNVec = (pt: StrokePoint): NVec =>
  NVec(pt.x, pt.y, pt.pressure, pt.tilt_x * 0.1, pt.tilt_y * 0.1);

StrokePoint.lerp = (a: StrokePoint, b: StrokePoint, t: number): StrokePoint => {
  return StrokePoint(
    a.x + (b.x - a.x) * t,
    a.y + (b.y - a.y) * t,
    a.pressure + (b.pressure - a.pressure) * t,
    a.tilt_x + (b.tilt_x - a.tilt_x) * t,
    a.tilt_y + (b.tilt_y - a.tilt_y) * t,
  );
};

export type Vec = {
  x: number;
  y: number;
};

export function Vec(x: number, y: number): Vec {
  return { x, y };
}

Vec.add = (a: Vec, b: Vec): Vec => Vec(a.x + b.x, a.y + b.y);
Vec.sub = (a: Vec, b: Vec): Vec => Vec(a.x - b.x, a.y - b.y);
Vec.mul = (a: Vec, b: number): Vec => Vec(a.x * b, a.y * b);
Vec.div = (a: Vec, b: number): Vec => Vec(a.x / b, a.y / b);

Vec.dot = (a: Vec, b: Vec): number => a.x * b.x + a.y * b.y;

Vec.project = (a: Vec, b: Vec): Vec => {
  const scalar = Vec.dot(a, b) / Vec.dot(b, b);
  return Vec.mul(b, scalar);
};

Vec.len = (a: Vec): number => Math.sqrt(a.x * a.x + a.y * a.y);

Vec.lerp = (a: Vec, b: Vec, t: number): Vec =>
  Vec(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);

// n dimensional vector
type NVec = Array<number>;

export function NVec(...values: number[]): NVec {
  return values;
}

// n dimensional vector functions
NVec.sub = (a: NVec, b: NVec): NVec => {
  if (a.length != b.length) {
    throw new Error("Vectors must have the same length");
  }

  return a.map((value, index) => value - b[index]);
};

NVec.dot = (a: NVec, b: NVec): number => {
  if (a.length != b.length) {
    throw new Error("Vectors must have the same length");
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
};

NVec.project = (a: NVec, b: NVec): NVec => {
  if (b.every((val) => val === 0)) {
    throw new Error("Cannot project onto a zero vector");
  }

  const scalar = NVec.dot(a, b) / NVec.dot(b, b);
  return b.map((value) => value * scalar);
};

NVec.magnitude = (a: NVec): number => Math.sqrt(NVec.dot(a, a));

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
