import { StrokePoint } from "../../geom/strokepoint";
import PropertyStack from "../../property-stack";
import QueryManager from "../../query-manager";
import Render, { fill } from "../../render";
import StrokeManager from "./stroke-manager";
import { Brush, dashed, nameToBrush } from "./brush";

export default class Slicer {
  strokemanager: StrokeManager;
  querymanager: QueryManager;
  slices: Map<number, Array<StrokeSlice>>;

  constructor(strokemanager: StrokeManager, querymanager: QueryManager) {
    this.strokemanager = strokemanager;
    this.querymanager = querymanager;
    this.slices = new Map();
  }

  update() {
    // Debug, just slice each stroke in half
    this.slices = new Map();
    let ids = 0;

    const query = this.querymanager.getQuery(0);
    for (const [stroke_id, stroke] of this.strokemanager.strokes) {
      let color = new PropertyStack([{ type: "value", value: stroke.color }]);
      let weight = new PropertyStack([{ type: "value", value: stroke.weight }]);
      let brush = new PropertyStack([
        { type: "value", value: nameToBrush(stroke.brush) },
      ]);

      const slices: Array<StrokeSlice> = [];
      let start = 0;
      let inside = false;

      if (query) {
        const results = query.queryStroke(stroke);
        if (results) {
          inside = results.first;

          for (const intersection of results.intersections) {
            let n_color = color;
            let n_brush = brush;

            if (inside) {
              n_brush = brush.add({ type: "modifier", modify: dashed });
              n_color = color.add({ type: "value", value: "#AAAAAA" });
            }

            slices.push({
              stroke_id,
              id: ids++,
              start: start,
              end: intersection,
              props: {
                color: n_color,
                weight,
                brush: n_brush,
              },
            });
            start = intersection;
            inside = !inside;
          }
        }
      }

      if (inside) {
        brush = brush.add({ type: "modifier", modify: dashed });
        color = color.add({ type: "value", value: "#AAAAAA" });
      }
      slices.push({
        stroke_id,
        id: ids++,
        start: start,
        end: stroke.length,
        props: {
          color,
          weight,
          brush,
        },
      });

      this.slices.set(stroke_id, slices);
    }
  }

  getSlicePoints(slice: StrokeSlice, step: number = 1): Array<StrokePoint> {
    const stroke = this.strokemanager.getStroke(slice.stroke_id);
    return stroke.getPointsForSlice(slice, step);
  }

  render(r: Render) {
    let i = 0;
    for (const slices of this.slices.values()) {
      for (const slice of slices) {
        const points = this.getSlicePoints(slice);
        //r.poly(points, stroke(getRandomColor(i), 0.5), false);
        const color = getRandomColor(i);
        for (const point of points) {
          r.circle(point.x, point.y, 2, fill(color));
        }
        i++;
      }
    }
  }
}

export type StrokeSlice = {
  id: number;
  stroke_id: number;
  start: number;
  end: number;
  props: Props;
};

export type Props = {
  color: PropertyStack<string>;
  weight: PropertyStack<number>;
  brush: PropertyStack<Brush>;
};

function getRandomColor(seed: number): string {
  const random = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const r = Math.floor(random(seed) * 256);
  const g = Math.floor(random(seed + 1) * 256);
  const b = Math.floor(random(seed + 2) * 256);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
