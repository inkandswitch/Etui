import Render, { stroke } from "render";
import { Point } from "geom/point";
import { Vec } from "geom/vec";
import { Id } from "materials/id";

import Beam from "./beam";
import ControlPoint from "./control-point";
import { LinePath, CirclePath, CurvePath } from "./path";
import { Area, AreaDescriptor } from "./area";

export default class BeamManager {
  controlPoints: Map<Id, ControlPoint> = new Map();
  beams: Map<Id, Beam> = new Map();
  areas: Map<Id, Area> = new Map();

  // Potential areas
  areaDescriptors: Array<AreaDescriptor> = [];

  influence: Array<number> = [];
  influencePoints: Array<Point> = [];
  averagePoint: Point = { x: 0, y: 0 };

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
    this.updateBeamsForControlPoint(id);
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
    this.updateBeamsForControlPoint(controlPoint.id);

    //this.findAreaDescriptors();
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

  addBeam(controlPoints: Array<Id>, type: string): Beam {
    let path = new LinePath();
    if (type == "circle") {
      path = new CirclePath();
    } else if (type == "curve") {
      path = new CurvePath();
    }

    const beam = new Beam(controlPoints, path);
    this.beams.set(beam.id, beam);

    for (const cp of controlPoints) {
      this.controlPoints.get(cp)!.addBeam(beam.id);
    }

    this.updateBeam(beam.id);
    return beam;
  }

  addControlPointToBeam(beamId: Id, controlPointId: Id) {
    const beam = this.beams.get(beamId)!;
    beam.addControlPoint(controlPointId);
    this.controlPoints.get(controlPointId)!.addBeam(beamId);
    this.updateBeam(beamId);
  }

  removeBeam(id: Id) {
    this.beams.delete(id);
  }

  updateBeamsForControlPoint(id: Id) {
    const cp = this.controlPoints.get(id)!;
    for (const beamId of cp.beams) {
      this.updateBeam(beamId);
    }
  }

  updateBeam(id: Id) {
    const beam = this.beams.get(id)!;
    const points = beam.controlPoints.map(
      (id) => this.controlPoints.get(id)!.point,
    );
    beam.updatePath(points);
  }

  getBeam(id: Id): Beam {
    return this.beams.get(id)!;
  }

  getClosetPointsOnBeams(p: Point): Array<Point> {
    let minDist = 100;
    let points = [];

    for (const beam of this.beams.values()) {
      const pointOnBeam = beam.getClosestPointOnBeam(p);
      const dist = Vec.dist(p, pointOnBeam);
      if (dist < minDist) {
        points.push(pointOnBeam);
      }
    }

    return points;
  }

  computeInfluence(p: Point) {
    //let beamInfluence
    // let points: Array<Point> = [];
    // let influence: Array<number> = [];
    // for (const beam of this.beams.values()) {
    //   for (let i = 1; i < beam.pathPoints.length; i++) {
    //     points.push(beam.pathPoints[i]);
    //     influence.push(0);
    //   }
    // }
    // // for(const pt of this.controlPoints.values()) {
    // //   points.push(pt.point)
    // //   influence.push(0)
    // // }
    // for (let i = 0; i < points.length; i++) {
    //   for (let j = 0; j < points.length; j++) {
    //     const p1 = points[i];
    //     const p2 = points[j];
    //     if(p1 == p2) {
    //       continue;
    //     }
    //     // Perform operations with p1 and p2
    //     const lineVec = Vec.sub(p2, p1);
    //     const pointVec = Vec.sub(p, p1);
    //     const lineLenSq = Vec.dot(lineVec, lineVec);
    //     const projection = Vec.dot(pointVec, lineVec) / lineLenSq;
    //     const clampedProjection = Math.max(0, Math.min(1, projection));
    //     // Sum weights
    //     influence[i] += 1 - clampedProjection;
    //     influence[j] += clampedProjection;
    //   }
    //}
    // Normalize influence so they sum to 1
    // const totalInfluence = influence.reduce((acc, val) => acc + val, 0);
    // if (totalInfluence > 0) {
    //   influence = influence.map(val => val / totalInfluence);
    // }
    // this.influence = influence
    // this.influencePoints = points
    // this.averagePoint = points.reduce((acc, point, index) => {
    //   acc.x += point.x * influence[index];
    //   acc.y += point.y * influence[index];
    //   return acc;
    // }, { x: 0, y: 0 });
  }

  renderBottom(r: Render) {
    for (const beam of this.beams.values()) {
      beam.render(r);
    }
  }

  renderTop(r: Render) {
    for (const cp of this.controlPoints.values()) {
      cp.render(r);
    }

    for (let i = 0; i < this.influencePoints.length; i++) {
      const point = this.influencePoints[i];
      const influenceValue = this.influence[i];
      r.circle(
        point.x,
        point.y,
        influenceValue * 10 * this.influencePoints.length,
        stroke(`red`, 0.5),
      );
    }

    r.circle(this.averagePoint.x, this.averagePoint.y, 5, stroke("blue", 1));
  }
}
