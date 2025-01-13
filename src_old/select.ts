import { Line, Point, Polygon, StrokePoint, Vec } from "./geom";
import Render, { fill, stroke } from "./render";
import { Cutpoint, Strokes, StrokeSlice } from "./stroke";

export default class Select {
  captureBuffer: Array<Point> = [];
  slices: Array<StrokeSlice> = [];
  strokes: Strokes;

  mode: "partial" | "stroke" | "connected" = "partial";
  cutMode: "cut" | "noodlify" = "cut";
  debugRender = true;

  move: boolean = false;
  didMove: boolean = false;
  lastPosition: Point | null = null;

  constructor(strokes: Strokes) {
    this.strokes = strokes;
  }

  start() {
    if (this.move) {
      if (!this.didMove) {
        this.didMove = true;
        this.cut();
        this.update();
        this.captureBuffer = [];
      }
    }
  }

  draw(x: number, y: number) {
    if (this.move) {
      if (!this.lastPosition) {
        this.lastPosition = Point(x, y);
        return;
      }

      let delta = Vec.sub(Point(x, y), this.lastPosition);
      this.lastPosition = Point(x, y);

      // sort the slices by stroke id
      let strokes: Set<number> = new Set();
      for (const slice of this.slices) {
        strokes.add(slice.strokeId);
      }

      // move the strokes
      for (const strokeId of strokes) {
        this.strokes.strokes.get(strokeId)!.move(delta.x, delta.y);
      }
    } else {
      const point = Point(x, y);
      this.captureBuffer.push(point);
    }
  }

  end() {
    if (this.move) {
      this.lastPosition = null;
    } else {
      this.update();
      this.move = true;
    }
  }

  update() {
    if (this.mode == "partial") {
      this.findIntersections();
    }
    if (this.mode == "stroke") {
      this.findIntersections();
      this.selectWholeStrokes();
    }
  }

  reset() {
    this.slices = [];
    this.captureBuffer = [];
    this.move = false;
    this.didMove = false;
  }

  findIntersections() {
    this.slices = [];
    for (const [sid, stroke] of this.strokes.strokes) {
      let lastIntersection = null;
      let lastIntersectionIndex = -1;

      // Check if the start point is inside the polygon, in which case we start with an intersection
      const start = stroke.points[0];
      const isStartInside = Polygon.isPointInside(this.captureBuffer, start);
      if (isStartInside) {
        lastIntersection = start;
        lastIntersectionIndex = 0;
      }

      for (let i = 0; i < stroke.points.length - 1; i++) {
        let strokeSegment = Line(stroke.points[i], stroke.points[i + 1]);
        // TODO: Handle degenerate case where there are multiple intersections for a single segment
        // TODO: Check if intersection is already in the list, this may happen because line segments share endpoints
        for (let j = 0; j < this.captureBuffer.length; j++) {
          let captureSegment = Line(
            this.captureBuffer[j],
            this.captureBuffer[(j + 1) % this.captureBuffer.length],
          );

          const intersection = Line.intersect(strokeSegment, captureSegment);
          if (intersection) {
            // Check if an intersection already happened
            // In which case we can add it as a slice
            if (!lastIntersection) {
              lastIntersection = intersection;
              lastIntersectionIndex = i;
            } else {
              this.slices.push({
                strokeId: sid,
                startIndex: lastIntersectionIndex,
                startPosition: lastIntersection,
                endIndex: i,
                endPosition: intersection,
              });
              lastIntersection = null;
              lastIntersectionIndex = -1;
            }
          }
        }
      }

      // Check if the last intersection was not closed, in which case we add the end of the stroke as a slice
      if (lastIntersection) {
        this.slices.push({
          strokeId: sid,
          startIndex: lastIntersectionIndex,
          startPosition: lastIntersection,
          endIndex: stroke.points.length - 1,
          endPosition: stroke.points[stroke.points.length - 1],
        });
      }
    }
  }

  selectWholeStrokes() {
    const strokes: Set<number> = new Set();
    for (const slice of this.slices) {
      strokes.add(slice.strokeId);
    }

    this.slices = [];
    for (const sid of strokes) {
      this.slices.push({
        strokeId: sid,
        startIndex: 0,
        startPosition: this.strokes.strokes.get(sid)!.points[0],
        endIndex: this.strokes.strokes.get(sid)!.points.length - 1,
        endPosition:
          this.strokes.strokes.get(sid)!.points[
            this.strokes.strokes.get(sid)!.points.length - 1
          ],
      });
    }
  }

  cut() {
    // Sort slices into cutpoints per stroke
    const cutpointsPerStroke: Map<number, Array<Cutpoint>> = new Map();
    for (const slice of this.slices) {
      let list = cutpointsPerStroke.get(slice.strokeId);
      const stroke = this.strokes.strokes.get(slice.strokeId)!;

      if (!list) {
        list = [];
        cutpointsPerStroke.set(slice.strokeId, list);
      }

      // Compute the t offset for the cutpoints, which we use for precise cutting
      list.push({
        index: slice.startIndex,
        t:
          Vec.len(
            Vec.sub(slice.startPosition, stroke.points[slice.startIndex]),
          ) / stroke.lengths[slice.startIndex],
      });
      list.push({
        index: slice.endIndex,
        t:
          Vec.len(Vec.sub(slice.endPosition, stroke.points[slice.endIndex])) /
          stroke.lengths[slice.endIndex],
      });
    }

    // Cut the strokes
    for (const [strokeId, cutpoints] of cutpointsPerStroke) {
      this.strokes.cut(strokeId, cutpoints, this.cutMode == "noodlify");
    }

    this.update();
  }

  render(r: Render) {
    r.poly(this.captureBuffer, fill("#00FF0022"));
    r.poly(this.captureBuffer, stroke("green", 0.5));

    for (const slice of this.slices) {
      r.circle(slice.startPosition.x, slice.startPosition.y, 2, fill("green"));
      r.circle(slice.endPosition.x, slice.endPosition.y, 2, fill("green"));

      // Draw the slice
      const stroke_points = this.strokes.strokes
        .get(slice.strokeId)!
        .points.slice(slice.startIndex + 1, slice.endIndex + 1);
      r.poly(
        [slice.startPosition, ...stroke_points, slice.endPosition],
        stroke("#00FF0044", 10),
        false,
      );
    }
  }
}
