import Render, { fill, stroke } from "./render";
import Stroke, { Strokes } from "./stroke";
import { Point, Vec, NVec, StrokePoint } from "./geom";

// Takes input and creates a new stroke object
// Simplifies the input to a series of points

export default class Capture {
  captureBuffer: Array<StrokePoint> = [];

  stroke: Stroke | null = null;

  strokes: Strokes;

  // Config
  epsilon = 0.2;
  algorithm = "furthest";
  debugRender = true;
  showPoints = false;

  constructor(strokes: Strokes) {
    this.strokes = strokes;
  }

  recompute() {
    // Get old values for all strokes and recompute them
    for (const stroke of this.strokes.strokes.values()) {
      const originalPoints = stroke.originalPoints;
      stroke.points = [];
      stroke.originalPoints = [];
      stroke.lengths = [];
      let first = originalPoints[0];
      this.stroke = stroke;
      this.stroke.addPoint(first);
      this.stroke.addPoint(first);
      this.stroke.addOriginalPoint(first);
      this.captureBuffer = [first];

      for (let i = 1; i < originalPoints.length; i++) {
        const p = originalPoints[i];
        this.stepStroke(p);
      }

      const l = originalPoints[originalPoints.length - 1];
      this.stroke.addPoint(l);
      this.stroke = null;
    }

    console.log(this.strokes);
  }

  draw(x: number, y: number, pressure: number, tilt_x: number, tilt_y: number) {
    const point = StrokePoint(x, y, pressure, tilt_x, tilt_y);
    this.stepStroke(point);
    this.stroke!.rebuildInklets(this.strokes.step);
  }

  end() {
    if (this.stroke) {
      this.stroke!.rebuildInklets(this.strokes.step);
      if (this.captureBuffer.length > 0) {
        let last = this.captureBuffer[this.captureBuffer.length - 1];
        this.stroke.updateLastPoint(last);
        this.stroke.rebuildInklets(this.strokes.step);
      }

      this.stroke = null;
    }
  }

  stepStroke(point: StrokePoint) {
    if (!this.stroke) {
      // If the stroke doesn't exist, create it
      this.stroke = new Stroke();
      this.stroke.addPoint(point);
      this.stroke.addPoint(point);
      this.stroke.addOriginalPoint(point);
      this.captureBuffer = [point];
      this.strokes.addStroke(this.stroke);
    } else {
      // Record point
      this.stroke.addOriginalPoint(point);
      this.captureBuffer.push(point);
      this.stroke.updateLastPoint(point);

      // Compute the approximation error
      const [error, maxErrorIndex] = linearApproximationError(
        this.captureBuffer,
      );

      // If the error is too large, add a point to the stroke
      if (error > this.epsilon) {
        if (this.algorithm == "last") {
          let prev = this.captureBuffer[this.captureBuffer.length - 2];
          this.stroke.updateLastPoint(prev);
          this.stroke.addPoint(prev);
          this.captureBuffer = [prev, point];
        } else if (this.algorithm == "furthest") {
          let appendPoint = this.captureBuffer[maxErrorIndex];
          this.stroke.updateLastPoint(appendPoint);
          this.stroke.addPoint(appendPoint);
          this.captureBuffer = this.captureBuffer.slice(maxErrorIndex);
        }
      }
    }
  }

  render(r: Render) {
    if (!this.debugRender) return;
    for (const s of this.strokes.strokes.values()) {
      if (this.showPoints) {
        // Draw original points
        for (const point of s.originalPoints) {
          r.circle(point.x, point.y, 2, fill("#DDBBBB"));
          r.circle(
            point.x,
            point.y,
            2 + point.pressure * 4,
            stroke("#DDBBBB", 0.5),
          );
          // Draw tilt
          const tilt_x = point.tilt_x * (Math.PI / 180);
          const tilt_y = point.tilt_y * (Math.PI / 180);
          r.line(
            point.x,
            point.y,
            point.x + tilt_x * 10,
            point.y + tilt_y * 10,
            stroke("#DDBBBB", 0.5),
          );
        }
      }

      // Draw the interpolated line segments
      for (let i = 0; i < s.points.length - 1; i++) {
        const p1 = s.points[i];
        const p2 = s.points[i + 1];
        r.line(p1.x, p1.y, p2.x, p2.y, stroke("red", 0.5));
      }

      // Draw filtered points
      if (this.showPoints) {
        for (const point of s.points) {
          r.circle(point.x, point.y, 2, fill("red"));
          r.circle(
            point.x,
            point.y,
            2 + point.pressure * 4,
            stroke("red", 0.5),
          );
          // Draw tilt
          const tilt_x = point.tilt_x * (Math.PI / 180);
          const tilt_y = point.tilt_y * (Math.PI / 180);
          r.line(
            point.x,
            point.y,
            point.x + tilt_x * 10,
            point.y + tilt_y * 10,
            stroke("red", 0.5),
          );
        }
      }
    }
  }
}

function linearApproximationError(
  points: Array<StrokePoint>,
): [number, number] {
  // Calculate the vector between the first and last points
  const first = StrokePoint.asNVec(points[0]);
  const last = StrokePoint.asNVec(points[points.length - 1]);
  const line = NVec.sub(last, first);

  let maxError = 0;
  let index = 0;
  // Calculate the distance between each point and the line
  for (let i = 1; i < points.length - 1; i++) {
    const point = StrokePoint.asNVec(points[i]);
    const diff = NVec.sub(point, first);
    const projection = NVec.project(diff, line);
    const error = NVec.sub(diff, projection);
    const errorLength = NVec.magnitude(error);
    if (errorLength > maxError) {
      maxError = errorLength;
      index = i;
    }
  }

  return [maxError, index];
}

// function createStrokePoint(
//   x: number,
//   y: number,
//   pressure: number,
//   tilt_x: number,
//   tilt_y: number,
// ): StrokePoint {
//   // convert tilt to radians
//   let tilt_x_r = tilt_x * (Math.PI / 180);
//   let tilt_y_r = tilt_y * (Math.PI / 180);

//   return {
//     x,
//     y,
//     pressure,
//     tilt_magnitude: Math.atan2(tilt_y_r, tilt_x_r),
//     tilt_angle: Math.sqrt(tilt_x_r * tilt_x_r + tilt_y_r * tilt_y_r),
//   };
//}
