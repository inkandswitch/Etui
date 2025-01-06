import Render, { fill, stroke } from "./render";
import Stroke from "./stroke";
import { Point, Vec } from "./geom";

// Takes input and creates a new stroke object
// Simplifies the input to a series of points

export default class Capture {
  epsilon = 0.5;
  captureBuffer: Array<Point> = [];
  allPoints: Array<Point> = [];

  stroke: Stroke | null = null;

  constructor() {
    window.addEventListener("mousedown", (e) => {
      this.startStroke(e.clientX, e.clientY);
    });

    window.addEventListener("mousemove", (e) => {
      this.moveStroke(e.clientX, e.clientY);
    });

    window.addEventListener("mouseup", (e) => {
      this.endStroke(e.clientX, e.clientY);
    });
  }

  startStroke(x: number, y: number) {
    this.stroke = new Stroke();
    this.stroke.addPoint(x, y);
    this.captureBuffer = [{ x, y }];
    this.allPoints.push({ x, y });
  }

  moveStroke(x: number, y: number) {
    if (this.stroke) {
      this.captureBuffer.push({ x, y });
      this.allPoints.push({ x, y });
      const error = linearApproximationError(this.captureBuffer);
      if (error > this.epsilon) {
        let prev = this.captureBuffer[this.captureBuffer.length - 2];
        this.stroke.addPoint(prev.x, prev.y);
        this.captureBuffer = [prev, { x, y }];
      }
    }
  }

  endStroke(x: number, y: number) {
    this.stroke = null;
  }

  render(r: Render) {
    if (this.stroke) {
      this.stroke.render(r);
    }

    for (const point of this.allPoints) {
      r.point(point.x, point.y, fill("#00000055"));
    }

    if (this.captureBuffer.length > 1) {
      const first = this.captureBuffer[0];
      const last = this.captureBuffer[this.captureBuffer.length - 1];
      r.line(first.x, first.y, last.x, last.y, stroke("#000000", 1));
    }
  }
}

function linearApproximationError(points: Array<Point>): number {
  // Calculate the vector between the first and last points
  const first = points[0];
  const last = points[points.length - 1];
  const line = Vec.sub(last, first);

  let maxError = 0;
  // Calculate the distance between each point and the line
  for (let i = 1; i < points.length - 2; i++) {
    const point = points[i];
    const distance = Vec.sub(point, first);
    const projection = Vec.project(distance, line);
    const error = Vec.sub(distance, projection);
    const errorLength = Vec.len(error);
    if (errorLength > maxError) {
      maxError = errorLength;
    }
  }

  return maxError;
}
