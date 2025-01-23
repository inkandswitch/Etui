import { Point } from "../../geom/point";
import { Id } from "../id";

export default class ControlPoint {
  id: Id;
  point: Point;
  beams: Array<Id>;

  constructor(p: Point) {
    this.id = Id();
    this.point = Point.clone(p);
    this.beams = [];
  }

  addBeam(id: Id) {
    this.beams.push(id);
  }

  move(p: Point) {
    this.point.x = p.x;
    this.point.y = p.y;
  }
}
