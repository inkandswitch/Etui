import { Point } from "./geom/point";
import { Vec } from "./geom/vec";
import Render, { stroke, fill } from "./render";
import Stroke from "./stroke";

import {
  catmullRomSplinePoint,
  closestPointOnCurve,
  curvePoints,
  parametricCatmullRomSpline,
  ParametricCurve,
  tangentAtPointOnCurve,
} from "./geom/spline";

export default class Beam {
  controlPoints: Array<Point>;
  stroke: Stroke;
  beamCoordinates: Array<BeamCoordinate>;
  curve: ParametricCurve;

  constructor(stroke: Stroke) {
    // Create four control points for the beam
    const b = Point.fromStrokePoint(stroke.points[0]);
    const c = Point.fromStrokePoint(stroke.points[stroke.points.length - 1]);
    const bc = Vec.sub(b, c);
    const a = Vec.add(b, bc);
    const d = Vec.sub(c, bc);

    this.controlPoints = [a, b, c, d];
    this.stroke = stroke;

    // Generate beam coordinates  (t, u) for each point on the stroke
    // t is the distance along the stroke normalized to 0-1
    // u is the distance perpendicular to the stroke

    this.beamCoordinates = [];

    // // Create vector for the beam
    // const beamvec = Vec.sub(this.controlPoints[1], this.controlPoints[0]);

    // for (const point of stroke.points) {
    //   const p = Point.fromStrokePoint(point);
    //   const vec = Vec.sub(p, this.controlPoints[0]);
    //   const t = Vec.dot(vec, beamvec) / Vec.dot(beamvec, beamvec);
    //   const u = Vec.cross(vec, beamvec) / Vec.len(beamvec);
    //   this.beamCoordinates.push({ t, u });
    // }

    this.curve = parametricCatmullRomSpline(a, b, c, d);
    for (const point of stroke.points) {
      const t = closestPointOnCurve(this.curve, point);
      const closest_point = this.curve(t);
      const tangent = tangentAtPointOnCurve(this.curve, t);
      const vec_to_point = Vec.sub(point, closest_point);
      const u = Math.sign(Vec.cross(vec_to_point, tangent)) * Vec.dist(point, closest_point);
      this.beamCoordinates.push({ t, u });
    }
  }

  update() {
    // Take the beam coordinates and use them to update the stroke points

    // for (let i = 0; i < this.stroke.points.length; i++) {
    //   const p = this.stroke.points[i];
    //   const bc = this.beamCoordinates[i];
    //   const beamvec = Vec.sub(this.controlPoints[1], this.controlPoints[0]);
    //   const beamvecnorm = Vec.normalize(beamvec);
    //   const beamvecperp = Vec(beamvecnorm.y, -beamvecnorm.x);

    //   const newpoint = Vec.add(
    //     this.controlPoints[0],
    //     Vec.add(Vec.mul(beamvec, bc.t), Vec.mul(beamvecperp, bc.u)),
    //   );
    //   p.x = newpoint.x;
    //   p.y = newpoint.y;
    // }

    // this.stroke.recomputeLengths();

    for (let i = 0; i < this.stroke.points.length; i++) {
      const stroke_point = this.stroke.points[i];
      const bc = this.beamCoordinates[i];

      const curvePoint = this.curve(bc.t);
      const curveTangent = tangentAtPointOnCurve(this.curve, bc.t);
      const perp = Vec(curveTangent.y, -curveTangent.x);
      const newPoint = Vec.add(curvePoint, Vec.mul(perp, bc.u));
      stroke_point.x = newPoint.x;
      stroke_point.y = newPoint.y;
    }

    this.stroke.recomputeLengths();
  }

  render(r: Render) {
    const points = curvePoints(this.curve);
    r.poly(points, stroke("#FF000055", 2), false);

    for (const pt of this.controlPoints) {
      r.circle(pt.x, pt.y, 5, fill("#FF0000"));
    }
  }
}

type BeamCoordinate = {
  t: number;
  u: number;
};
