import { Point } from "../geom/point";
import { Vec } from "../geom/vec";
import Render, { stroke, fill } from "../render";
import StrokeManager from "../stroke-manager";

import {
  ParametricCurve,
  parametricCatmullRomSpline,
  closestPointOnCurve,
  curvePoints,
  insertCatmullRomControlPoint,
  tangentAtPointOnCurve,
} from "./geom/spline";

export default class Beam {
  strokemanager: StrokeManager;
  controlPoints: Array<Point>;
  strokeIds: Array<number>;
  beamCoordinates: Array<Array<BeamCoordinate>> = [];
  curve: ParametricCurve | null;

  constructor(strokemanager: StrokeManager) {
    this.strokemanager = strokemanager;

    this.controlPoints = [];
    this.curve = null;
    this.strokeIds = [];
  }

  addControlPoint(p: Point) {
    this.controlPoints.push(p);
    if (this.controlPoints.length > 1) {
      this.curve = parametricCatmullRomSpline(this.controlPoints);
    }
  }

  attachStrokes(strokeIds: Array<number>) {
    this.strokeIds = strokeIds;
    this.parameterize();
  }

  parameterize() {
    this.beamCoordinates = [];
    for (const strokeId of this.strokeIds) {
      const stroke = this.strokemanager.getStroke(strokeId);
      const beamCoordinates: Array<BeamCoordinate> = [];
      for (const point of stroke.points) {
        const t = closestPointOnCurve(this.curve!, point);
        const closest_point = this.curve!(t);
        const tangent = tangentAtPointOnCurve(this.curve!, t);
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
    // Update the curve points
    this.curve = parametricCatmullRomSpline(this.controlPoints);

    for (let i = 0; i < this.strokeIds.length; i++) {
      let stroke = this.strokemanager.getStroke(this.strokeIds[i]);
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

  insertControlPointNear(p: Point) {
    const t = closestPointOnCurve(this.curve!, p);
    this.controlPoints = insertCatmullRomControlPoint(this.controlPoints, t);
    this.curve = parametricCatmullRomSpline(this.controlPoints);
    this.parameterize();
  }

  updateStrokeIds(mappings: Map<number, Array<number>>) {
    for (let i = 0; i < this.strokeIds.length; i++) {
      const newIds = mappings.get(this.strokeIds[i]);
      if (newIds) {
        this.strokeIds.splice(i, 1, ...newIds);
      }
    }
    this.parameterize();
  }

  render(r: Render) {
    if (this.curve) {
      r.poly(curvePoints(this.curve), stroke("#0000FF30", 4), false);
      r.poly(curvePoints(this.curve), stroke("#FFFFFF90", 2), false);
    }

    for (const pt of this.controlPoints) {
      r.circle(pt.x, pt.y, 3, fill("#0000FF"));
    }
  }

  getClosestPointOnBeam(p: Point): Point {
    const t = closestPointOnCurve(this.curve!, p);
    return this.curve!(t);
  }
}

type BeamCoordinate = {
  t: number;
  u: number;
};
