import { Id } from "materials/id";
import { Point } from "geom/point";
import { Vec } from "geom/vec";
import { CCWPolygon, Polygon } from "geom/polygon";
import Render, { fill, font } from "render";

export default class Area {
  id: Id;
  stamp: string; // Uniquely identify an area by it's controlpoints

  controlPoints: Array<Id> = [];

  polyPoints: CCWPolygon = CCWPolygon([]);
  midPoint: Point = Point(0, 0);

  constructor(pts: Array<Id>) {
    this.id = Id();
    this.controlPoints = pts;
    this.stamp = generateAreaStamp(this.controlPoints);
  }

  updatePath(ctrl: Array<Point>) {
    const poly = CCWPolygon(ctrl);
    const polypoints = [];

    // for (let i = 0; i < poly.length; i++) {
    //   const p1 = poly[i];
    //   const p2 = poly[(i + 1) % poly.length];

    //   const numIntermediatePoints = 2;
    //   for (let j = 0; j <= numIntermediatePoints; j++) {
    //     const t = j / (numIntermediatePoints + 1);
    //     const intermediatePoint = Point(
    //       p1.x * (1 - t) + p2.x * t,
    //       p1.y * (1 - t) + p2.y * t,
    //     );
    //     polypoints.push(intermediatePoint);
    //   }
    // }
    // this.polyPoints = polypoints as CCWPolygon;
    this.polyPoints = poly;

    this.midPoint = Polygon.centroid(this.polyPoints);
  }

  getInfluence(p: Point): AreaInfluence {
    // Get the inscribed polygon
    const convexPoly = Polygon.largestConvexContaining(this.polyPoints, p);
    //const convexPoly = Polygon.ensureCounterclockwise(Polygon.findInscribedConvexWithPoint(this.polyPoints, p));

    // Get indexes in larger polygon
    const convexPolyIndexes = convexPoly.map((p) => this.polyPoints.indexOf(p));

    // Get wachspress weights
    const wachspressCoords = Polygon.wachspressCoords(convexPoly, p);

    const weights = wachspressCoords.map((w, i) => {
      return {
        index: convexPolyIndexes[i],
        weight: w,
      };
    });

    return {
      id: this.id,
      weights,
    };
  }

  pointFromInfluence(influence: AreaInfluence): Point {
    const convexPoly = influence.weights.map((w) => this.polyPoints[w.index]);
    return Polygon.pointFromWachspressCoords(
      convexPoly as CCWPolygon,
      influence.weights.map((w) => w.weight),
    );
  }

  render(r: Render) {
    const inset = Polygon.offset(this.polyPoints, -10);
    r.poly(inset, fill("#0000FF10"), true);

    r.circle(this.midPoint.x, this.midPoint.y, 2, fill("#8050FF"));

    r.text(
      this.id,
      this.midPoint.x + 5,
      this.midPoint.y - 5,
      font("10px monospace", "#8050FF"),
    );
  }
}

export function generateAreaStamp(ids: Array<Id>): string {
  return [...ids].sort().join("-");
}

export type AreaInfluence = {
  id: Id;
  weights: Array<AreaInfluenceWeight>;
};
export type AreaInfluenceWeight = {
  index: number;
  weight: number;
};
