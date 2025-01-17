import Render from "./render";
import Beam from "./beam";
import { Point } from "./geom/point";
import StrokeManager from "./stroke-manager";
import { Vec } from "./geom/vec";

export default class BeamManager {
  strokemanager: StrokeManager;
  beams: Map<number, Beam> = new Map();
  ids: number = 0;

  constructor(strokemanager: StrokeManager) {
    this.strokemanager = strokemanager;
    this.beams = new Map();
  }

  addBeam(): Beam {
    let b = new Beam(this.strokemanager);
    let id = this.ids++;
    this.beams.set(id, b);
    return b;
  }

  removeBeam(id: number) {
    this.beams.delete(id);
  }

  getBeam(id: number): Beam {
    return this.beams.get(id)!;
  }

  getControlPointNear(p: Point): Point | null {
    for (const beam of this.beams.values()) {
      for (const cp of beam.controlPoints) {
        if (Math.abs(cp.x - p.x) < 5 && Math.abs(cp.y - p.y) < 5) {
          return cp;
        }
      }
    }
    return null;
  }

  updateStrokeIds(mappings: Map<number, Array<number>>) {
    for (const beam of this.beams.values()) {
    }
  }

  update() {
    for (const beam of this.beams.values()) {
      beam.update();
    }
  }

  getBeamNear(p: Point): Beam | null {
    let minDist = 10;
    let minBeam = null;

    for (const beam of this.beams.values()) {
      const pointOnBeam = beam.getClosestPointOnBeam(p);
      const dist = Vec.dist(p, pointOnBeam);
      if (dist < minDist) {
        minDist = dist;
        minBeam = beam;
      }
    }

    return minBeam;
  }

  render(r: Render) {
    this.beams.forEach((b) => {
      b.render(r);
    });
  }
}
