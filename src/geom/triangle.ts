import { Point } from "./point";

export type Triangle = {
  a: Point;
  b: Point;
  c: Point;
};

export function Triangle(a: Point, b: Point, c: Point): Triangle {
  return { a, b, c };
}

export type BarycentricCoords = {
  u: number;
  v: number;
  w: number;
};

export function BarycentricCoords(
  u: number,
  v: number,
  w: number,
): BarycentricCoords {
  return { u, v, w };
}

Triangle.area = (triangle: Triangle): number => {
  const { a, b, c } = triangle;
  return Math.abs(
    (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) / 2,
  );
};

Triangle.centroid = (triangle: Triangle): Point => {
  const { a, b, c } = triangle;
  return {
    x: (a.x + b.x + c.x) / 3,
    y: (a.y + b.y + c.y) / 3,
  };
};

Triangle.containsPoint = (triangle: Triangle, point: Point): boolean => {
  const { a, b, c } = triangle;

  const areaOrig = Triangle.area(triangle);
  const area1 = Triangle.area(Triangle(point, a, b));
  const area2 = Triangle.area(Triangle(point, b, c));
  const area3 = Triangle.area(Triangle(point, c, a));

  return Math.abs(areaOrig - (area1 + area2 + area3)) < 1e-10;
};

// Helper function to compute the signed area of a triangle
Triangle.signedTriangleArea = (a: Point, b: Point, c: Point): number => {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
};

Triangle.barycentricCoords = (
  triangle: Triangle,
  point: Point,
): BarycentricCoords => {
  const { a, b, c } = triangle;

  const v0 = { x: b.x - a.x, y: b.y - a.y };
  const v1 = { x: c.x - a.x, y: c.y - a.y };
  const v2 = { x: point.x - a.x, y: point.y - a.y };

  const d00 = v0.x * v0.x + v0.y * v0.y;
  const d01 = v0.x * v1.x + v0.y * v1.y;
  const d11 = v1.x * v1.x + v1.y * v1.y;
  const d20 = v2.x * v0.x + v2.y * v0.y;
  const d21 = v2.x * v1.x + v2.y * v1.y;

  const denom = d00 * d11 - d01 * d01;
  const v = (d11 * d20 - d01 * d21) / denom;
  const w = (d00 * d21 - d01 * d20) / denom;
  const u = 1.0 - v - w;

  return { u, v, w };
};

Triangle.pointFromBarycentricCoords = (
  triangle: Triangle,
  coords: BarycentricCoords,
): Point => {
  const { a, b, c } = triangle;
  const { u, v, w } = coords;

  return {
    x: u * a.x + v * b.x + w * c.x,
    y: u * a.y + v * b.y + w * c.y,
  };
};

Triangle.isPointInside = (triangle: Triangle, point: Point): boolean => {
  const coords = Triangle.barycentricCoords(triangle, point);
  return BarycentricCoords.isInside(coords);
};



BarycentricCoords.isInside = (coords: BarycentricCoords): boolean => {
  return coords.u >= 0 && coords.v >= 0 && coords.w >= 0;
};
