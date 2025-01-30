import StrokeManager from "materials/ink/stroke-manager";
import BeamManager from "materials/beam/beam-manager";
import { AreaInfluence } from "./area";
import { Point } from "geom/point";
import Render, { fill } from "render";

// The deformer holds references for each stroke point deformed
export class Deformer {
  strokemanager: StrokeManager;
  beammanager: BeamManager;

  influencePoints: Array<AreaInfluence>;

  constructor(strokemanager: StrokeManager, beammanager: BeamManager) {
    this.strokemanager = strokemanager;
    this.beammanager = beammanager;

    this.influencePoints = [];
  }

  attach(p: Point) {
    let influence = this.beammanager.getInfluence(p);
    if (influence) {
      this.influencePoints.push(influence);
    }
  }

  render(r: Render) {
    for (let influence of this.influencePoints) {
      let p = this.beammanager.getPointFromInfluence(influence);
      r.circle(p.x, p.y, 5, fill("red"));
    }
  }
}

// For the sub area we hold a list of poly edges
