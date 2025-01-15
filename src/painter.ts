import Slicer from "./slicer";
import Render, { fill } from "./render";
import { StrokePoint } from "./geom/strokepoint";

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

        const brush: any = {
          pen: penBrush,
          pencil: pencilBrush,
          marker: markerBrush,
          brush: brushBrush,
        }[slice.props.brush.getValue()!];

        for (const point of points) {
          inklets.push(brush(color, weight, point));
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

export type Inklet = {
  x: number;
  y: number;
  color: string;
  weight: number;
  shape: number;
};

function penBrush(color: string, weight: number, point: StrokePoint): Inklet {
  return {
    x: point.x,
    y: point.y,
    color: color,
    weight: weight * 0.5 + weight * 0.5 * point.pressure,
    shape: 0,
  };
}

function pencilBrush(
  color: string,
  weight: number,
  point: StrokePoint,
): Inklet {
  return {
    x: point.x + pseudoRandomFloat(point.distance) * weight - weight * 0.5,
    y: point.y + pseudoRandomFloat(point.distance) * weight - weight * 0.5,
    color: color + "30",
    weight: weight + weight * 0.1 * point.pressure,
    shape: 0,
  };
}

function markerBrush(
  color: string,
  weight: number,
  point: StrokePoint,
): Inklet {
  return {
    x: point.x,
    y: point.y,
    color: color + "10",
    weight: weight * 0.5 + weight * 0.5 * point.pressure,
    shape: 1,
  };
}

function brushBrush(color: string, weight: number, point: StrokePoint): Inklet {
  return {
    x:
      point.x +
      pseudoRandomFloat(point.distance) * (weight - weight * 0.5) * 0.1,
    y:
      point.y +
      pseudoRandomFloat(point.distance) * (weight - weight * 0.5) * 0.1,
    color: color,
    weight: weight * point.pressure,
    shape: 0,
  };
}

function pseudoRandomFloat(seed: number): number {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
