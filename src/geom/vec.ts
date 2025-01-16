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

Vec.addS = (a: Vec, b: number): Vec => Vec(a.x + b, a.y + b);
Vec.subS = (a: Vec, b: number): Vec => Vec(a.x - b, a.y - b);
Vec.mulS = (a: Vec, b: number): Vec => Vec(a.x * b, a.y * b);
Vec.divS = (a: Vec, b: number): Vec => Vec(a.x / b, a.y / b);

Vec.cross = (a: Vec, b: Vec): number => a.x * b.y - a.y * b.x;

Vec.dot = (a: Vec, b: Vec): number => a.x * b.x + a.y * b.y;

Vec.project = (a: Vec, b: Vec): Vec => {
  const scalar = Vec.dot(a, b) / Vec.dot(b, b);
  return Vec.mul(b, scalar);
};

Vec.len = (a: Vec): number => Math.hypot(a.x, a.y);

Vec.dist = (a: Vec, b: Vec): number => Vec.len(Vec.sub(a, b));

Vec.lerp = (a: Vec, b: Vec, t: number): Vec =>
  Vec(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);

Vec.normalize = (a: Vec): Vec => Vec.divS(a, Vec.len(a));
Vec.normalDiff = (a: Vec, b: Vec, scale: number = 1): Vec =>
  Vec.mulS(Vec.normalize(Vec.sub(a, b)), scale);

Vec.avg = (a: Vec, b: Vec): Vec => Vec((a.x + b.x) / 2, (a.y + b.y) / 2);
