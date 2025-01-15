import { MouseData } from "../input";
import Stroke from "../stroke";
import { Point } from "../geom/point";
import { Tool } from "../tool-manager";
import SelectionManager from "../selection-manager";

export default class SelectTool implements Tool {
  selectionmanager: SelectionManager;

  constructor(selectionmanager: SelectionManager) {
    this.selectionmanager = selectionmanager;
  }

  onMouseDown(p: MouseData): void {
    this.selectionmanager.beginSelection(p.world);
  }

  onMouseDrag(p: MouseData): void {
    this.selectionmanager.extendSelection(p.world);
  }

  onMouseMove(p: MouseData): void {}

  onMouseUp(p: MouseData): void {
    this.selectionmanager.endSelection();
  }
}
