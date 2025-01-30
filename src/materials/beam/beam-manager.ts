import Render, { stroke, fill } from "render";

import { Point } from "geom/point";
import { Vec } from "geom/vec";
import { Line } from "geom/line";

import { Id } from "materials/id";

import ControlPoint from "./control-point";
import Beam from "./beam";
import Area from "./area";

import { Polygon } from "geom/polygon";

export default class BeamManager {
  points: Map<Id, ControlPoint> = new Map();
  beams: Map<Id, Beam> = new Map();
  areas: Map<Id, Area> = new Map();
  areasByStamp: Map<string, Id> = new Map();

  computedInfluence: Point | null = null;
  // influence: PolygonInfluence | null = null;
  // visibilityPoly: Polygon | null = null;

  // CONTROL POINTS
  addControlPoint(point: Point): ControlPoint {
    const cp = new ControlPoint(point);
    this.points.set(cp.id, cp);
    return cp;
  }

  findControlPointNear(point: Point): ControlPoint | null {
    for (const cp of this.points.values()) {
      if (Vec.dist(cp.point, point) < 10) {
        return cp;
      }
    }
    return null;
  }

  findOrAddControlPoint(point: Point): ControlPoint {
    const found = this.findControlPointNear(point);
    if (found !== null) {
      return found;
    }
    return this.addControlPoint(point);
  }

  moveControlPoint(id: Id, point: Point) {
    const cp = this.points.get(id)!;
    cp.move(point);
    for (const beamId of cp.beams) {
      this.updateBeam(beamId);
    }

    // Update beams
    // TODO: this is innefficient, we should only update the beams that are connected to the control point
    for (const areaId of this.areas.keys()) {
      this.updateArea(areaId);
    }
  }

  mergeControlPoint(id: Id) {
    let controlPoint = this.points.get(id)!;
    const mergeDist = 5;

    for (const otherPoint of this.points.values()) {
      if (otherPoint.id === id) {
        continue;
      }
      const dist = Vec.dist(otherPoint.point, controlPoint.point);
      if (dist < mergeDist) {
        this.replaceControlPoint(controlPoint.id, otherPoint.id);
        controlPoint = otherPoint;
      }
    }

    // Update the beams that are connected to the control point
    for (const beamId of controlPoint.beams) {
      this.updateBeam(beamId);
    }

    // Find valid areas
    this.findAreas();
  }

  replaceControlPoint(old: Id, replacement: Id) {
    const oldControlPoint = this.points.get(old)!;
    const replacementControlPoint = this.points.get(replacement)!;

    // Transfer beams from old control point to replacement control point
    for (const beamId of oldControlPoint.beams) {
      replacementControlPoint.addBeam(beamId);
    }

    // Update beams to reference the replacement control point
    for (const beamId of oldControlPoint.beams) {
      const beam = this.beams.get(beamId);
      if (beam) {
        beam.replaceControlPoint(old, replacement);
        this.updateBeam(beamId);
      }
    }

    this.points.delete(old);
  }

  getControlPointPositions(ids: Array<Id>): Array<Point> {
    return ids.map((id) => this.points.get(id)!.point);
  }

  // BEAMS
  addBeam(pts: Array<Id>): Beam {
    const beam = new Beam(pts);
    this.beams.set(beam.id, beam);
    for (const id of pts) {
      this.points.get(id)!.addBeam(beam.id);
    }
    this.updateBeam(beam.id);
    return beam;
  }

  updateBeam(id: Id) {
    const beam = this.beams.get(id)!;
    beam.updatePath(this.getControlPointPositions(beam.controlPoints));
  }

  findBeamNear(p: Point): Beam | null {
    let closestBeam: Beam | null = null;
    let minDistance = 10;

    for (const beam of this.beams.values()) {
      const closestPoint = beam.closestPointOnBeam(p);
      if (closestPoint) {
        const distance = Vec.dist(p, closestPoint);
        if (distance < minDistance) {
          minDistance = distance;
          closestBeam = beam;
        }
      }
    }

    return closestBeam;
  }

  // AREAS
  addArea(cycle: Array<Id>): Area {
    const area = new Area(cycle);
    this.areas.set(area.id, area);
    this.areasByStamp.set(area.stamp, area.id);
    this.updateArea(area.id);
    return area;
  }

  updateArea(id: Id) {
    const area = this.areas.get(id)!;
    area.updatePath(this.getControlPointPositions(area.controlPoints));
  }

  removeArea(id: Id) {
    const area = this.areas.get(id)!;
    this.areasByStamp.delete(area.stamp);
    this.areas.delete(id);
  }

