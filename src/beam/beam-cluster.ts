import { Point } from "../geom/point";
import { Polygon, WachspressCoords } from "../geom/polygon";
import { Vec } from "../geom/vec";
import Render, { fill } from "../render";
import Stroke from "../stroke";

import Beam, { BeamCoordinate } from "./beam";
import ControlPoint from "./control-point";

export default class BeamCluster {
  beams: Array<Beam>;
  controlPoints: Set<ControlPoint>;
  //beamCoordinates: Array<Array<Array<BeamCoordinate>>>; // Stroke -> Point -> Beam -> BeamCoordinates
  wpCoordinates: Array<Array<WachspressCoords>>; // Stroke -> Point -> WachspressCoords

  constructor() {
    this.beams = [];
    this.controlPoints = new Set();
    //this.beamCoordinates = [];
    this.wpCoordinates = [];
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

  getPolygonPoints(): Polygon {
    if (this.beams.length === 0) return [];

    const points: Point[] = [];
    const visited = new Set<Beam>();
    let currentBeam = this.beams[0];
    let lastPoint = currentBeam.controlPoints[0];

    // Walk through connected beams to form polygon
    while (currentBeam && !visited.has(currentBeam)) {
      visited.add(currentBeam);
      points.push(lastPoint.point);

      // Get the other control point of current beam
      const endPoint =
        currentBeam.controlPoints[0] === lastPoint
          ? currentBeam.controlPoints[1]
          : currentBeam.controlPoints[0];

      // Find next beam that shares this control point
      currentBeam = this.beams.find(
        (beam) => !visited.has(beam) && beam.controlPoints.includes(endPoint),
      )!;

      lastPoint = endPoint;
    }

    return points;
  }

  bindStrokes(strokes: Array<Stroke>) {
    this.wpCoordinates = [];

    // Const beam polygon
    const polygon = Polygon.ensureCounterclockwise(this.getPolygonPoints());

    for (const stroke of strokes) {
      let strokeCoordinates: Array<WachspressCoords> = [];
      for (const point of stroke.points) {
        const coords = Polygon.wachspressCoords(polygon, point);
        strokeCoordinates.push(coords);
      }
      this.wpCoordinates.push(strokeCoordinates);
    }
  }

  update(strokes: Array<Stroke>) {
    if (this.wpCoordinates.length == 0) return;

    const polygon = Polygon.ensureCounterclockwise(this.getPolygonPoints());

    for (const [s, stroke] of strokes.entries()) {
      for (const [p, point] of stroke.points.entries()) {
        const wpCoords = this.wpCoordinates[s][p];
        const newPoint = Polygon.pointFromWachspressCoords(polygon, wpCoords);
        point.x = newPoint.x;
        point.y = newPoint.y;
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
