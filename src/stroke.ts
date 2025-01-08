import Render, { stroke } from "./render";
import { StrokePoint, Point, Vec } from "./geom";

export class Strokes {
  strokes: Array<Stroke> = [];

  step: number = 1;

  debugRender: boolean = true;
  showPoints: boolean = false;

  addStroke(stroke: Stroke) {
    this.strokes.push(stroke);
  }

  render(r: Render) {
    for (const stroke of this.strokes) {
      stroke.render(r, this.debugRender, this.showPoints);
    }
  }

  rebuildInklets() {
    for (const stroke of this.strokes) {
      stroke.rebuildInklets(this.step);
    }
  }
}

export default class Stroke {
  originalPoints: Array<StrokePoint> = []; // Keep original points for debugging purposes
  points: Array<StrokePoint> = [];
  lengths: Array<number> = [];
  inklets: Array<StrokePoint> = [];

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
        r.line(p1.x, p1.y, p2.x, p2.y, stroke("#0000FF55", 0.5));
      }

      if (showPoints) {
        for (const inklet of this.inklets) {
          r.circle(
            inklet.x,
            inklet.y,
            2 + inklet.pressure * 4,
            stroke("#0000FF55", 0.5),
          );

          // Draw tilt
          const tilt_x = inklet.tilt_x * (Math.PI / 180);
          const tilt_y = inklet.tilt_y * (Math.PI / 180);
          r.line(
            inklet.x,
            inklet.y,
            inklet.x + tilt_x * 10,
            inklet.y + tilt_y * 10,
            stroke("#0000FF55", 0.5),
          );
        }
      }
    }
  }
}
