import Slicer from "./slicer";
import Render, { fill } from "./render";

export default class Painter {
  slicer: Slicer;
  // inklets by slice id
  inklets: Map<number, Array<Inklet>>;

  constructor(slicer: Slicer) {
    this.slicer = slicer;
    this.inklets = new Map();
  }

  update() {
    this.inklets = new Map();

    for (const slices of this.slicer.slices.values()) {
      for (const slice of slices) {
        const points = this.slicer.getSlicePoints(slice);
        const inklets: Array<Inklet> = [];
        const color = slice.props.color.getValue()!;
        const weight = slice.props.weight.getValue()!;

        for (const point of points) {
          inklets.push({
            x: point.x,
            y: point.y,
            color,
            weight,
          });
        }
        this.inklets.set(slice.id, inklets);
      }
    }
  }

  render(r: Render) {
    for (const inklets of this.inklets.values()) {
      for (const inklet of inklets) {
        //r.circle(inklet.x, inklet.y, inklet.weight, fill(inklet.color + "10"));
        r.rect(
          inklet.x - inklet.weight,
          inklet.y - inklet.weight * 2,
          inklet.weight * 2,
          inklet.weight * 4,
          fill(inklet.color),
        );
      }
    }
  }
}

export type Inklet = {
  x: number;
  y: number;
  color: string;
  weight: number;
};
