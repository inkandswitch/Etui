import { MouseData } from "input";
import { Tool } from "./tool-manager";

import BeamManager from "materials/beam/beam-manager";

import { Id } from "materials/id";

export default class DragTool implements Tool {
  beammanager: BeamManager;

  active: boolean = false;

  dragControlPoint: Id | null = null;

  constructor(beammanager: BeamManager) {
    this.beammanager = beammanager;
  }

  onMouseDown(p: MouseData): void {
    this.dragControlPoint =
      this.beammanager.findControlPointNear(p.world)?.id ?? null;
  }

  onMouseMove(p: MouseData): void {
    if (this.dragControlPoint) {
      this.beammanager.moveControlPoint(this.dragControlPoint, p.world);
    }
  }

  onMouseUp(p: MouseData): void {
    this.dragControlPoint = null;
  }
}
