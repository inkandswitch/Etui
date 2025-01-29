import Render, { stroke, fill, fillAndStroke } from "render";

import { Point } from "geom/point";
import { Vec } from "geom/vec";

import { Id } from "materials/id";

import ControlPoint from "./control-point";
import Beam from "./beam";
import { Polygon } from "geom/polygon";

export default class BeamManager {
  points: Map<Id, ControlPoint> = new Map();
  beams: Map<Id, Beam> = new Map();

  potentialAreas: Map<string, Array<Id>> = new Map();

  // CONTROL POINTS
  addControlPoint(point: Point): ControlPoint {
    const cp = new ControlPoint(point);
    this.points.set(cp.id, cp);
    return cp;
  }

  findControlPointNear(point: Point): ControlPoint | null {
    for (const cp of this.points.values()) {
      if (Vec.dist(cp.point, point) < 5) {
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
    const cp = this.points.get(id);
    if (cp) {
      cp.move(point);
      for (const beamId of cp.beams) {
        this.updateBeam(beamId);
      }
    }
  }

  mergeControlPoint(id: Id) {
    const controlPoint = this.points.get(id)!;
    const mergeDist = 5;

    for (const otherPoint of this.points.values()) {
      if (otherPoint.id === id) {
        continue;
      }
      const dist = Vec.dist(otherPoint.point, controlPoint.point);
      if (dist < mergeDist) {
        this.replaceControlPoint(otherPoint.id, controlPoint.id);
        controlPoint.move(otherPoint.point);
      }
    }

    // Update the beams that are connected to the control point
    for (const beamId of controlPoint.beams) {
      this.updateBeam(beamId);
    }

    console.log(this);
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
    const beam = this.beams.get(id);
    if (beam) {
      beam.updatePath(this.getControlPointPositions(beam.controlPoints));
    }
  }

  // AREAS
  findAreas() {
    // Find areas by finding the shortest cycles for each control point
    // Then, for each point, we add at most one cycle, avoiding duplicates
    // This will return the minimum Cycle Basis

    const getUniqueStamp = (ids: Array<Id>): string => {
      return [...ids].sort().join("-");
    };

    const potentialCycles = new Map<string, Array<Id>>

    for (const pt of this.points.keys()) {
      const cycles = this.getCyclesForControlPoint(pt);
      for (const cycle of cycles) {
        const stamp = getUniqueStamp(cycle);
        if (!potentialCycles.has(stamp)) {
          const cyclePoints = cycle.map((id) => this.points.get(id)!.point);
          const polygon = Polygon(cyclePoints);

          let hasInternalControlPoint = false;
          for (const point of this.points.values()) {
            if (!cycle.includes(point.id) && Polygon.isPointInside(polygon, point.point)) {
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

    const sortedCycles = Array.from(potentialCycles.values()).sort((a, b) => a.length - b.length);
    
    let foundCycles = new Map<string, Array<Id>>
    const pointsInCycles = new Set<Id>();

    for (const cycle of sortedCycles) {
      const newPoints = cycle.filter((id) => !pointsInCycles.has(id));
      if (newPoints.length > 0) {
        const stamp = getUniqueStamp(cycle);
        foundCycles.set(stamp, cycle);
        newPoints.forEach((id) => pointsInCycles.add(id));
      }
    }

    this.potentialAreas = foundCycles;
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

  // RENDERING
  renderBack(r: Render) {
    for (const beam of this.beams.values()) {
      beam.render(r);
    }

    for (const area of this.potentialAreas.values()) {
      const pts = area.map((id) => this.points.get(id)!.point);
      const inset = Polygon.offset(Polygon.ensureCounterclockwise(pts), -10);
      r.poly(inset, stroke("#00FF00", 0.5));
    }
  }

  renderFront(r: Render) {
    for (const cp of this.points.values()) {
      cp.render(r);
    }
  }
}

interface Area {
  controlPoints: Array<Id>;
  uniqueStamp: string;
}
