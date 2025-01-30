import { MouseData } from "input";
import { Tool } from "./tool-manager";

import BeamManager from "materials/beam/beam-manager";

import SelectionManager from "selection-manager";
import StrokeManager from "materials/ink/stroke-manager";
import { Id } from "materials/id";

export default class BeamTool implements Tool {
  beammanager: BeamManager;
  selectionmanager: SelectionManager;
  strokemanager: StrokeManager;

  active: boolean = false;

  type: "line" | "circle" | "curve" = "line";

  mode: "create" | "insert" | "edit" = "edit";

  dragControlPoint: Id | null = null;
  currentBeamId: Id | null = null;

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
  }

  private getRequiredPoints(): number {
    const pointsRequired = {
      line: 2,
      circle: 2,
      curve: 4,
    };
    return pointsRequired[this.type];
  }

  onMouseDown(p: MouseData): void {
    if (this.dragControlPoint != null) {
      this.beammanager.mergeControlPoint(this.dragControlPoint);
      this.dragControlPoint = null;

      if (this.mode == "create") {
        return;
      }
    }

    if (this.mode === "create") {
      // Create initial two points and beam
      const firstPoint = this.beammanager.findOrAddControlPoint(p.world).id;
      const secondPoint = this.beammanager.addControlPoint(p.world).id;
      this.currentBeamId = this.beammanager.addBeam([
        firstPoint,
        secondPoint,
      ]).id;

      this.dragControlPoint = secondPoint;

      // If we need more points, switch to insert mode
      if (this.getRequiredPoints() > 2) {
        console.log("Switching to insert mode");
        this.mode = "insert";
      }
    } else if (this.mode === "insert") {
      // Add new point to the existing beam
      const newPoint = this.beammanager.addControlPoint(p.world).id;
      this.beammanager.addControlPointToBeam(this.currentBeamId!, newPoint);

      this.dragControlPoint = newPoint;

      // If we have all required points, switch back to create mode
      const currentPoints = this.beammanager.getBeam(this.currentBeamId!)
        .controlPoints.length;
      if (currentPoints === this.getRequiredPoints()) {
        this.mode = "create";
        this.currentBeamId = null;
      }
    }
  }

  onMouseMove(p: MouseData): void {
    if (this.dragControlPoint) {
      this.beammanager.moveControlPoint(this.dragControlPoint, p.world);
    }

    this.beammanager.getInfluence(p.world);
  }

  onKeyDown(key: string): void {
    if (key == "Enter") {
      this.mode = "edit";
      this.dragControlPoint = null;
      this.currentBeamId = null;
    }
  }
}
