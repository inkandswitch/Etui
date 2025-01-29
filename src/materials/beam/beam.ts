import { Id } from "materials/id";
import { Point } from "geom/point";
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

  render(r: Render) {
    r.poly(this.pathPoints, stroke("#0000FF22", 6), false);
    r.poly(this.pathPoints, stroke("#FFFFFF88", 4), false);
  }
}
