import { Point } from "../geom/point";
import { Vec } from "../geom/vec";
import Render, { fill } from "../render";
import Stroke from "../stroke";

import Beam, { BeamCoordinate } from "./beam";
import ControlPoint from "./control-point";

export default class BeamCluster {
  beams: Array<Beam>;
  controlPoints: Set<ControlPoint>;
  beamCoordinates: Array<Array<Array<BeamCoordinate>>>; // Stroke -> Point -> Beam -> BeamCoordinates

  constructor() {
    this.beams = [];
    this.controlPoints = new Set();
    this.beamCoordinates = [];
  }

  addBeam(beam: Beam) {
    this.beams.push(beam);
    for (const cp of beam.controlPoints) {
      this.controlPoints.add(cp);
    }
  }

  getControlPointNear(p: Point): ControlPoint | null {
    for (const cp of this.controlPoints) {
      if (Vec.dist(cp.point, p) < 5) {
        return cp;
      }
    }
    return null;
  }

  mergeControlPoint(cp: ControlPoint) {
    for (const other of this.controlPoints) {
      if (other != cp && Vec.dist(cp.point, other.point) < 5) {
        cp.point = other.point;
        this.controlPoints.delete(other);

        for (const beam of this.beams) {
          beam.replaceControlPoint(other, cp);
        }
      }
    }
  }

  bindStrokes(strokes: Array<Stroke>) {
    this.beamCoordinates = [];
    for (const stroke of strokes) {
      let strokeCoordinates: Array<Array<BeamCoordinate>> = [];
      for (const point of stroke.points) {
        let pointCoordinates: Array<BeamCoordinate> = [];
        for (const beam of this.beams) {
          const bcoord = beam.getBeamCoordinatesForPoint(point);
          pointCoordinates.push(bcoord);
        }
        strokeCoordinates.push(pointCoordinates);
      }
      this.beamCoordinates.push(strokeCoordinates);
    }
  }

  update(strokes: Array<Stroke>) {
    if (this.beamCoordinates.length == 0) return;

    for (const [s, stroke] of strokes.entries()) {
      for (const [p, point] of stroke.points.entries()) {
        const newPos = { x: 0, y: 0 };
        let totalWeight = 0;

        for (const [b, beam] of this.beams.entries()) {
          const bcoord = this.beamCoordinates[s][p][b];
          if (bcoord.t < 0 || bcoord.t > 1) {
            continue;
          }

          const weight = 1 / (1 + Math.abs(bcoord.u)); // Falloff function: higher weight when u is closer to 0
          const np = beam.getPointForBeamCoordinates(bcoord);

          newPos.x += np.x * weight;
          newPos.y += np.y * weight;
          totalWeight += weight;
        }

        if (totalWeight > 0) {
          newPos.x /= totalWeight;
          newPos.y /= totalWeight;
          point.x = newPos.x;
          point.y = newPos.y;
        }
      }
      stroke.recomputeLengths();
    }
  }

  render(r: Render) {
    for (const beam of this.beams) {
      beam.render(r);
    }

    for (const cp of this.controlPoints) {
      r.circle(cp.point.x, cp.point.y, 5, fill("red"));
    }
  }
}
