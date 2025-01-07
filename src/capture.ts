import Render, { fill, stroke } from "./render";
import Stroke from "./stroke";
import { Point, Vec } from "./geom";
import Config from "./config";

// Takes input and creates a new stroke object
// Simplifies the input to a series of points

export default class Capture {
  captureBuffer: Array<Point> = [];

  stroke: Stroke | null = null;

  strokes: Array<Stroke>;

  constructor(strokes: Array<Stroke>) {
    this.strokes = strokes;

    window.addEventListener("mousedown", (e) => {
      // @ts-ignore
      if (e.target.nodeName != "CANVAS") return; // don't care about non-canvas clicks
      this.startStroke(e.clientX, e.clientY);
    });

    window.addEventListener("mousemove", (e) => {
      this.extendStroke(e.clientX, e.clientY);
    });

    window.addEventListener("mouseup", (e) => {
      this.endStroke(e.clientX, e.clientY);
    });
  }

  recompute() {
    // Get old values for all strokes and recompute them
    for (const stroke of this.strokes) {
      const originalPoints = stroke.originalPoints;
      stroke.points = [];
      stroke.originalPoints = [];
      let f = originalPoints[0];
      this.stroke = stroke;
      this.stroke.addPoint(f.x, f.y);
      this.stroke.addOriginalPoint(f.x, f.y);
      this.captureBuffer = [{ x: f.x, y: f.y }];

      for (let i = 1; i < originalPoints.length; i++) {
        this.extendStroke(originalPoints[i].x, originalPoints[i].y);
      }

      const l = originalPoints[originalPoints.length - 1];
      this.stroke.addPoint(l.x, l.y);
      this.stroke = null;
    }

    console.log(this.strokes);
  }

  startStroke(x: number, y: number) {
    this.stroke = new Stroke();
    this.stroke.addPoint(x, y);
    this.stroke.addOriginalPoint(x, y);
    this.captureBuffer = [{ x, y }];
  }

  extendStroke(x: number, y: number) {
    if (this.stroke) {
      this.captureBuffer.push({ x, y });
      this.stroke.addOriginalPoint(x, y);
      const [error, maxErrorIndex] = linearApproximationError(
        this.captureBuffer,
      );
      if (error > Config.simplifyEpsilon) {
        if (Config.simplifyAlgorithm == "last") {
          let prev = this.captureBuffer[this.captureBuffer.length - 2];
          this.stroke.addPoint(prev.x, prev.y);
          this.captureBuffer = [prev, { x, y }];
        } else if (Config.simplifyAlgorithm == "furthest") {
          let appendPoint = this.captureBuffer[maxErrorIndex];
          this.stroke.addPoint(appendPoint.x, appendPoint.y);
          this.captureBuffer = this.captureBuffer.slice(maxErrorIndex);
        }
      }
    }
  }

  endStroke(x: number, y: number) {
    if (this.stroke) {
      this.stroke.addPoint(x, y);
      this.strokes.push(this.stroke);
      this.stroke = null;
    }
  }

  render(r: Render) {
    if (this.stroke) {
      this.stroke.render(r);

      if (this.captureBuffer.length > 1) {
        const first = this.captureBuffer[0];
        const last = this.captureBuffer[this.captureBuffer.length - 1];
        r.line(first.x, first.y, last.x, last.y, stroke("red", 1));
      }
    }
  }
}

function linearApproximationError(points: Array<Point>): [number, number] {
  // Calculate the vector between the first and last points
  const first = points[0];
  const last = points[points.length - 1];
  const line = Vec.sub(last, first);

  let maxError = 0;
  let index = 0;
  // Calculate the distance between each point and the line
  for (let i = 1; i < points.length - 1; i++) {
    const point = points[i];
    const distance = Vec.sub(point, first);
    const projection = Vec.project(distance, line);
    const error = Vec.sub(distance, projection);
    const errorLength = Vec.len(error);
    if (errorLength > maxError) {
      maxError = errorLength;
      index = i;
    }
  }

  return [maxError, index];
}
