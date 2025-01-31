import { MouseData } from "input";
import Stroke from "materials/ink/stroke";
import StrokeManager from "materials/ink/stroke-manager";
import BeamManager from "materials/beam/beam-manager";

import { Tool } from "./tool-manager";
import Render, { fill } from "render";
import { Point } from "geom/point";
import { Vec } from "geom/vec";
import { Line } from "geom/line";
import { StrokePoint } from "geom/strokepoint";

export default class DrawTool implements Tool {
  strokemanager: StrokeManager;
  beammanager: BeamManager;

  stroke: Stroke | null = null;

  color: string;
  weight: number;
  brush: string;

  active: boolean = false;

  position: Point = { x: 0, y: 0 };

  guides: boolean = false;

  neatify = 0;
  snappify = 0.7;
  setneatify: boolean = false;
  savedPoints: Array<Point> = [];

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
    this.position = p.world;

    if (this.guides) {
      let snap = this.beammanager.getClosestPointOnBeams(p.world);
      if (snap) {
        if (Vec.dist(snap, p.world) < 20) {
          this.position = Vec.lerp(p.world, snap, this.snappify);
        }
      }
    }
  }

  onMouseDrag(p: MouseData): void {
    if (this.setneatify) {
      this.neatify += p.delta.y / 100;
      if (this.neatify > 2) {
        this.neatify = 2;
      } else if (this.neatify < -0.5) {
        this.neatify = -0.5;
      }

      console.log(this.neatify);
      this.neatifyStroke();
      return;
    }
    if (this.stroke) {
      p.world = this.position;
      this.stroke.addPoint(p);
    }
  }

  onMouseUp(_p: MouseData): void {
    if (this.stroke) {
      this.stroke = null;
    }
    this.setneatify = false;
  }

  onKeyDown(key: string): void {
    if (key == "g") {
      this.guides = !this.guides;
    }
    if (key == "s") {
      this.simplify();
    }
  }

  simplify() {
    if (this.stroke) {
      const start = this.stroke.points[0];
      const end = this.stroke.points[this.stroke.points.length - 1];

      const firstPoint = this.beammanager.findOrAddControlPoint(start).id;
      const secondPoint = this.beammanager.findOrAddControlPoint(end).id;
      this.beammanager.addBeam([firstPoint, secondPoint]);
      this.beammanager.findAreas();

      this.savedPoints = this.stroke.points.map((p) => {
        return { x: p.x, y: p.y };
      });
      this.setneatify = true;
      this.neatifyStroke();
    }
  }

  neatifyStroke() {
    if (this.stroke) {
      const start = this.savedPoints[0];
      const end = this.savedPoints[this.savedPoints.length - 1];

      // project onto perfect line
      const line = Line(start, end);

      for (let i = 0; i < this.savedPoints.length; i++) {
        const point = this.savedPoints[i];
        const t = Line.projectPoint(line, point).t;
        const snap = Line.pointAtT(line, t);
        const snapedPoint = Vec.lerp(point, snap, this.neatify);
        StrokePoint.moveTo(this.stroke.points[i], snapedPoint);
      }
    }
  }

  render(r: Render) {
    r.circle(this.position.x, this.position.y, 4, fill("black"));
  }
}
