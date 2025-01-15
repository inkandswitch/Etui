import m from "mithril";

import { MouseData } from "../input";
import { Tool } from "../tool-manager";
import SelectionManager from "../selection-manager";

export default class SelectTool implements Tool {
  selectionmanager: SelectionManager;

  active: boolean = false;

  selected: boolean = false;
  moved: boolean = false;

  mode: "whole" | "cut" | "noodle" = "whole";

  start() {
    this.selected = false;
    this.moved = false;
    this.selectionmanager.reset();
  }

  constructor(selectionmanager: SelectionManager) {
    this.selectionmanager = selectionmanager;
  }

  onMouseDown(p: MouseData): void {
    if (!this.selected) {
      this.selectionmanager.beginSelection(p.world);
    } else {
      if (!this.moved) {
        if (this.mode == "cut") {
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

  updateColor(color: string, value: string) {
    if (!this.moved) {
      if (this.mode == "cut") {
        this.selectionmanager.cutSelection();
      }
      this.moved = true;
      this.selectionmanager.clearHull();
    }
    this.selectionmanager.updateColor(color, value);
  }

  narrowToColor(color: string) {
    if (!this.moved) {
      if (this.mode == "cut") {
        this.selectionmanager.cutSelection();
      }
      this.moved = true;
      this.selectionmanager.clearHull();
    }
    this.selectionmanager.narrowToColor(color);
  }
}
