import Render, { stroke, fill } from "./render";
import { Point } from "./geom";

export default class Stroke {
  originalPoints: Point[] = [];
  points: Point[] = [];

  render(r: Render) {
    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i];
      const p2 = this.points[i + 1];
      r.line(p1.x, p1.y, p2.x, p2.y, stroke("red", 0.5));
    }

    for (const point of this.originalPoints) {
      r.rect(point.x - 1, point.y - 1, 2, 2, fill("#00000033"));
    }

    for (const point of this.points) {
      r.rect(point.x - 1, point.y - 1, 2, 2, fill("red"));
    }
  }

  addOriginalPoint(x: number, y: number) {
    this.originalPoints.push({ x, y });
  }

  addPoint(x: number, y: number) {
    this.points.push({ x, y });
  }
}
