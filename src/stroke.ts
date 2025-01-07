import Render, { stroke, fill } from "./render";
import { Point } from "./geom";

export default class Stroke {
  originalPoints: Point[] = [];
  points: Point[] = [];

  render(r: Render) {}

  addOriginalPoint(x: number, y: number) {
    this.originalPoints.push({ x, y });
  }

  addPoint(x: number, y: number) {
    this.points.push({ x, y });
  }
}
