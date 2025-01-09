import Render, { stroke, fill } from "./render";
import { StrokePoint, Point, Vec, catmullRomSpline } from "./geom";

export class Strokes {
  strokes: Map<number, Stroke> = new Map();
  goopyStrokes: Array<GoopyStroke> = [];

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

    for (const goopyStroke of this.goopyStrokes) {
      goopyStroke.render(r);
    }
  }

  rebuildInklets() {
    for (const stroke of this.strokes.values()) {
      stroke.rebuildInklets(this.step);
    }
  }

  cut(
    strokeId: number,
    cutpoints: Array<Cutpoint>,
    goop: boolean,
  ): Array<Stroke> {
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

    // Insert goopy strokes between the slices
    if (goop) {
      for (let i = 0; i < result.length - 1; i++) {
        const goopy = new GoopyStroke(result[i], result[i + 1]);
        this.goopyStrokes.push(goopy);
      }
    }

    return result;
  }
}

export default class Stroke {
  originalPoints: Array<StrokePoint> = []; // Keep original points for debugging purposes
  points: Array<StrokePoint> = [];
  lengths: Array<number> = [];
  totalLength: number = 0;
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
      this.totalLength += len;
    }
  }

  updateLastPoint(pt: StrokePoint) {
    if (this.points.length > 0) {
      this.points[this.points.length - 1] = pt;

      if (this.points.length > 1) {
        const last = this.points[this.points.length - 2];
        const current = this.points[this.points.length - 1];
        const len = Vec.len(Vec.sub(current, last));

        // update total length
        this.totalLength -= this.lengths[this.lengths.length - 1];
        this.totalLength += len;

        this.lengths[this.lengths.length - 1] = len;
      }
    }
  }

  // Length along stroke
  rebuildLengths() {
    this.lengths = [];
    this.totalLength = 0;
    for (let i = 0; i < this.points.length - 1; i++) {
      const last = this.points[i];
      const current = this.points[i + 1];
      const len = Vec.len(Vec.sub(current, last));
      this.lengths.push(len);
      this.totalLength += len;
    }
  }

  // Negative length is from the end
  getStrokePointAtLength(length: number): StrokePoint {
    if (length < 0) {
      length = this.totalLength + length;
    }

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

  // Inklets
  rebuildInklets(step: number = 2) {
    this.inklets = [];
    this.inklets.push(this.points[0]);
    for (let len = 0; len < this.totalLength; len += step) {
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

export class GoopyStroke {
  start: Stroke;
  end: Stroke;
  //points: Array<Point>;

  constructor(start: Stroke, end: Stroke) {
    this.start = start;
    this.end = end;
  }

  render(r: Render) {
    const spline: Array<{ x: number; y: number }> = [];

    const b = this.start.points[this.start.points.length - 1];
    const e = this.end.points[0];

    let dist = Vec.len(Vec.sub(b, e)) / 4;

    const da = this.start.getStrokePointAtLength(-1);
    const a = Vec.add(b, Vec.mulS(Vec.sub(da, b), dist));
    const cref = Vec.add(b, Vec.mulS(Vec.sub(da, b), -dist));
    const cpnt = Vec.add(b, Vec.normalDiff(e, b, dist));
    const c = Vec.avg(cref, cpnt);

    const df = this.end.getStrokePointAtLength(1);
    const f = Vec.add(e, Vec.mulS(Vec.sub(df, e), dist));
    const dref = Vec.add(e, Vec.mulS(Vec.sub(df, e), -dist));
    const dpnt = Vec.add(e, Vec.normalDiff(b, e, dist));
    const d = Vec.avg(dref, dpnt);

    spline.push(...catmullRomSpline(a, b, c, d, 50));
    spline.push(...catmullRomSpline(b, c, d, e, 50));
    spline.push(...catmullRomSpline(c, d, e, f, 50));

    r.poly(spline, stroke("#FFA500", 0.5), false);
    r.circle(a.x, a.y, 2, fill("#FFA500"));
    r.circle(b.x, b.y, 2, fill("#FFA500"));
    r.circle(c.x, c.y, 2, fill("#FFA500"));
    r.circle(d.x, d.y, 2, fill("#FFA500"));
    r.circle(e.x, e.y, 2, fill("#FFA500"));
    r.circle(f.x, f.y, 2, fill("#FFA500"));
  }
}
