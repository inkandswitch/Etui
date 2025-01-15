import m from "mithril";

import { MouseData } from "../input";
import { Tool } from "../tool-manager";
import SelectionManager from "../selection-manager";

export default class SelectTool implements Tool {
  selectionmanager: SelectionManager;

  active: boolean = false;

  selected: boolean = false;
  moved: boolean = false;

  cut: boolean = true;

  start() {
    this.selected = false;
    this.moved = false;
    this.selectionmanager.clearHull();
  }

  constructor(selectionmanager: SelectionManager) {
    this.selectionmanager = selectionmanager;
  }

  onMouseDown(p: MouseData): void {
    if (!this.selected) {
      this.selectionmanager.beginSelection(p.world);
    } else {
      if (!this.moved) {
        if (this.cut) {
          this.selectionmanager.cutSelection();
        }
        this.moved = true;
      }

      this.selectionmanager.clearHull();
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
      this.selectionmanager.findStrokesInsideHull();
      this.selectionmanager.computeSelectedProperties();
      this.selected = true;
    }
    m.redraw();
  }
}
