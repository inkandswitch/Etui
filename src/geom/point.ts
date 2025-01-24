import { StrokePoint } from "./strokepoint";

export type Point = {
  x: number;
  y: number;
};

export function Point(x: number, y: number): Point {
  return { x, y };
}

// reflect point a around point b
Point.reflect = (a: Point, b: Point): Point => {
  return Point(2 * b.x - a.x, 2 * b.y - a.y);
};

Point.fromStrokePoint = (sp: StrokePoint): Point => {
  return Point(sp.x, sp.y);
};

Point.clone = (p: Point): Point => {
  return Point(p.x, p.y);
};

Point.avg = (p: Array<Point>): Point => {
  const n = p.length;
  const sum = p.reduce((acc, point) => {
    acc.x += point.x;
    acc.y += point.y;
    return acc;
  }, { x: 0, y: 0 });

  return Point(sum.x / n, sum.y / n);
}