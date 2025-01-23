import Slicer from "./slicer";
import Render, { fill } from "../../render";
import { Inklet } from "./brush";

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
        const points = this.slicer.getSlicePoints(slice, 1);
        const inklets: Array<Inklet> = [];
        const color = slice.props.color.getValue()!;
        const weight = slice.props.weight.getValue()!;
        const brush = slice.props.brush.getValue()!;

        for (const point of points) {
          let inklet = brush(color, weight, point);
          if (inklet) inklets.push(inklet);
        }
        this.inklets.set(slice.id, inklets);
      }
    }
  }

  render(r: Render) {
    for (const inklets of this.inklets.values()) {
      for (const inklet of inklets) {
        if (inklet.shape == 0) {
          r.circle(inklet.x, inklet.y, inklet.weight, fill(inklet.color));
        } else {
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
}
