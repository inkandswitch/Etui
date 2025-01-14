import { StrokePoint } from "./geom/strokepoint";
import { Vec } from "./geom/vec";
import Render, { stroke } from "./render";
import { MouseData } from "./input";
import { StrokeSlice } from "./slicer";

// Basic Stroke Data
export default class Stroke {
  points: Array<StrokePoint>;
  length: number;
  color: string;
  weight: number;

  constructor(color: string = "red", weight: number = 1) {
    this.points = [];
    this.length = 0;
    this.color = color;
    this.weight = weight;
  }

  addPoint(data: MouseData) {
    let distance = 0;
    if (this.points.length > 0) {
      const last = this.points[this.points.length - 1];
      distance = Vec.dist(last, data.world);
    }
    this.length += distance;
    this.points.push(
      StrokePoint(
        data.world.x,
        data.world.y,
        data.pressure,
        data.tiltX,
        data.tiltY,
        distance,
      ),
    );
  }

  getPointAtLength(length: number): StrokePoint {
    if (length < 0 || this.points.length === 0) {
      return this.points[0];
    }

    let currentLength = 0;
    for (let i = 0; i < this.points.length - 1; i++) {
      const len = this.points[i + 1].distance;
      if (currentLength + len >= length) {
        const t = (length - currentLength) / len;
        return StrokePoint.lerp(this.points[i], this.points[i + 1], t);
      }
      currentLength += len;
    }

    // If length is greater than the total length, return the last point
    return this.points[this.points.length - 1];
  }

  getPointsForSlice(slice: StrokeSlice, step: number) {
    const points: Array<StrokePoint> = [];

    // Round start to the nearest interval of step
    const start = Math.round(slice.start / step) * step;
    let currentLength = 0;
    let lastIndex = 0;

    // Find the index of the point that is closest to the start of the slice
    for (let i = 0; i < this.points.length - 1; i++) {
      if (currentLength + this.points[i + 1].distance >= slice.start) {
        lastIndex = i;
        break;
      }
      currentLength += this.points[i + 1].distance;
    }

    // Generate points at intervals of step
    for (let length = start; length <= slice.end; length += step) {
      // Move to the index of the point that is closest to the current length
      while (
        lastIndex < this.points.length - 1 &&
        currentLength + this.points[lastIndex + 1].distance < length
      ) {
        currentLength += this.points[lastIndex + 1].distance;
        lastIndex++;
      }

      // Add the point at the current length, interpolate if the length is between two points, otherwise add the last point
      if (lastIndex < this.points.length - 1) {
        const len = this.points[lastIndex + 1].distance;
        const t = (length - currentLength) / len;
        points.push(
          StrokePoint.lerp(
            this.points[lastIndex],
            this.points[lastIndex + 1],
            t,
          ),
        );
      } else {
        points.push(this.points[this.points.length - 1]);
      }
    }
    return points;
  }

  render(r: Render) {
    r.poly(this.points, stroke("red", 0.5), false);
  }
}
