import { Line, Point, Polygon } from "./geom";
import Render, { fill, stroke } from "./render";
import { Strokes } from "./stroke";

export default class Select {
  captureBuffer: Array<Point> = [];
  slices: Array<StrokeSlice> = [];
  strokes: Strokes;

  mode: "partial" | "stroke" | "connected" = "partial";

  constructor(strokes: Strokes) {
    this.strokes = strokes;
  }

  start() {
    this.captureBuffer = [];
  }

  draw(x: number, y: number) {
    const point = Point(x, y);
    this.captureBuffer.push(point);
  }

  end() {
    this.update();
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

  findIntersections() {
    this.slices = [];
    for (const sid in this.strokes.strokes) {
      const stroke = this.strokes.strokes[sid];
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
                strokeId: parseInt(sid),
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
          strokeId: parseInt(sid),
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
        startPosition: this.strokes.strokes[sid].points[0],
        endIndex: this.strokes.strokes[sid].points.length - 1,
        endPosition:
          this.strokes.strokes[sid].points[
            this.strokes.strokes[sid].points.length - 1
          ],
      });
    }
  }

  cut() {
    for (const slice of this.slices) {
      this.strokes.cut(slice.strokeId, slice.startIndex, slice.endIndex);
    }
    this.slices = [];
  }

  render(r: Render) {
    r.poly(this.captureBuffer, fill("#00FF0022"));
    r.poly(this.captureBuffer, stroke("green", 0.5));

    for (const slice of this.slices) {
      r.circle(slice.startPosition.x, slice.startPosition.y, 2, fill("green"));
      r.circle(slice.endPosition.x, slice.endPosition.y, 2, fill("green"));

      // Draw the slice
      const stroke_points = this.strokes.strokes[slice.strokeId].points.slice(
        slice.startIndex + 1,
        slice.endIndex + 1,
      );
      r.poly(
        [slice.startPosition, ...stroke_points, slice.endPosition],
        stroke("#00FF0044", 10),
        false,
      );
    }
  }
}

type StrokeSlice = {
  strokeId: number;
  startIndex: number;
  startPosition: Point;
  endIndex: number;
  endPosition: Point;
};
