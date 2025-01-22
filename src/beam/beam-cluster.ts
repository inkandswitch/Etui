import { Point } from "../geom/point";
import { Polygon, CCWPolygon, WachspressCoords } from "../geom/polygon";
import { Vec } from "../geom/vec";
import Render, { fill, stroke } from "../render";
import Stroke from "../stroke";

import Beam, { BeamCoordinate } from "./beam";
import ControlPoint from "./control-point";

type StrokePointMapping = {
  polygon: number;
  wachspress: WachspressCoords;
};

export default class BeamCluster {
  beams: Array<Beam>;
  controlPoints: Set<ControlPoint>;
  //beamCoordinates: Array<Array<Array<BeamCoordinate>>>; // Stroke -> Point -> Beam -> BeamCoordinates
  wpCoordinates: Array<Array<StrokePointMapping>>; // Stroke -> Point -> WachspressCoords
  polygons: Array<Array<number>>;

  constructor() {
    this.beams = [];
    this.controlPoints = new Set();
    //this.beamCoordinates = [];
    this.wpCoordinates = [];
    this.polygons = [];
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

  computePolygonPoints() {
    if (this.beams.length === 0) return [];

    const indices: number[] = [];
    const visited = new Set<Beam>();
    let currentBeam = this.beams[0];
    let lastPoint = currentBeam.controlPoints[0];

    // Convert controlPoints Set to Array for indexing
    const controlPointsArray = Array.from(this.controlPoints);

    // Walk through connected beams to form polygon
    while (currentBeam && !visited.has(currentBeam)) {
      visited.add(currentBeam);
      indices.push(controlPointsArray.indexOf(lastPoint));

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

    // Generate a CCW polygon from the indices
    const polygonPoints: Point[] = indices.map(
      (index) => controlPointsArray[index].point,
    );
    const ccwPolygon = Polygon.ensureCounterclockwise(polygonPoints);

    const polygons = Polygon.decompose(ccwPolygon);

    const mappedPolygons = polygons.map((polygon) =>
      polygon.map((point) =>
        controlPointsArray.findIndex(
          (cp) => cp.point.x === point.x && cp.point.y === point.y,
        ),
      ),
    );

    this.polygons = mappedPolygons;
  }

  bindStrokes(strokes: Array<Stroke>) {
    this.computePolygonPoints();
    this.wpCoordinates = [];

    const controlPointsArray = Array.from(this.controlPoints);
    const polygons = this.polygons.map((polygon) => {
      return polygon.map((index) => controlPointsArray[index].point);
    });

    console.log(polygons);

    for (const stroke of strokes) {
      let strokeCoordinates: Array<StrokePointMapping> = [];
      for (const point of stroke.points) {
        for (const [p, polygon] of polygons.entries()) {
          if (Polygon.isPointInside(polygon, point)) {
            const coords = Polygon.wachspressCoords(
              polygon as CCWPolygon,
              point,
            );
            strokeCoordinates.push({
              polygon: p,
              wachspress: coords,
            });
            break;
          }
        }
      }
      this.wpCoordinates.push(strokeCoordinates);
    }

    console.log(this.wpCoordinates);

    // for (const stroke of strokes) {
    //   let strokeCoordinates: Array<WachspressCoords> = [];
    //   for (const point of stroke.points) {
    //     const coords = Polygon.wachspressCoords(polygon, point);
    //     strokeCoordinates.push(coords);
    //   }
    //   this.wpCoordinates.push(strokeCoordinates);
    // }
  }

  update(strokes: Array<Stroke>) {
    if (this.wpCoordinates.length == 0) return;

    const controlPointsArray = Array.from(this.controlPoints);
    const polygons = this.polygons.map((polygon) => {
      return polygon.map((index) => controlPointsArray[index].point);
    });

    for (const [s, stroke] of strokes.entries()) {
      for (const [p, point] of stroke.points.entries()) {
        const wpMapping = this.wpCoordinates[s][p];
        const polygon = polygons[wpMapping.polygon];
        const newPoint = Polygon.pointFromWachspressCoords(
          polygon as CCWPolygon,
          wpMapping.wachspress,
        );
        point.x = newPoint.x;
        point.y = newPoint.y;
      }
      stroke.recomputeLengths();
    }

    // if (this.wpCoordinates.length == 0) return;
    // const polygon = Polygon.ensureCounterclockwise(this.getPolygonPoints());
    // for (const [s, stroke] of strokes.entries()) {
    //   for (const [p, point] of stroke.points.entries()) {
    //     const wpCoords = this.wpCoordinates[s][p];
    //     const newPoint = Polygon.pointFromWachspressCoords(polygon, wpCoords);
    //     point.x = newPoint.x;
    //     point.y = newPoint.y;
    //   }
    //   stroke.recomputeLengths();
    // }
  }

  render(r: Render) {
    for (const beam of this.beams) {
      beam.render(r);
    }

    for (const cp of this.controlPoints) {
      r.circle(cp.point.x, cp.point.y, 5, fill("red"));
    }

    const controlPointsArray = Array.from(this.controlPoints);

    if (this.polygons.length > 0) {
      const mappedPolygons = this.polygons.map((polygon) => {
        return polygon.map((index) => controlPointsArray[index].point);
      });

      for (const polygon of mappedPolygons) {
        r.poly(polygon, stroke("#FF000022", 2));
      }
    }
  }
}
