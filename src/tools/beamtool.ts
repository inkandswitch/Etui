import { MouseData } from "../input";
import { Tool } from "../tool-manager";

import BeamManager from "../beam-manager";
import Beam from "../beam";

import SelectionManager from "../selection-manager";
import StrokeManager from "../stroke-manager";

import { Point } from "../geom/point";

export default class BeamTool implements Tool {
  beammanager: BeamManager;
  selectionmanager: SelectionManager;
  strokemanager: StrokeManager;

  active: boolean = false;

  beam: Beam | null = null;
  mode: "create" | "edit" = "edit";

  dragControlPoint: Point | null = null;

  constructor(
    beammanager: BeamManager,
    selectionmanager: SelectionManager,
    strokemanager: StrokeManager,
  ) {
    this.beammanager = beammanager;
    this.selectionmanager = selectionmanager;
    this.strokemanager = strokemanager;
  }

  start() {
    if (this.selectionmanager.strokes.length > 0) {
      this.mode = "create";
    } else {
      this.mode = "edit";
    }
  }

  onMouseDown(p: MouseData): void {
    if (this.mode == "create") {
      if (!this.beam) {
        this.beam = this.beammanager.addBeam();
        this.beam.addControlPoint(p.world);
      } else {
        const cp = this.beammanager.getControlPointNear(p.world);
        if (cp) {
          this.beam.attachStrokes(this.selectionmanager.strokes);
          this.selectionmanager.reset();
          this.mode = "edit";
          this.beam = null;
        } else {
          this.beam.addControlPoint(p.world);
        }
      }
    } else {
      this.dragControlPoint = this.beammanager.getControlPointNear(p.world);
    }
  }

  onMouseDrag(p: MouseData): void {
    if (this.dragControlPoint) {
      this.dragControlPoint.x = p.world.x;
      this.dragControlPoint.y = p.world.y;
      this.beammanager.update();
    }
  }

  onMouseMove(_p: MouseData): void {}

  onMouseUp(_p: MouseData): void {}

  onMouseRightClick(p: MouseData): void {
    const closestBeam = this.beammanager.getBeamNear(p.world);
    if (closestBeam) {
      closestBeam.insertControlPointNear(p.world);
    }
  }
}
