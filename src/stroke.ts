import Color from "./color";
import { StrokePoint } from "./geom/strokepoint";
import Render, { stroke } from "./render";

// Basic Stroke Data
export default class Stroke {
  points: Array<StrokePoint> = [];
  color: Color = new Color();
  weight: number = 1;

  constructor() {
    this.points = [];
  }

  addPoint(p: StrokePoint) {
    this.points.push(p);
  }

  render(r: Render) {
    r.poly(this.points, stroke("red", 0.5), false);
  }
}
