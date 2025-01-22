import { MouseData } from "../input";
import { Tool } from "../tool-manager";

import BeamManager from "../beam/beam-manager";
import Beam from "../beam/beam";
import BeamCluster from "../beam/beam-cluster";

import SelectionManager from "../selection-manager";
import StrokeManager from "../stroke-manager";

import { Point } from "../geom/point";
import ControlPoint from "../beam/control-point";

export default class BeamTool implements Tool {
  beammanager: BeamManager;
  selectionmanager: SelectionManager;
  strokemanager: StrokeManager;

  active: boolean = false;

  cluster: BeamCluster | null = null;
  mode: "create" | "edit" = "edit";

  dragControlPoint: ControlPoint | null = null;

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
    this.mode = "create";
    // if (this.selectionmanager.strokes.length > 0) {
    //   this.mode = "create";
    // } else {
    //   this.mode = "edit";
    // }
  }

  onMouseDown(p: MouseData): void {
    if (this.mode == "create") {
      if (!this.cluster) {
        this.cluster = this.beammanager.addCluster();
        let a = new ControlPoint(p.world);
        let b = new ControlPoint(p.world);
        this.cluster.addBeam(new Beam([a, b]));
        this.dragControlPoint = b;
      } else {
        let a = this.cluster.getControlPointNear(p.world);
        if (!a) {
          a = new ControlPoint(p.world);
        }
        let b = new ControlPoint(p.world);
        this.cluster.addBeam(new Beam([a, b]));
        this.dragControlPoint = b;
      }
    } else {
      this.dragControlPoint = this.cluster!.getControlPointNear(p.world);
    }
  }

  onMouseDrag(p: MouseData): void {
    if (this.dragControlPoint) {
      this.dragControlPoint.move(p.world);
      this.cluster?.update(Array.from(this.strokemanager.strokes.values()));
    }
  }

  onMouseMove(_p: MouseData): void {}

  onMouseUp(_p: MouseData): void {
    if (this.cluster && this.dragControlPoint) {
      this.cluster.mergeControlPoint(this.dragControlPoint);
      this.dragControlPoint = null;
    }
  }

  onMouseRightClick(p: MouseData): void {
    // const closestBeam = this.beammanager.getBeamNear(p.world);
    // if (closestBeam) {
    //   closestBeam.insertControlPointNear(p.world);
    // }
  }

  onKeyDown(key: string): void {
    if (key == "Enter") {
      this.cluster?.bindStrokes(
        Array.from(this.strokemanager.strokes.values()),
      );
      this.mode = "edit";
    }
  }
}
