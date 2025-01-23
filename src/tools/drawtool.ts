import { MouseData } from "../input";
import Stroke from "../materials/ink/stroke";
import StrokeManager from "../materials/ink/stroke-manager";
import { Tool } from "./tool-manager";

export default class DrawTool implements Tool {
  strokemanager: StrokeManager;
  stroke: Stroke | null = null;

  color: string;
  weight: number;
  brush: string;

  active: boolean = false;

  start() {}

  constructor(strokemanager: StrokeManager) {
    this.strokemanager = strokemanager;
    this.color = "#000000";
    this.brush = "brush";
    this.weight = 1;
  }

  onMouseDown(p: MouseData): void {
    this.stroke = new Stroke(this.color, this.weight, this.brush);
    this.stroke.addPoint(p);
    this.strokemanager.addStroke(this.stroke);
  }

  onMouseDrag(p: MouseData): void {
    if (this.stroke) {
      this.stroke.addPoint(p);
    }
  }

  onMouseMove(_p: MouseData): void {}

  onMouseUp(_p: MouseData): void {
    if (this.stroke) {
      this.stroke = null;
    }
    console.log(this.strokemanager);
  }

  onMouseRightClick(p: MouseData): void {}

  onKeyDown(key: string): void {}
}
