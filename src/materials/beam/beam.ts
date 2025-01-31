import { Id } from "materials/id";
import { Point } from "geom/point";
import { Line } from "geom/line";
import { Vec } from "geom/vec";

import Render, { stroke } from "render";

export default class Beam {
  id: Id;
  controlPoints: Array<Id> = [];

  pathPoints: Array<Point> = [];

  constructor(pts: Array<Id>) {
    this.id = Id();
    this.controlPoints = pts;
  }

  replaceControlPoint(old: Id, replacement: Id) {
    let idx = this.controlPoints.indexOf(old);
    if (idx != -1) {
      this.controlPoints[idx] = replacement;
    }
  }

  updatePath(ctrl: Array<Point>) {
    this.pathPoints = ctrl;
  }

  closestPointOnBeam(p: Point): Point | null {
    if (this.pathPoints.length < 2) return null;

    let closestPoint: Point | null = null;
    let minDistance = Infinity;

    // Check each segment of the beam
    for (let i = 0; i < this.pathPoints.length - 1; i++) {
      const segment = Line(this.pathPoints[i], this.pathPoints[i + 1]);
      const projection = Line.projectPoint(segment, p);

      // If projection.t is between 0 and 1, the closest point is on this segment
      if (projection.t >= 0 && projection.t <= 1) {
        const pointOnSegment = Line.pointAtT(segment, projection.t);
        const distance = Vec.dist(p, pointOnSegment);

        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = pointOnSegment;
        }
      } else {
        if(projection.t < 0) {
          return this.pathPoints[0]
        } else {
          return this.pathPoints[1];
        }
      }
    }

    return closestPoint;
  }

  getInfluence(p: Point): BeamInfluence {
    const segment = Line(this.pathPoints[0], this.pathPoints[1]);
    const projection = Line.projectPoint(segment, p);
    return {
      id: this.id,
      offset: projection.t,
      signed_distance: projection.u,
    };
  }

  pointFromInfluence(influence: BeamInfluence): Point {
    const segment = Line(this.pathPoints[0], this.pathPoints[1]);
    return Line.deprojectPoint(segment, {
      t: influence.offset,
      u: influence.signed_distance,
    });
  }

  influencePoint(influence: BeamInfluence): Point {
    const segment = Line(this.pathPoints[0], this.pathPoints[1]);
    return Line.pointAtT(segment, influence.offset);
  }

  render(r: Render) {
    r.poly(this.pathPoints, stroke("#0000FF22", 6), false);
    r.poly(this.pathPoints, stroke("#FFFFFF88", 4), false);
  }
}

export type BeamInfluence = {
  id: Id;
  offset: number;
  signed_distance: number;
};
