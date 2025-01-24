import { Point } from "geom/point";
import { Vec } from "geom/vec";

import Render, { stroke } from "render";
import { Id } from "materials/id";
import Path from "./path";

export default class Beam {
  id: Id;
  controlPoints: Array<Id>;

  path: Path;
  pathPoints: Array<Point>;

  constructor(pts: Array<Id>, path: Path) {
    this.id = Id();
    this.controlPoints = pts;
    this.pathPoints = [];
    this.path = path;
  }

  addControlPoint(id: Id) {
    this.controlPoints.push(id);
  }

  replaceControlPoint(old: Id, replacement: Id) {
    let idx = this.controlPoints.indexOf(old);
    if (idx != -1) {
      this.controlPoints[idx] = replacement;
    }
  }

  updatePath(ctrl: Array<Point>) {
    this.pathPoints = this.path.generatePoints(ctrl);
  }

  render(r: Render) {
    r.poly(this.pathPoints, stroke("#0000FF22", 6), false);
    r.poly(this.pathPoints, stroke("#FFFFFF88", 4), false);
  }

  getClosestPointOnBeam(p: Point): Point {
    let closest = this.pathPoints[0];
    let closestDist = Vec.dist(p, closest);

    // Check each line segment
    for (let i = 0; i < this.pathPoints.length - 1; i++) {
      const p1 = this.pathPoints[i];
      const p2 = this.pathPoints[i + 1];
      
      // Calculate closest point on line segment
      const segment = Vec.sub(p2, p1);
      const t = Math.max(0, Math.min(1, Vec.dot(Vec.sub(p, p1), segment) / Vec.dot(segment, segment)));
      const projection = Vec.add(p1, Vec.mulS(segment, t));
      
      const dist = Vec.dist(p, projection);
      if (dist < closestDist) {
        closest = projection;
        closestDist = dist;
      }
    }
    return closest;
  }
}