  findAreaNear(p: Point): Area | null {
    // return area if point is inside
    for (const area of this.areas.values()) {
      if (Polygon.isPointInside(area.polyPoints, p)) {
        return area;
      }
    }
    return null;
  }

  // TODO: this is still kinda wrong, and innefficient, will fix this later
  findAreas() {
    // Find areas by finding the shortest cycles for each control point
    // Then, for each point, we add at most one cycle, avoiding duplicates
    // This will return the minimum Cycle Basis

    const getUniqueStamp = (ids: Array<Id>): string => {
      return [...ids].sort().join("-");
    };

    const potentialCycles = new Map<string, Array<Id>>();

    for (const pt of this.points.keys()) {
      const cycles = this.getCyclesForControlPoint(pt);
      for (const cycle of cycles) {
        const stamp = getUniqueStamp(cycle);
        if (!potentialCycles.has(stamp)) {
          const cyclePoints = cycle.map((id) => this.points.get(id)!.point);
          const polygon = Polygon(cyclePoints);

          let hasInternalControlPoint = false;
          for (const point of this.points.values()) {
            if (
              !cycle.includes(point.id) &&
              Polygon.isPointInside(polygon, point.point)
            ) {
              hasInternalControlPoint = true;
              break;
            }
          }

          if (hasInternalControlPoint) {
            continue;
          }

          potentialCycles.set(stamp, cycle);
        }
      }
    }

    const sortedCycles = Array.from(potentialCycles.values()).sort(
      (a, b) => a.length - b.length,
    );

    let foundCycles = new Map<string, Array<Id>>();
    const pointsInCycles = new Set<Id>();

    for (const cycle of sortedCycles) {
      const newPoints = cycle.filter((id) => !pointsInCycles.has(id));
      if (newPoints.length > 0) {
        const stamp = getUniqueStamp(cycle);
        foundCycles.set(stamp, cycle);
        newPoints.forEach((id) => pointsInCycles.add(id));
      }
    }

    // Update the areas map
    for (const [stamp, cycle] of foundCycles) {
      if (!this.areasByStamp.has(stamp)) {
        this.addArea(cycle);
      }
    }

    // Remove areas that do not exist in found cycles
    for (const area of this.areas.values()) {
      if (!foundCycles.has(area.stamp)) {
        this.removeArea(area.id);
      }
    }

    console.log(foundCycles, this.areas);
  }

  getCyclesForControlPoint(startId: Id): Array<Array<Id>> {
    const visited = new Set<Id>();
    const cycles: Array<Array<Id>> = [];
    const dfs = (currentId: Id, path: Array<Id>) => {
      if (path.length > 2 && visited.has(currentId)) {
        const cycleStartIndex = path.indexOf(currentId);
        if (cycleStartIndex !== -1) {
          cycles.push(path);
        }
        return;
      }

      visited.add(currentId);

      const currentPoint = this.points.get(currentId)!;
      for (const beamId of currentPoint.beams) {
        const beam = this.beams.get(beamId)!;
        for (const nextId of beam.controlPoints) {
          if (nextId !== currentId && !path.includes(nextId)) {
            dfs(nextId, [...path, nextId]);
          }
        }
      }

      visited.delete(currentId);
    };

    dfs(startId, []);

    // Return cycles, sorted shortest to longest
    if (cycles.length === 0) {
      return cycles;
    }

    return cycles;
  }

  // INFLUENCE

  getInfluence(p: Point) {
    // Check if point is inside any of the areas
    for (const area of this.areas.values()) {
      if (Polygon.isPointInside(area.polyPoints, p)) {
        this.computedInfluence = p;
        return;
      }
    }

    this.computedInfluence = null;
  }
  //   // Check if point is inside any of the potential areas
  //   for (const [id, area] of this.potentialAreas) {
  //     const pts = area.map((id) => this.points.get(id)!.point);
  //     const polygon = Polygon(pts);
  //     if (Polygon.isPointInside(polygon, p)) {
  //       let influence = computePolygonInfluence(polygon, p);
  //       this.influence = {
  //         stamp: id,
  //         influence,
  //       };

  //       this.visibilityPoly = Polygon.largestConvexContaining(
  //         Polygon.ensureCounterclockwise(polygon),
  //         p,
  //       );

  //       const visibilityPolyIds = this.visibilityPoly
  //         .map((point) => {
  //           for (const [id, controlPoint] of this.points) {
  //             if (
  //               controlPoint.point.x === point.x &&
  //               controlPoint.point.y === point.y
  //             ) {
  //               return id;
  //             }
  //           }
  //           return null;
  //         })
  //         .filter((id) => id !== null);

  //       console.log(visibilityPolyIds);

  //       return;
  //     }
  //   }

