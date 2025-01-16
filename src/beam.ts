import { Point } from "./geom/point";
import { Vec } from "./geom/vec";
import Render, { stroke, fill } from "./render";
import Stroke from "./stroke";

export default class Beam {
  controlPoints: Array<Point>;
  stroke: Stroke;
  beamCoordinates: Array<BeamCoordinate>;

  constructor(stroke: Stroke) {
    this.controlPoints = [
      Point.fromStrokePoint(stroke.points[0]),
      Point.fromStrokePoint(stroke.points[stroke.points.length - 1]),
    ];
    this.stroke = stroke;

    // Generate beam coordinates  (t, u) for each point on the stroke
    // t is the distance along the stroke normalized to 0-1
    // u is the distance perpendicular to the stroke

    this.beamCoordinates = [];

    // Create vector for the beam
    const beamvec = Vec.sub(this.controlPoints[1], this.controlPoints[0]);

    for (const point of stroke.points) {
      const p = Point.fromStrokePoint(point);
      const vec = Vec.sub(p, this.controlPoints[0]);
      const t = Vec.dot(vec, beamvec) / Vec.dot(beamvec, beamvec);
      const u = Vec.cross(vec, beamvec) / Vec.len(beamvec);
      this.beamCoordinates.push({ t, u });
    }

    console.log(this);
  }

  update() {
    // Take the beam coordinates and use them to update the stroke points

    for (let i = 0; i < this.stroke.points.length; i++) {
      const p = this.stroke.points[i];
      const bc = this.beamCoordinates[i];
      const beamvec = Vec.sub(this.controlPoints[1], this.controlPoints[0]);
      const beamvecnorm = Vec.normalize(beamvec);
      const beamvecperp = Vec(beamvecnorm.y, -beamvecnorm.x);

      const newpoint = Vec.add(
        this.controlPoints[0],
        Vec.add(Vec.mul(beamvec, bc.t), Vec.mul(beamvecperp, bc.u)),
      );
      p.x = newpoint.x;
      p.y = newpoint.y;
    }

    this.stroke.recomputeLengths();
  }

  render(r: Render) {
    r.poly(this.controlPoints, stroke("#FF000055", 2));

    for (const pt of this.controlPoints) {
      r.circle(pt.x, pt.y, 5, fill("#FF0000"));
    }
  }
}

type BeamCoordinate = {
  t: number;
  u: number;
};
