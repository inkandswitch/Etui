import { curvePoints, parametricLine, parametricArc } from "geom/curve";
import { Point } from "geom/point";

const STEPS = 10;
export default interface Path {
  generatePoints(controls: Array<Point>): Array<Point>;
}

export class LinePath implements Path {
  generatePoints(controls: Array<Point>): Array<Point> {
    if (controls.length != 2) {
      throw Error("Line curve requires exactly 2 control points");
    }

    const p = parametricLine(controls[0], controls[1]);
    return curvePoints(p, STEPS);
  }
}

export class ArcPath implements Path {
  generatePoints(controls: Array<Point>): Array<Point> {
    if (controls.length != 3) {
      throw Error(
        "Arc curve requires exactly 3 control points: center, start, and end",
      );
    }

    const center = controls[0];
    const start = controls[1];
    const end = controls[2];

    // Calculate radius from center to start point
    const radius = Math.sqrt(
      Math.pow(start.x - center.x, 2) + Math.pow(start.y - center.y, 2),
    );

    // Calculate start and end angles
    const startAngle = Math.atan2(start.y - center.y, start.x - center.x);
    const endAngle = Math.atan2(end.y - center.y, end.x - center.x);

    const p = parametricArc(center, radius, startAngle, endAngle);
    return curvePoints(p, STEPS);
  }
}
