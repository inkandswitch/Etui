import Render, { stroke, fill } from "./render";

type StrokePoint = {
  x: number;
  y: number;
};

export default class Stroke {
  points: StrokePoint[] = [];

  render(r: Render) {
    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i];
      const p2 = this.points[i + 1];
      r.line(p1.x, p1.y, p2.x, p2.y, stroke("black", 1));
      r.rect(p1.x - 2, p1.y - 2, 4, 4, fill("red"));
    }
  }

  addPoint(x: number, y: number) {
    this.points.push({ x, y });
  }
}
