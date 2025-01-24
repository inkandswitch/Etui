import { Point } from "./point";
import { Vec } from "./vec";

export type ParametricCurve = (t: number) => Point;

// --- CURVES ---
export function parametricLine(p0: Point, p1: Point): (t: number) => Point {
  return (t: number) => {
    const x = p0.x + t * (p1.x - p0.x);
    const y = p0.y + t * (p1.y - p0.y);
    return { x, y };
  };
}

export function parametricArc(
  center: Point,
  radius: number,
  startAngle: number,
  endAngle: number,
): (t: number) => Point {
  return (t: number) => {
    const angle = startAngle + t * (endAngle - startAngle);
    const x = center.x + radius * Math.cos(angle);
    const y = center.y + radius * Math.sin(angle);
    return { x, y };
  };
}

export function parametricCatmullRom(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
): (t: number) => Point {
  return (t: number) => catmullRomPoint(p0, p1, p2, p3, t);
}

export function parametricCatmullRomSpline(
  points: Array<Point>,
): ParametricCurve {
  if (points.length < 2) {
    throw new Error("At least 2 points are required to create a spline");
  }

  // Create artificial end points by mirroring
  const p0 = {
    x: 2 * points[0].x - points[1].x,
    y: 2 * points[0].y - points[1].y,
  };

  const pLast = {
    x: 2 * points[points.length - 1].x - points[points.length - 2].x,
    y: 2 * points[points.length - 1].y - points[points.length - 2].y,
  };

  // If we only have 2 points, create a simple curve with mirrored control points
  if (points.length === 2) {
    return parametricCatmullRom(p0, points[0], points[1], pLast);
  }

  // Create segments and join them
  const segments: Array<ParametricCurve> = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = i === 0 ? p0 : points[i - 1];
    const p2 = points[i];
    const p3 = points[i + 1];
    const p4 = i === points.length - 2 ? pLast : points[i + 2];

    segments.push(parametricCatmullRom(p1, p2, p3, p4));
  }

  // Join all segments
  return joinCurves(segments);
}

// --- UTILITY ---

export function catmullRomPoint(
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

export function insertCatmullRomControlPoint(
  points: Array<Point>,
  t: number,
): Array<Point> {
  if (points.length < 2) {
    throw new Error("At least 2 points are required to create a spline");
  }

  // Create the spline and find the point at t
  const spline = parametricCatmullRomSpline(points);
  const newPoint = spline(t);

  // Find which segment the point falls into
  const n = points.length - 1;
  const segmentLength = 1 / n;
  const segmentIndex = Math.floor(t / segmentLength);

  // Create new array with inserted point
  const newPoints = [...points];
  newPoints.splice(segmentIndex + 1, 0, newPoint);

  return newPoints;
}

// Splining
export function joinCurves(curves: ParametricCurve[]): ParametricCurve {
  return (t: number) => {
    const n = curves.length;
    const segmentLength = 1 / n;
    const segmentIndex = Math.floor(t / segmentLength);
    const localT = (t - segmentIndex * segmentLength) / segmentLength;

    if (segmentIndex >= n) {
      return curves[n - 1](1);
    }

    return curves[segmentIndex](localT);
  };
}

// Generic curve functions
export function curvePoints(
  curve: ParametricCurve,
  steps: number = 100,
): Array<Point> {
  const points: Array<Point> = [];
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
