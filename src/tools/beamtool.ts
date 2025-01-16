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
    //get selected strokes
    const selected = this.selectionmanager.strokes[0];
    const stroke = this.strokemanager.getStroke(selected);
    this.beammanager.addBeam(new Beam(stroke));
    this.selectionmanager.reset();
  }

  onMouseDown(p: MouseData): void {
    const cp = this.beammanager.getControlPointNear(p.world);
    if (cp) {
      this.dragControlPoint = cp;
    }
  }

  onMouseDrag(p: MouseData): void {
    if (this.dragControlPoint) {
      this.dragControlPoint.x = p.world.x;
      this.dragControlPoint.y = p.world.y;
    }

    this.beammanager.getBeam(0).update();
  }

  onMouseMove(_p: MouseData): void {}

  onMouseUp(_p: MouseData): void {}
}
