import Render, { fillAndStroke } from "./render";
import { Point } from "./geom/point";
import { Polygon } from "./geom/polygon";
import { Line } from "./geom/line";
import Stroke from "./stroke";

export default class Query {
  topLeft: Point;
  bottomRight: Point;
  hull: Array<Point> = [];

  constructor(topLeft: Point, bottomRight: Point) {
    this.topLeft = topLeft;
    this.bottomRight = bottomRight;
    this.hull = [
      topLeft,
      Point(bottomRight.x, topLeft.y),
      bottomRight,
      Point(topLeft.x, bottomRight.y),
    ];
  }

  updateBottomRight(bottomRight: Point) {
    this.bottomRight = bottomRight;
    this.hull = [
      this.topLeft,
      Point(bottomRight.x, this.topLeft.y),
      bottomRight,
      Point(this.topLeft.x, bottomRight.y),
    ];
  }

  queryStroke(stroke: Stroke): QueryResult | null {
    let intersections = [];

    // Check if the first point is inside the polygon
    let first = Polygon.isPointInside(this.hull, stroke.points[0]);

    let length = 0;
    for (let i = 0; i < stroke.points.length - 1; i++) {
      const stroke_point_a = stroke.points[i];
      const stroke_point_b = stroke.points[i + 1];
      const stroke_segment = Line(stroke_point_a, stroke_point_b);
      length += stroke_point_a.distance;

      for (let j = 0; j < this.hull.length; j++) {
        const hull_point_a = this.hull[j];
        const hull_point_b = this.hull[(j + 1) % this.hull.length];
        const hull_segment = Line(hull_point_a, hull_point_b);
        const intersection = Line.intersectOffset(stroke_segment, hull_segment);
        if (intersection != null) {
          intersections.push(length + intersection * stroke_point_b.distance);
        }
      }
    }

    if (first || intersections.length > 0) {
      return { intersections, first };
    }
    return null;
  }

  render(r: Render) {
    const x = this.topLeft.x;
    const y = this.topLeft.y;
    const w = this.bottomRight.x - this.topLeft.x;
    const h = this.bottomRight.y - this.topLeft.y;
    r.rect(x, y, w, h, fillAndStroke("#00FF0011", "#00FF00", 0.5));
  }
}

export type QueryResult = {
  intersections: Array<number>;
  first: boolean;
};
