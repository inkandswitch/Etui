import { Point } from "./geom";
import Render, { fill, stroke } from "./render";

export default class Select {
  captureBuffer: Array<Point> = [];

  start() {
    this.captureBuffer = [];
  }

  draw(x: number, y: number) {
    const point = Point(x, y);
    this.captureBuffer.push(point);
  }

  end() {
    console.log("Select tool ended");
  }

  render(r: Render) {
    r.poly(this.captureBuffer, fill("#00FF0022"));
    r.poly(this.captureBuffer, stroke("green", 0.5));
  }
}
