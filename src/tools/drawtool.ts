import { MouseData } from "../input";
import Stroke from "../stroke";
import StrokeManager from "../stroke-manager";
import { Tool } from "../tool-manager";

export class DrawTool implements Tool {
  strokemanager: StrokeManager;
  stroke: Stroke | null = null;

  constructor(strokemanager: StrokeManager) {
    this.strokemanager = strokemanager;
  }

  onMouseDown(p: MouseData): void {
    this.stroke = new Stroke();
    this.stroke.points.push({
      x: p.world.x,
      y: p.world.y,
      pressure: p.pressure,
      tilt_x: p.tiltX,
      tilt_y: p.tiltY,
    });
    this.strokemanager.addStroke(this.stroke);
  }

  onMouseDrag(p: MouseData): void {
    if (this.stroke) {
      this.stroke.points.push({
        x: p.world.x,
        y: p.world.y,
        pressure: p.pressure,
        tilt_x: p.tiltX,
        tilt_y: p.tiltY,
      });
    }
  }

  onMouseMove(p: MouseData): void {}

  onMouseUp(p: MouseData): void {
    if (this.stroke) {
      this.stroke = null;
    }
  }
}
