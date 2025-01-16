import { Point } from "./geom/point";
import { Vec } from "./geom/vec";
import Render, { stroke, fill } from "./render";
import Stroke from "./stroke";

import {
  parametricCatmullRomSpline,
  closestPointOnCurve,
  curvePoints,
  joinCurves,
  parametricCatmullRom,
  ParametricCurve,
  tangentAtPointOnCurve,
} from "./geom/spline";

export default class Beam {
  controlPoints: Array<Point>;
  strokes: Array<Stroke>;
  beamCoordinates: Array<Array<BeamCoordinate>>;
  curve: ParametricCurve;

  constructor(strokes: Array<Stroke>) {
    // Create four control points for the beam
    const a = Point.fromStrokePoint(strokes[0].points[0]);
    const b = Point.fromStrokePoint(
      strokes[0].getPointAtLength(strokes[0].length * 0.33),
    );
    const c = Point.fromStrokePoint(
      strokes[0].getPointAtLength(strokes[0].length * 0.66),
    );
    const d = Point.fromStrokePoint(
      strokes[0].points[strokes[0].points.length - 1],
    );

    this.controlPoints = [a, b, c, d];
    this.curve = parametricCatmullRomSpline(this.controlPoints);
    // const ext_a = Vec.sub(a, Vec.sub(a, b));
    // const ext_c = Vec.sub(c, Vec.sub(c, b));

    this.strokes = strokes;

    // Generate beam coordinates  (t, u) for each point on the stroke
    // t is the distance along the stroke normalized to 0-1
    // u is the distance perpendicular to the stroke

    // // Create vector for the beam
    // const beamvec = Vec.sub(this.controlPoints[1], this.controlPoints[0]);

    // for (const point of stroke.points) {
    //   const p = Point.fromStrokePoint(point);
    //   const vec = Vec.sub(p, this.controlPoints[0]);
    //   const t = Vec.dot(vec, beamvec) / Vec.dot(beamvec, beamvec);
    //   const u = Vec.cross(vec, beamvec) / Vec.len(beamvec);
    //   this.beamCoordinates.push({ t, u });
    // }

    this.beamCoordinates = [];
    for (const stroke of strokes) {
      const beamCoordinates: Array<BeamCoordinate> = [];
      for (const point of stroke.points) {
        const t = closestPointOnCurve(this.curve, point);
        const closest_point = this.curve(t);
        const tangent = tangentAtPointOnCurve(this.curve, t);
        const vec_to_point = Vec.sub(point, closest_point);
        const u =
          Math.sign(Vec.cross(vec_to_point, tangent)) *
          Vec.dist(point, closest_point);
        beamCoordinates.push({ t, u });
      }
      this.beamCoordinates.push(beamCoordinates);
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

    // Update the curve points
    this.curve = parametricCatmullRomSpline(this.controlPoints);

    for (let i = 0; i < this.strokes.length; i++) {
      let stroke = this.strokes[i];
      for (let j = 0; j < stroke.points.length; j++) {
        const stroke_point = stroke.points[j];
        const bc = this.beamCoordinates[i][j];

        const curvePoint = this.curve(bc.t);
        const curveTangent = tangentAtPointOnCurve(this.curve, bc.t);
        const perp = Vec(curveTangent.y, -curveTangent.x);
        const newPoint = Vec.add(curvePoint, Vec.mul(perp, bc.u));
        stroke_point.x = newPoint.x;
        stroke_point.y = newPoint.y;
      }

      stroke.recomputeLengths();
    }
  }

  render(r: Render) {
    const points = curvePoints(this.curve);
    r.poly(points, stroke("#FF000010", 2), false);

    for (const pt of this.controlPoints) {
      r.circle(pt.x, pt.y, 5, fill("#FF0000"));
    }
  }
}

type BeamCoordinate = {
  t: number;
  u: number;
};
