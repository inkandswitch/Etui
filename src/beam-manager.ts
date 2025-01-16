import Render from "./render";
import Beam from "./beam";
import { Point } from "./geom/point";

export default class BeamManager {
  beams: Map<number, Beam> = new Map();
  ids: number = 0;

  constructor() {
    this.beams = new Map();
  }

  addBeam(b: Beam): number {
    let id = this.ids++;
    this.beams.set(id, b);
    return id;
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

  render(r: Render) {
    this.beams.forEach((b) => {
      b.render(r);
    });
  }
}
