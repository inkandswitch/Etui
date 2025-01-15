import { StrokePoint } from "./geom/strokepoint";
import { Vec } from "./geom/vec";
import { Line } from "./geom/line";
import Render, { stroke, fill } from "./render";
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

  setPoints(points: Array<StrokePoint>) {
    this.points = [];
    this.length = 0;

    for (let i = 0; i < points.length; i++) {
      let newPoint = StrokePoint.clone(points[i]);
      if (i == 0) {
        newPoint.distance = 0;
      } else {
        // Recalculate the distance between points
        newPoint.distance = Vec.dist(points[i - 1], newPoint);
        this.length += newPoint.distance;
      }
      this.points.push(newPoint);
    }

    console.log(this);
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

  getIndextAtLength(length: number): number {
    if (length < 0 || this.points.length === 0) {
      return 0;
    }

    let currentLength = 0;
    for (let i = 0; i < this.points.length - 1; i++) {
      const len = this.points[i + 1].distance;
      if (currentLength + len >= length) {
        return i;
      }
      currentLength += len;
    }

    // If length is greater than the total length, return the last point
    return this.points.length - 1;
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

  cut(offset: number): [Stroke, Stroke] {
    const cutIndex = this.getIndextAtLength(offset);
    const cutPoint = this.getPointAtLength(offset);

    const leftSide: Array<StrokePoint> = this.points.slice(0, cutIndex + 1);
    leftSide.push(cutPoint);
    const leftStroke = new Stroke(this.color, this.weight);
    leftStroke.setPoints(leftSide);

    const rightSide: Array<StrokePoint> = this.points.slice(cutIndex + 1);
    rightSide.unshift(StrokePoint.clone(cutPoint));
    const rightStroke = new Stroke(this.color, this.weight);
    rightStroke.setPoints(rightSide);

    return [leftStroke, rightStroke];
  }

  render(r: Render) {
    r.poly(this.points, stroke("red", 0.5), false);

    // Render the points
    for (const pt of this.points) {
      r.circle(pt.x, pt.y, 2, fill("red"));
    }
  }
}

export type CutPoint = {
  stroke_id: number;
  offset: number;
};
