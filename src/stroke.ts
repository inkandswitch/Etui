import Render, { stroke } from "./render";
import { Point, Vec } from "./geom";

export class Strokes {
  strokes: Array<Stroke> = [];

  step: number = 2;
  debugRender: boolean = false;

  addStroke(stroke: Stroke) {
    this.strokes.push(stroke);
  }

  render(r: Render) {
    for (const stroke of this.strokes) {
      stroke.render(r, this.debugRender);
    }
  }

  rebuildInklets() {
    for (const stroke of this.strokes) {
      stroke.rebuildInklets(this.step);
    }
  }
}

export default class Stroke {
  originalPoints: Array<Point> = [];
  points: Array<Point> = [];
  lengths: Array<number> = [];
  inklets: Array<Point> = [];

  addOriginalPoint(x: number, y: number) {
    this.originalPoints.push({ x, y });
  }

  addPoint(x: number, y: number) {
    this.points.push({ x, y });

    if (this.points.length > 1) {
      const last = this.points[this.points.length - 2];
      const current = this.points[this.points.length - 1];
      const len = Vec.len(Vec.sub(current, last));
      this.lengths.push(len);
    }
  }

  getPositionAtLength(length: number): Point {
    let currentLength = 0;
    for (let i = 0; i < this.points.length - 1; i++) {
      if (currentLength + this.lengths[i] > length) {
        const t = (length - currentLength) / this.lengths[i];
        return Vec.lerp(this.points[i], this.points[i + 1], t);
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
      this.inklets.push(this.getPositionAtLength(len));
    }
  }

  render(r: Render, debug: boolean) {
    for (const inklet of this.inklets) {
      if (debug) {
        r.circle(inklet.x, inklet.y, 2, stroke("blue", 0.5));
      }
    }
  }
}
