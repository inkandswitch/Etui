import { Point } from "../geom/point";

export default class ControlPoint {
  point: Point;
  constructor(p: Point) {
    this.point = p;
  }

  move(p: Point) {
    this.point = p;
  }
}
