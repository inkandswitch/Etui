import { MouseData } from "input";
import { Tool } from "./tool-manager";
import { Vec } from "geom/vec";

import BeamManager from "materials/beam/beam-manager";


import { Id } from "materials/id";

export default class DragTool implements Tool {
  beammanager: BeamManager;

  active: boolean = false;

  dragControlPoints: Array<Id> | null = null;
  dragControlOffsets: Array<Vec> = [];

  constructor(beammanager: BeamManager) {
    this.beammanager = beammanager;
  }

  onMouseDown(p: MouseData): void {
    this.dragControlPoints = null;
    const found = this.beammanager.findControlPointNear(p.world);
    if(found) {
      this.dragControlOffsets = [Vec.sub(found.point, p.world)];
      this.dragControlPoints = [found.id];
      return
    }

    const foundBeam = this.beammanager.findBeamNear(p.world);
    if(foundBeam) {
      this.dragControlPoints = foundBeam.controlPoints;
      this.dragControlOffsets = foundBeam.controlPoints.map(id => {
        const point = this.beammanager.points.get(id)!.point;
        return Vec.sub(point, p.world);
      });
      return
    }

    const foundArea = this.beammanager.findAreaNear(p.world);
    if(foundArea) {
      this.dragControlPoints = foundArea.controlPoints;
      this.dragControlOffsets = foundArea.controlPoints.map(id => {
        const point = this.beammanager.points.get(id)!.point;
        return Vec.sub(point, p.world);
      });
    }


  }

  onMouseMove(p: MouseData): void {
    if (this.dragControlPoints) {
      for (let i = 0; i < this.dragControlPoints.length; i++) {
        const id = this.dragControlPoints[i];
        const offset = this.dragControlOffsets[i];
        const newPoint = Vec.add(p.world, offset);
        this.beammanager.moveControlPoint(id, newPoint);
      }
    }
  }

  onMouseUp(p: MouseData): void {
    this.dragControlPoints = null;
  }
}
