import { NVec } from "./nvec";

export type StrokePoint = {
  x: number;
  y: number;
  pressure: number;
  tilt_x: number;
  tilt_y: number;
  distance: number;
};

export function StrokePoint(
  x: number,
  y: number,
  pressure: number,
  tilt_x: number,
  tilt_y: number,
  distance: number,
): StrokePoint {
  return { x, y, pressure, tilt_x, tilt_y, distance };
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
    a.distance + (b.distance - a.distance) * t,
  );
};

StrokePoint.clone = (pt: StrokePoint): StrokePoint => {
  return StrokePoint(
    pt.x,
    pt.y,
    pt.pressure,
    pt.tilt_x,
    pt.tilt_y,
    pt.distance,
  );
};