  //   this.influence = null;
  //   this.visibilityPoly = null;
  //   // Else return the closest beam
  // }

  // RENDERING
  renderBack(r: Render) {
    for (const beam of this.beams.values()) {
      beam.render(r);
    }

    for (const area of this.areas.values()) {
      area.render(r);
    }
    // for (const area of this.potentialAreas.values()) {
    //   const pts = area.map((id) => this.points.get(id)!.point);
    //   const inset = Polygon.offset(Polygon.ensureCounterclockwise(pts), -10);
    //   r.poly(inset, stroke("#00FF00", 0.5));
    // }
  }

  renderFront(r: Render) {
    for (const cp of this.points.values()) {
      cp.render(r);
    }

    if (this.computedInfluence) {
      r.circle(
        this.computedInfluence.x,
        this.computedInfluence.y,
        5,
        fill("#00FF00"),
      );
    }

    // if (this.influence) {
    //   let polygonPoints = this.potentialAreas.get(this.influence.stamp)!;
    //   let polygon = polygonPoints.map((id) => this.points.get(id)!.point);
    //   const influencePoint = computePointFromPolygonInfluence(
    //     polygon,
    //     this.influence.influence,
    //   );
    //   console.log(influencePoint);
    //   r.circle(influencePoint.x, influencePoint.y, 5, fill("#00FF00"));

    //   for (let i = 0; i < polygon.length; i++) {
    //     const coord = this.influence.influence[i];
    //     if (coord !== null) {
    //       const start = polygon[i];
    //       const end = polygon[(i + 1) % polygon.length];
    //       const edge = Line(start, end);

    //       // Deproject the point from the line using the t and offset values
    //       const point = Line.pointAtT(edge, coord.t);
    //       r.circle(point.x, point.y, 2, fill("red"));
    //     }
    //   }
    // }

    // if (this.visibilityPoly) {
    //   r.poly(this.visibilityPoly, stroke("#FF0000", 0.5));
    // }

    // if (this.influencePoint) {
    //   r.circle(
    //     this.influencePoint.x,
    //     this.influencePoint.y,
    //     5,
    //     fill("#00FF00"),
    //   );
    // }
  }
}

// interface Area {
//   controlPoints: Array<Id>;
//   uniqueStamp: string;
// }

// type EdgeOffsetCoordinate = {
//   t: number;
//   offset: number;
// };

// type PolygonInfluence = {
//   stamp: string;
//   influence: Array<null | EdgeOffsetCoordinate>;
// };

// function computePolygonInfluence(
//   polygon: Polygon,
//   point: Point,
// ): Array<null | EdgeOffsetCoordinate> {
//   const results: Array<null | EdgeOffsetCoordinate> = [];

//   // Iterate through each edge of the polygon
//   for (let i = 0; i < polygon.length; i++) {
//     const start = polygon[i];
//     const end = polygon[(i + 1) % polygon.length];
//     const edge = Line(start, end);

//     // Project the point onto the line
//     const projection = Line.projectPoint(edge, point);
//     // Only include projections that fall on the line segment (0 <= t <= 1)
//     if (projection.t >= 0 && projection.t <= 1) {
//       results.push({
//         t: projection.t,
//         offset: Math.abs(projection.u),
//       });
//     } else {
//       results.push(null);
//     }
//   }

//   // Calculate the sum of all non-null offsets
//   const totalOffset = results.reduce((sum, coord) => {
//     if (coord !== null) {
//       // Invert the influence by using 1/offset
//       // Add small epsilon to avoid division by zero
//       return sum + 1 / (coord.offset + 0.0001);
//     }
//     return sum;
//   }, 0);

//   // Normalize the inverted offsets
//   for (let i = 0; i < results.length; i++) {
//     if (results[i] !== null) {
//       // Invert and normalize the offset
//       results[i]!.offset = 1 / (results[i]!.offset + 0.0001) / totalOffset;
//     }
//   }

//   console.log(results);

//   return results;
// }

// function computePointFromPolygonInfluence(
//   polygon: Polygon,
//   influence: Array<null | EdgeOffsetCoordinate>,
// ): Point {
//   let x = 0;
//   let y = 0;

//   let pointcount = 0;

//   for (let i = 0; i < polygon.length; i++) {
//     const coord = influence[i];
//     if (coord !== null) {
//       pointcount++;
//       const start = polygon[i];
//       const end = polygon[(i + 1) % polygon.length];
//       const edge = Line(start, end);

//       // Deproject the point from the line using the t and offset values
//       const point = Line.pointAtT(edge, coord.t);

//       // Accumulate the weighted coordinates
//       x += point.x * coord.offset;
//       y += point.y * coord.offset;
//     }
//   }

//   return Point(x, y);
// }
