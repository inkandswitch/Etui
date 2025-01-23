import Render from "../../render";
import { Point } from "../../geom/point";
import { Vec } from "../../geom/vec";
import { Id } from "../id";

import Beam from "./beam";
import ControlPoint from "./control-point";

export default class BeamManager {
  beams: Map<Id, Beam> = new Map();
  controlPoints: Map<Id, ControlPoint> = new Map();

  constructor() {
    this.beams = new Map();
    this.controlPoints = new Map();
  }

  findOrAddControlPoint(point: Point): ControlPoint {
    const found = this.findControlPointNear(point);
    if (found !== null) {
      return found;
    }
    return this.addControlPoint(point);
  }

  addControlPoint(point: Point): ControlPoint {
    const controlPoint = new ControlPoint(point);
    this.controlPoints.set(controlPoint.id, controlPoint);
    return controlPoint;
  }

  moveControlPoint(id: Id, point: Point) {
    let cp = this.controlPoints.get(id)!;
    cp.move(point);
    for (const bid of cp.beams) {
      this.updateBeam(bid);
    }
  }

  mergeControlPoint(id: Id) {
    const controlPoint = this.controlPoints.get(id)!;
    const mergeDist = 5;

    for (const otherPoint of this.controlPoints.values()) {
      if (otherPoint.id === id) {
        continue;
      }
      const dist = Vec.dist(otherPoint.point, controlPoint.point);
      if (dist < mergeDist) {
        this.replaceControlPoint(otherPoint.id, controlPoint.id);
        controlPoint.move(otherPoint.point);
      }
    }
  }

  replaceControlPoint(old: Id, replacement: Id) {
    for (const beam of this.beams.values()) {
      beam.replaceControlPoint(old, replacement);
    }
    this.controlPoints.delete(old);
  }

  findControlPointNear(point: Point): ControlPoint | null {
    let minDist = 5;
    let minControlPoint: ControlPoint | null = null;

    for (const controlPoint of this.controlPoints.values()) {
      const dist = Vec.dist(controlPoint.point, point);
      if (dist < minDist) {
        minDist = dist;
        minControlPoint = controlPoint;
      }
    }

    return minControlPoint;
  }

  addBeam(controlPoints: Array<Id>): Beam {
    const beam = new Beam(controlPoints);
    this.beams.set(beam.id, beam);

    for (const cp of controlPoints) {
      this.controlPoints.get(cp)!.addBeam(beam.id);
    }

    this.updateBeam(beam.id);
    return beam;
  }

  removeBeam(id: Id) {
    this.beams.delete(id);
  }

  updateBeam(id: Id) {
    console.log(this);
    const beam = this.beams.get(id)!;
    const points = beam.controlPoints.map(
      (id) => this.controlPoints.get(id)!.point,
    );
    beam.updateCurve(points);
  }

  getBeam(id: Id): Beam {
    return this.beams.get(id)!;
  }

  render(r: Render) {
    for (const beam of this.beams.values()) {
      beam.render(r);
    }
  }

  // getBeamNear(p: Point): Beam | null {
  //   let minDist = 10;
  //   let minBeam = null;

  //   for (const beam of this.beams.values()) {
  //     const pointOnBeam = beam.getClosestPointOnBeam(p);
  //     const dist = Vec.dist(p, pointOnBeam);
  //     if (dist < minDist) {
  //       minDist = dist;
  //       minBeam = beam;
  //     }
  //   }

  //   return minBeam;
  // }
}
