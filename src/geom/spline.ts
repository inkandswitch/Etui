import { Point } from "./point";
import { Vec } from "./vec";

export type ParametricCurve = (t: number) => Point;

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

export function parametricCatmullRomSpline(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
): (t: number) => Point {
  return (t: number) => catmullRomSplinePoint(p0, p1, p2, p3, t);
}

export function curvePoints(
  curve: ParametricCurve,
  steps: number = 100,
): Array<Point> {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push(curve(t));
  }
  return points;
}

// This method finds the closest point on a parametric curve to a given target point.
// It uses a ternary search algorithm to minimize the distance between the target point
// and points on the curve, which is defined by a parametric function. The search is
// performed within the interval [0, 1] and continues until the interval is smaller than
// a specified epsilon (1e-5). The method returns the point on the curve that is closest
// to the target point.

export function closestPointOnCurve(
  curve: ParametricCurve,
  target: Point,
): number {
  let left = 0;
  let right = 1;
  let closestT = 0;
  let minDist = Infinity;

  while (right - left > 1e-5) {
    // Calculate the initial midpoints by dividing the interval into three parts and taking the first and second thirds
    const mid1 = left + (right - left) / 3;
    const mid2 = right - (right - left) / 3;

    const point1 = curve(mid1);
    const point2 = curve(mid2);

    const dist1 = Vec.dist(point1, target);
    const dist2 = Vec.dist(point2, target);

    if (dist1 < dist2) {
      right = mid2;
    } else {
      left = mid1;
    }

    if (dist1 < minDist) {
      minDist = dist1;
      closestT = mid1;
    }
    if (dist2 < minDist) {
      minDist = dist2;
      closestT = mid2;
    }
  }

  return closestT;
}

export function tangentAtPointOnCurve(curve: ParametricCurve, t: number): Vec {
  const delta = 1e-5;
  const point1 = curve(t);
  const point2 = curve(t + delta);

  return Vec.normalize(Vec.sub(point2, point1));
}
