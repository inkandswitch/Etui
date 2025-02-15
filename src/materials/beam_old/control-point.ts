import { Point } from "geom/point";
import Render, { fill, fillAndStroke } from "render";
import { Id } from "materials/id";

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

  render(r: Render) {
    r.circle(
      this.point.x,
      this.point.y,
      6,
      fillAndStroke("#FFFFFF", "#00000033", 0.5),
    );
    r.circle(this.point.x, this.point.y, 4, fill("#8050FF"));
  }
}
