import { Point } from "./point";

export function catmullRomSplinePoint(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number,
): Point {
  const t2 = t * t;
  const t3 = t2 * t;

  const x =
    0.5 *
    ((-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3 +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + p2.x) * t +
      2 * p1.x);

  const y =
    0.5 *
    ((-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3 +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + p2.y) * t +
      2 * p1.y);

  return { x, y };
}

export function catmullRomSpline(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  steps: number,
): Array<Point> {
  let spline = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let point = catmullRomSplinePoint(p0, p1, p2, p3, t);
    spline.push(point);
  }
  return spline;
}
