import { MouseData } from "input";
import Stroke from "materials/ink/stroke";
import StrokeManager from "materials/ink/stroke-manager";
import BeamManager from "materials/beam/beam-manager";

import { Tool } from "./tool-manager";
import Render, { fill } from "render";
import { Point } from "geom/point";
import { Vec } from "geom/vec";

export default class DrawTool implements Tool {
  strokemanager: StrokeManager;
  beammanager: BeamManager;

  stroke: Stroke | null = null;

  color: string;
  weight: number;
  brush: string;

  active: boolean = false;

  position: Point = { x: 0, y: 0 };

  constructor(strokemanager: StrokeManager, beammanager: BeamManager) {
    this.strokemanager = strokemanager;
    this.beammanager = beammanager;

    this.color = "#000000";
    this.brush = "brush";
    this.weight = 1;
  }

  onMouseDown(p: MouseData): void {
    this.stroke = new Stroke(this.color, this.weight, this.brush);
    p.world = this.position;
    this.stroke.addPoint(p);
    this.strokemanager.addStroke(this.stroke);
  }

  onMouseMove(p: MouseData) {
    let snap = this.beammanager.getClosetPointsOnBeams(p.world);
    if (snap.length > 0) {
      const points = snap.map((s) => {
        const maxDist = 100; // Maximum distance where snapping has any effect
        const dist = Vec.dist(s, p.world);
        // Square the strength to make it more non-linear
        const strength = Math.pow(Math.max(0, 1 - dist / maxDist), 2);

        return Vec.lerp(p.world, s, strength);
      });
      this.position = Point.avg(points);
    } else {
      this.position = p.world;
    }
  }

  onMouseDrag(p: MouseData): void {
    if (this.stroke) {
      p.world = this.position;
      this.stroke.addPoint(p);
    }
  }

  onMouseUp(_p: MouseData): void {
    if (this.stroke) {
      this.stroke = null;
    }
  }

  render(r: Render) {
    r.circle(this.position.x, this.position.y, 4, fill("black"));
  }
}
