import { Vec } from "../geom/vec";
import { Point } from "../geom/point";

import Render, { stroke } from "../render";
import ControlPoint from "./control-point";

export default class Beam {
  controlPoints: Array<ControlPoint>;

  constructor(pts: Array<ControlPoint>) {
    this.controlPoints = pts;
  }

  replaceControlPoint(old: ControlPoint, replacement: ControlPoint) {
    let idx = this.controlPoints.indexOf(old);
    if (idx != -1) {
      this.controlPoints[idx] = replacement;
    }
  }

  render(r: Render) {
    let [a, b] = this.controlPoints;
    r.line(a.point.x, a.point.y, b.point.x, b.point.y, stroke("blue", 3));
  }

  getBeamCoordinatesForPoint(p: Point): BeamCoordinate {
    let [a, b] = this.controlPoints;
    let ap = Vec.sub(p, a.point);
    let ab = Vec.sub(b.point, a.point);
    let ab_length = Vec.len(ab);
    let t = Vec.dot(ap, ab) / (ab_length * ab_length); 
    // Calculate signed distance using cross product (negated for opposite convention)
    let signed_u = -Vec.cross(Vec.sub(p, a.point), Vec.sub(b.point, a.point)) / ab_length;
    return { t, u: signed_u };
  }

  getPointForBeamCoordinates(bc: BeamCoordinate): Point {
  let [a, b] = this.controlPoints;
  let ab = Vec.sub(b.point, a.point);
  let point_on_beam = Vec.add(a.point, Vec.mulS(ab, bc.t));
  let normal = Vec.normalize(Vec.rotate90(ab));
  return Vec.add(point_on_beam, Vec.mulS(normal, bc.u));
  }
}

export type BeamCoordinate = {
  t: number;
  u: number;
};
