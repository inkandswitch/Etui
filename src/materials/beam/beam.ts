import { Vec } from "../../geom/vec";
import { Point } from "../../geom/point";

import Render, { stroke } from "../../render";
import { Id } from "../id";
import { parametricLine } from "../../geom/curve";

export default class Beam {
  id: Id;
  controlPoints: Array<Id>;
  curvePoints: Array<Point>;

  constructor(pts: Array<Id>) {
    this.id = Id();
    this.controlPoints = pts;
    this.curvePoints = [];
  }

  replaceControlPoint(old: Id, replacement: Id) {
    let idx = this.controlPoints.indexOf(old);
    if (idx != -1) {
      this.controlPoints[idx] = replacement;
    }
  }

  updateCurve(points: Array<Point>) {
    this.curvePoints = points;
  }

  render(r: Render) {
    let [a, b] = this.curvePoints;
    r.line(a.x, a.y, b.x, b.y, stroke("#FF0000", 2));
  }

  // getBeamCoordinatesForPoint(p: Point): BeamCoordinate {
  //   let [a, b] = this.controlPoints;
  //   let ap = Vec.sub(p, a.point);
  //   let ab = Vec.sub(b.point, a.point);
  //   let ab_length = Vec.len(ab);
  //   let t = Vec.dot(ap, ab) / (ab_length * ab_length);
  //   // Calculate signed distance using cross product (negated for opposite convention)
  //   let signed_u =
  //     -Vec.cross(Vec.sub(p, a.point), Vec.sub(b.point, a.point)) / ab_length;
  //   return { t, u: signed_u };
  // }

  // getPointForBeamCoordinates(bc: BeamCoordinate): Point {
  //   let [a, b] = this.controlPoints;
  //   let ab = Vec.sub(b.point, a.point);
  //   let point_on_beam = Vec.add(a.point, Vec.mulS(ab, bc.t));
  //   let normal = Vec.normalize(Vec.rotate90(ab));
  //   return Vec.add(point_on_beam, Vec.mulS(normal, bc.u));
  // }
}

// export type BeamCoordinate = {
//   t: number;
//   u: number;
// };
