import { MouseData } from "../input";
import Stroke from "../stroke";
import { Point } from "../geom/point";
import { Tool } from "../tool-manager";
import SelectionManager from "../selection-manager";

export default class SelectTool implements Tool {
  selectionmanager: SelectionManager;
  selected: boolean = false;
  moved: boolean = false;

  constructor(selectionmanager: SelectionManager) {
    this.selectionmanager = selectionmanager;
  }

  onMouseDown(p: MouseData): void {
    if (!this.selected) {
      this.selectionmanager.beginSelection(p.world);
    } else {
      if (!this.moved) {
        this.selectionmanager.cutSelection();
        this.moved = true;
      }
    }
  }

  onMouseDrag(p: MouseData): void {
    if (!this.selected) {
      this.selectionmanager.extendSelection(p.world);
    } else {
      this.selectionmanager.moveSelection(p.delta);
    }
  }

  onMouseMove(p: MouseData): void {}

  onMouseUp(p: MouseData): void {
    if (!this.selected) {
      this.selectionmanager.endSelection();
      this.selected = true;
    }
  }
}
