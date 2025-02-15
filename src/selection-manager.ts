import { Point } from "./geom/point";
import { Vec } from "./geom/vec";
import { Line } from "./geom/line";
import Render, { fill, fillAndStroke } from "./render";
import StrokeManager from "./stroke-manager";
import { Polygon } from "./geom/polygon";
import BeamManager from "./beam/beam-manager";

export default class SelectionManager {
  strokemanager: StrokeManager;
  beammanager: BeamManager;
  hull: Array<Point> = [];
  intersections: Map<number, Array<number>> = new Map();
  strokes: Array<number> = [];

  selectedColors: Set<string> = new Set();
  selectedWeights: Set<number> = new Set();
  selectedBrushes: Set<string> = new Set();

  constructor(strokemanager: StrokeManager, beammanager: BeamManager) {
    this.strokemanager = strokemanager;
    this.beammanager = beammanager;
  }

  beginSelection(p: Point) {
    this.hull = [p];
  }

  extendSelection(p: Point) {
    this.hull.push(p);
  }

  findStrokesInsideHull() {
    this.intersections = new Map();

    for (const [stroke_id, stroke] of this.strokemanager.strokes) {
      // Check if the first point is inside the polygon
      let inside = Polygon.isPointInside(this.hull, stroke.points[0]);
      if (inside) {
        this.intersections.set(stroke_id, []);
      }

      let length = 0;
      for (let i = 0; i < stroke.points.length - 1; i++) {
        const stroke_point_a = stroke.points[i];
        const stroke_point_b = stroke.points[i + 1];
        const stroke_segment = Line(stroke_point_a, stroke_point_b);
        length += stroke_point_a.distance;

        for (let j = 0; j < this.hull.length; j++) {
          const hull_point_a = this.hull[j];
          const hull_point_b = this.hull[(j + 1) % this.hull.length];
          const hull_segment = Line(hull_point_a, hull_point_b);
          const intersection = Line.intersectOffset(
            stroke_segment,
            hull_segment,
          );
          if (intersection != null) {
            let list = this.intersections.get(stroke_id);
            if (!list) {
              list = [];
              this.intersections.set(stroke_id, list);
            }

            list.push(length + intersection * stroke_point_b.distance);
          }
        }
      }
    }

    this.strokes = Array.from(this.intersections.keys());
  }

  reset() {
    this.hull = [];
    this.intersections = new Map();
    this.strokes = [];
    this.selectedColors = new Set();
    this.selectedWeights = new Set();
    this.selectedBrushes = new Set();
  }

  clearHull() {
    this.intersections = new Map();
    this.hull = [];
  }

  cutSelection() {
    let strokeIdMappings = new Map<number, Array<number>>();

    this.strokes = [];

    for (const [stroke_id, offsets] of this.intersections) {
      let stroke = this.strokemanager.getStroke(stroke_id);
      let newStrokes = [];

      // If the first point is inside polygon, the inside/outside state is flipped
      let inside = Polygon.isPointInside(this.hull, stroke.points[0]) ? 0 : 1;

      this.strokemanager.removeStroke(stroke_id);

      // Iterate over the offsets and slice the stoke
      let totalOffset = 0;
      for (const [i, offset] of offsets.entries()) {
        const [left, right] = stroke.cut(offset - totalOffset);
        const leftId = this.strokemanager.addStroke(left);
        stroke = right;
        totalOffset = offset;

        // If the stroke is inside, add the left stroke
        if (i % 2 == inside) {
          this.strokes.push(leftId);
        }
        newStrokes.push(leftId);
      }

      // Add the last stroke
      const strokeId = this.strokemanager.addStroke(stroke);
      if (offsets.length % 2 == inside) {
        this.strokes.push(strokeId);
      }
      newStrokes.push(strokeId);

      strokeIdMappings.set(stroke_id, newStrokes);
    }

    // Notify beams of updated ids
    this.beammanager.updateStrokeIds(strokeIdMappings);
  }

  moveSelection(delta: Vec) {
    for (const stroke_id of this.strokes) {
      const stroke = this.strokemanager.getStroke(stroke_id);
      for (const point of stroke.points) {
        point.x += delta.x;
        point.y += delta.y;
      }
    }
  }

  // Props
  computeSelectedProperties() {
    this.selectedColors = new Set();
    this.selectedWeights = new Set();
    this.selectedBrushes = new Set();

    for (const stroke_id of this.strokes) {
      const stroke = this.strokemanager.getStroke(stroke_id);
      this.selectedColors.add(stroke.color);
      this.selectedWeights.add(stroke.weight);
      this.selectedBrushes.add(stroke.brush);
    }
  }

  narrowToColor(color: string) {
    this.strokes = this.strokes.filter((stroke_id) => {
      const stroke = this.strokemanager.getStroke(stroke_id);
      return stroke.color == color;
    });
    this.computeSelectedProperties();
  }

  updateColor(old_color: string, new_color: string) {
    for (const stroke_id of this.strokes) {
      const stroke = this.strokemanager.getStroke(stroke_id);
      if (stroke.color == old_color) {
        stroke.color = new_color;
      }
    }
    this.computeSelectedProperties();
  }

  narrowToWeight(weight: number) {
    this.strokes = this.strokes.filter((stroke_id) => {
      const stroke = this.strokemanager.getStroke(stroke_id);
      return stroke.weight == weight;
    });
    this.computeSelectedProperties();
  }

  updateWeight(old_weight: number, new_weight: number) {
    for (const stroke_id of this.strokes) {
      const stroke = this.strokemanager.getStroke(stroke_id);
      if (stroke.weight == old_weight) {
        stroke.weight = new_weight;
      }
    }
    this.computeSelectedProperties();
  }

  narrowToBrush(brush: string) {
    this.strokes = this.strokes.filter((stroke_id) => {
      const stroke = this.strokemanager.getStroke(stroke_id);
      return stroke.brush == brush;
    });
    this.computeSelectedProperties();
  }

  updateBrush(old_brush: string, new_brush: string) {
    for (const stroke_id of this.strokes) {
      const stroke = this.strokemanager.getStroke(stroke_id);
      if (stroke.brush == old_brush) {
        stroke.brush = new_brush;
      }
    }
    this.computeSelectedProperties();
  }

  render(r: Render) {
    r.poly(this.hull, fillAndStroke("#00FF0011", "#00FF00", 0.5));

    for (const [stroke_id, offsets] of this.intersections) {
      const stroke = this.strokemanager.getStroke(stroke_id);
      for (const offset of offsets) {
        const point = stroke.getPointAtLength(offset);
        r.circle(point.x, point.y, 4, fill("#00FF00"));
      }
    }
  }
}
