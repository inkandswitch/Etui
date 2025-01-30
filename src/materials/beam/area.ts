import { Id } from "materials/id";
import { Point } from "geom/point";
import { CCWPolygon, Polygon } from "geom/polygon";
import Render, { fill, font } from "render";

export default class Area {
  id: Id;
  stamp: string; // Uniquely identify an area by it's controlpoints

  controlPoints: Array<Id> = [];

  polyPoints: CCWPolygon = CCWPolygon([]);
  midPoint: Point = Point(0, 0);

  constructor(pts: Array<Id>) {
    this.id = Id();
    this.controlPoints = pts;
    this.stamp = generateAreaStamp(this.controlPoints);
  }

  updatePath(ctrl: Array<Point>) {
    this.polyPoints = CCWPolygon(ctrl);
    this.midPoint = Polygon.centroid(this.polyPoints);
  }

  render(r: Render) {
    const inset = Polygon.offset(this.polyPoints, -10);
    r.poly(inset, fill("#0000FF10"), true);

    r.circle(this.midPoint.x, this.midPoint.y, 2, fill("#8050FF"));

    r.text(
      this.id,
      this.midPoint.x + 5,
      this.midPoint.y - 5,
      font("10px monospace", "#8050FF"),
    );
  }
}

export function generateAreaStamp(ids: Array<Id>): string {
  return [...ids].sort().join("-");
}
