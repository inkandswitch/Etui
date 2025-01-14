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
    this.stroke.addPoint(p);
    this.strokemanager.addStroke(this.stroke);
  }

  onMouseDrag(p: MouseData): void {
    if (this.stroke) {
      this.stroke.addPoint(p);
    }
  }

  onMouseMove(p: MouseData): void {}

  onMouseUp(p: MouseData): void {
    if (this.stroke) {
      this.stroke = null;
    }
    console.log(this.strokemanager);
  }
}
