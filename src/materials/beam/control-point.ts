import { Id } from "materials/id";
import { Point } from "geom/point";
import Render, { fill, fillAndStroke, font } from "render";

export default class ControlPoint {
  id: Id;
  point: Point;

  edgePoint: boolean = false;
  constructionPoint: boolean = false;

  beams: Array<Id> = [];
  // TODO: intersection point

  constructor(p: Point) {
    this.id = Id();
    this.point = Point.clone(p);
  }

  move(p: Point) {
    this.point.x = p.x;
    this.point.y = p.y;
  }

  addBeam(id: Id) {
    if (!this.beams.includes(id)) {
      this.beams.push(id);
    }
  }

  render(r: Render) {
    r.circle(
      this.point.x,
      this.point.y,
      6,
      fillAndStroke("#FFFFFF", "#00000033", 0.5),
    );
    r.circle(this.point.x, this.point.y, 4, fill("#8050FF"));

    r.text(
      this.id,
      this.point.x + 5,
      this.point.y - 5,
      font("10px monospace", "#8050FF"),
    );
  }
}
