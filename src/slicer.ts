import { StrokePoint } from "./geom/strokepoint";
import PropertyStack from "./property-stack";
import Render, { fill } from "./render";
import StrokeManager from "./stroke-manager";

export default class Slicer {
  strokemanager: StrokeManager;
  slices: Map<number, Array<StrokeSlice>>;

  constructor(strokemanager: StrokeManager) {
    this.strokemanager = strokemanager;
    this.slices = new Map();
  }

  update() {
    // Debug, just slice each stroke in half
    this.slices = new Map();
    let ids = 0;

    for (const [stroke_id, stroke] of this.strokemanager.strokes) {
      const half = stroke.length / 2;
      const slices: Array<StrokeSlice> = [];

      slices.push({
        stroke_id,
        id: ids++,
        start: 0,
        end: half,
        props: {
          color: new PropertyStack([stroke.color]),
          weight: new PropertyStack([stroke.weight]),
          brush: new PropertyStack([stroke.brush]),
        },
      });

      slices.push({
        stroke_id,
        id: ids++,
        start: half,
        end: stroke.length,
        props: {
          color: new PropertyStack([stroke.color]),
          weight: new PropertyStack([stroke.weight]),
          brush: new PropertyStack([stroke.brush]),
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
  brush: PropertyStack<string>;
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
