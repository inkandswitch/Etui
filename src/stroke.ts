import Render, { stroke } from "./render";
import { StrokePoint, Point, Vec } from "./geom";

export class Strokes {
  strokes: Map<number, Stroke> = new Map();

  step: number = 1;

  debugRender: boolean = true;
  showPoints: boolean = false;

  ids: number = 0;

  addStroke(stroke: Stroke) {
    this.strokes.set(this.ids++, stroke);
  }

  removeStroke(strokeId: number) {
    this.strokes.delete(strokeId);
  }

  render(r: Render) {
    for (const stroke of this.strokes.values()) {
      stroke.render(r, this.debugRender, this.showPoints);
    }
  }

  rebuildInklets() {
    for (const stroke of this.strokes.values()) {
      stroke.rebuildInklets(this.step);
    }
  }

  cut(strokeId: number, cutpoints: Array<Cutpoint>): Array<Stroke> {
    // Iterates through each cutpoint and slices the stroke
    // We insert intermediate points at the cuts
    // This assumes cutpoints are sorted by index
    const EPSILON = 0.0001; // Small offset to overlapping the endpoints

    let result = [];
    const points = this.strokes.get(strokeId)!.points;

    let start_index = 0;
    let start_t = 0;

    for (const cutpoint of cutpoints) {
      const index = cutpoint.index;
      if (index <= points.length) {
        const slice = points.slice(start_index, index + 1);

        if (start_t > 0) {
          slice.unshift(
            StrokePoint.lerp(
              points[start_index - 1],
              points[start_index],
              start_t + EPSILON,
            ),
          );
        }

        if (cutpoint.t > 0) {
          slice.push(
            StrokePoint.lerp(
              points[index],
              points[index + 1],
              cutpoint.t - EPSILON,
            ),
          );
          start_t = cutpoint.t;
        }

        if (slice.length > 1) {
          const stroke = new Stroke(slice);
          result.push(stroke);
          this.addStroke(stroke);
        }

        start_index = index + 1;
      }
    }
    // Add the tail of the stroke
    if (start_index < points.length) {
      const slice = points.slice(start_index);
      if (start_t > 0) {
        slice.unshift(
          StrokePoint.lerp(
            points[start_index - 1],
            points[start_index],
            start_t + EPSILON,
          ),
        );
      }
      const stroke = new Stroke(slice);
      result.push(stroke);
      this.addStroke(stroke);
    }

    // Delete the original stroke
    this.removeStroke(strokeId);

    console.log(this.strokes);

    return result;
  }
}

export default class Stroke {
  originalPoints: Array<StrokePoint> = []; // Keep original points for debugging purposes
  points: Array<StrokePoint> = [];
  lengths: Array<number> = [];
  inklets: Array<StrokePoint> = [];

  constructor(points?: Array<StrokePoint>) {
    if (points) {
      this.points = points;
      this.rebuildLengths();
    }
  }

  addOriginalPoint(pt: StrokePoint) {
    this.originalPoints.push(pt);
  }

  addPoint(pt: StrokePoint) {
    this.points.push(pt);

    if (this.points.length > 1) {
      const last = this.points[this.points.length - 2];
      const current = this.points[this.points.length - 1];
      const len = Vec.len(Vec.sub(current, last));
      this.lengths.push(len);
    }
  }

  updateLastPoint(pt: StrokePoint) {
    if (this.points.length > 0) {
      this.points[this.points.length - 1] = pt;

      if (this.points.length > 1) {
        const last = this.points[this.points.length - 2];
        const current = this.points[this.points.length - 1];
        const len = Vec.len(Vec.sub(current, last));
        this.lengths[this.lengths.length - 1] = len;
      }
    }
  }

  // Length along stroke
  rebuildLengths() {
    this.lengths = [];
    for (let i = 0; i < this.points.length - 1; i++) {
      const last = this.points[i];
      const current = this.points[i + 1];
      const len = Vec.len(Vec.sub(current, last));
      this.lengths.push(len);
    }
  }

  getStrokePointAtLength(length: number): StrokePoint {
    let currentLength = 0;
    for (let i = 0; i < this.points.length - 1; i++) {
      if (currentLength + this.lengths[i] > length) {
        const t = (length - currentLength) / this.lengths[i];
        return StrokePoint.lerp(this.points[i], this.points[i + 1], t);
      }
      currentLength += this.lengths[i];
    }
    return this.points[this.points.length - 1];
  }

  getTotalLength(): number {
    let totalLength = 0;
    for (let i = 0; i < this.lengths.length; i++) {
      totalLength += this.lengths[i];
    }
    return totalLength;
  }

  // Inklets
  rebuildInklets(step: number = 2) {
    const totalLength = this.getTotalLength();

    this.inklets = [];
    this.inklets.push(this.points[0]);
    for (let len = 0; len < totalLength; len += step) {
      this.inklets.push(this.getStrokePointAtLength(len));
    }
  }

  render(r: Render, debug: boolean, showPoints: boolean) {
    if (debug) {
      // Render line segments
      for (let i = 0; i < this.points.length - 1; i++) {
        const p1 = this.points[i];
        const p2 = this.points[i + 1];
        r.line(p1.x, p1.y, p2.x, p2.y, stroke("#0000FF22", 0.5));
      }

      if (showPoints) {
        for (const inklet of this.inklets) {
          r.circle(
            inklet.x,
            inklet.y,
            2 + inklet.pressure * 4,
            stroke("#0000FF22", 0.5),
          );

          // Draw tilt
          const tilt_x = inklet.tilt_x * (Math.PI / 180);
          const tilt_y = inklet.tilt_y * (Math.PI / 180);
          r.line(
            inklet.x,
            inklet.y,
            inklet.x + tilt_x * 10,
            inklet.y + tilt_y * 10,
            stroke("#0000FF22", 0.5),
          );
        }
      }
    }
  }

  move(dx: number, dy: number) {
    for (let i = 0; i < this.points.length; i++) {
      this.points[i].x += dx;
      this.points[i].y += dy;
    }
  }
}

export type StrokeSlice = {
  strokeId: number;
  startIndex: number;
  startPosition: Point;
  endIndex: number;
  endPosition: Point;
};

export type Cutpoint = {
  index: number; // index of the linesegment
  t: number; // lerp offset on the linesegment
};
