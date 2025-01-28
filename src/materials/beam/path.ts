import {
  curvePoints,
  parametricLine,
  parametricArc,
  parametricCatmullRomSpline,
} from "geom/curve";
import { Point } from "geom/point";

const STEPS = 100;
export default interface Path {
  generatePoints(controls: Array<Point>): Array<Point>;
}

export class LinePath implements Path {
  generatePoints(controls: Array<Point>): Array<Point> {
    const p = parametricLine(controls[0], controls[1]);
    return curvePoints(p, STEPS);
  }
}

export class CirclePath implements Path {
  generatePoints(controls: Array<Point>): Array<Point> {
    const center = controls[0];
    const start = controls[1];

    // Calculate radius from center to start point
    const radius = Math.sqrt(
      Math.pow(start.x - center.x, 2) + Math.pow(start.y - center.y, 2),
    );

    // Calculate start and end angles
    const p = parametricArc(center, radius, 0, Math.PI * 2);
    return curvePoints(p, STEPS);
  }
}

export class CurvePath implements Path {
  generatePoints(controls: Array<Point>): Array<Point> {
    const p = parametricCatmullRomSpline(controls);
    return curvePoints(p, STEPS);
  }
}
