import { MouseData } from "../input";
import { Tool } from "./tool-manager";

import BeamManager from "../materials/beam/beam-manager";
import Beam from "../materials/beam/beam";
import BeamCluster from "../materials/beam/beam-cluster";

import SelectionManager from "../selection-manager";
import StrokeManager from "../materials/ink/stroke-manager";

import ControlPoint from "../materials/beam/control-point";

export default class BeamTool implements Tool {
  beammanager: BeamManager;
  selectionmanager: SelectionManager;
  strokemanager: StrokeManager;

  active: boolean = false;

  mode: "create" | "edit" = "edit";
  dragControlPoint: Id | null = null;

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
      let a = this.beammanager.findOrAddControlPoint(p.world).id;
      let b = this.beammanager.addControlPoint(p.world).id;

      console.log(a, b);
      this.beammanager.addBeam([a, b]);
      this.dragControlPoint = b;
    }
  }

  onMouseDrag(p: MouseData): void {
    if (this.dragControlPoint) {
      this.beammanager.moveControlPoint(this.dragControlPoint, p.world);
    }
  }

  onMouseUp(_p: MouseData): void {
    if (this.dragControlPoint) {
      this.beammanager.mergeControlPoint(this.dragControlPoint);
      this.dragControlPoint = null;
    }
  }

  // onKeyDown(key: string): void {
  //   if (key == "Enter") {
  //     this.cluster?.bindStrokes(
  //       Array.from(this.strokemanager.strokes.values()),
  //     );
  //     this.mode = "edit";
  //   }
  // }
}
