import StrokeManager from "materials/ink/stroke-manager";
import BeamManager from "materials/beam/beam-manager";
import { AreaInfluence } from "./area";
import { Point } from "geom/point";
import { StrokePoint } from "geom/strokepoint";
import Render, { fill } from "render";

import { Id } from "materials/id";
import { BeamInfluence } from "./beam";

// The deformer holds references for each stroke point deformed
export class Deformer {
  strokemanager: StrokeManager;
  beammanager: BeamManager;

  influencePerStroke: Map<number, Array<AreaInfluence | BeamInfluence | null>>;

  stagedStrokes: Array<Id> = [];

  constructor(strokemanager: StrokeManager, beammanager: BeamManager) {
    this.strokemanager = strokemanager;
    this.beammanager = beammanager;

    this.influencePerStroke = new Map();
  }

  attach(p: Point) {
    // let influence = this.beammanager.getInfluence(p);
    // if (influence) {
    //   this.influencePoints.push(influence);
    // }
  }

  computeInfluence() {
    this.influencePerStroke = new Map();

    for (const [id, stroke] of this.strokemanager.strokes) {
      const influences: Array<AreaInfluence | BeamInfluence | null> = [];
      for (let i = 0; i < stroke.points.length; i++) {
        const p = stroke.points[i];
        influences.push(this.beammanager.getInfluence(p));
      }
      this.influencePerStroke.set(id, influences);
    }
  }

  update() {
    for (const [id, stroke] of this.strokemanager.strokes) {
      const infleunces = this.influencePerStroke.get(id);
      if (infleunces) {
        for (let i = 0; i < stroke.points.length; i++) {
          const influence = infleunces[i];
          if (influence) {
            const newPoint = this.beammanager.getPointFromInfluence(influence);
            StrokePoint.moveTo(stroke.points[i], newPoint);
          }
        }
      }
      stroke.recomputeLengths();
    }
  }

  render(r: Render) {
    // for (let influence of this.influencePoints) {
    //   let p = this.beammanager.getPointFromInfluence(influence);
    //   r.circle(p.x, p.y, 5, fill("red"));
    // }
  }
}

// For the sub area we hold a list of poly edges
