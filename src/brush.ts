import { StrokePoint } from "./geom/strokepoint";

export type Inklet = {
  x: number;
  y: number;
  color: string;
  weight: number;
  shape: number;
  distance: number;
};

export type Brush = (
  color: string,
  weight: number,
  point: StrokePoint,
) => Inklet;

export function nameToBrush(name: string): Brush {
  return {
    pen: penBrush,
    pencil: pencilBrush,
    marker: markerBrush,
    brush: brushBrush,
  }[name]!;
}

function penBrush(color: string, weight: number, point: StrokePoint): Inklet {
  return {
    x: point.x,
    y: point.y,
    color: color,
    weight: weight * 0.5 + weight * 0.5 * point.pressure,
    shape: 0,
    distance: point.total_distance,
  };
}

function pencilBrush(
  color: string,
  weight: number,
  point: StrokePoint,
): Inklet {
  return {
    x:
      point.x +
      smoothPseudoRandomFloat(point.total_distance) * weight -
      weight * 0.5,
    y:
      point.y +
      smoothPseudoRandomFloat(point.total_distance) * weight -
      weight * 0.5,
    color: color + "30",
    weight: weight + weight * 0.1 * point.pressure,
    shape: 0,
    distance: point.total_distance,
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
    distance: point.total_distance,
  };
}

function brushBrush(color: string, weight: number, point: StrokePoint): Inklet {
  return {
    x:
      point.x +
      pseudoRandomFloat(point.total_distance) * (weight - weight * 0.5) * 0.1,
    y:
      point.y +
      pseudoRandomFloat(point.total_distance) * (weight - weight * 0.5) * 0.1,
    color: color,
    weight:
      weight * point.pressure +
      smoothPseudoRandomFloat(point.total_distance) * weight,
    shape: 0,
    distance: point.total_distance,
  };
}

function pseudoRandomFloat(seed: number): number {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function smoothPseudoRandomFloat(seed: number): number {
  const x = Math.sin(seed) * 10000;
  const y = Math.sin(seed + 1) * 10000;
  const z = Math.sin(seed + 2) * 10000;
  return (x - Math.floor(x) + y - Math.floor(y) + z - Math.floor(z)) / 3;
}

export function dashed(brush: Brush): Brush {
  return (color: string, weight: number, point: StrokePoint): Inklet => {
    let inklet = brush(color, weight, point);
    let dash = 10;
    let gap = 10;
    let distance = inklet.distance % (dash + gap);
    if (distance > dash) {
      return inklet;
    }
    return null!;
  };
}
