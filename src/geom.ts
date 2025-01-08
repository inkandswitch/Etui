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

export type PolarVec = {
  magnitude: number;
  angle: number;
};

export function PolarVec(magnitude: number, angle: number): PolarVec {
  return { magnitude, angle };
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
