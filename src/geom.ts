export type Point = {
  x: number;
  y: number;
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
