import { Point } from "geom/point";

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
    r.poly(this.pathPoints, stroke("#FF0000", 2));
  }
}
