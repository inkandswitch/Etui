import m from "mithril";

import { MouseData } from "input";
import { Tool } from "./tool-manager";
import SelectionManager from "selection-manager";

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

  onMouseUp(p: MouseData): void {
    if (!this.selected) {
      this.selectionmanager.findStrokesInsideHull();
      this.selectionmanager.computeSelectedProperties();
      this.selected = true;
    }
    m.redraw();
  }

  cutIfNeeded() {
    if (!this.moved) {
      if (this.mode == "cut") {
        this.selectionmanager.cutSelection();
      }
      this.moved = true;
      this.selectionmanager.clearHull();
    }
  }

  updateColor(color: string, value: string) {
    this.cutIfNeeded();
    this.selectionmanager.updateColor(color, value);
  }

  narrowToColor(color: string) {
    this.cutIfNeeded();
    this.selectionmanager.narrowToColor(color);
  }

  updateWeight(weight: number, value: number) {
    this.cutIfNeeded();
    this.selectionmanager.updateWeight(weight, value);
  }

  narrowToWeight(weight: number) {
    this.cutIfNeeded();
    this.selectionmanager.narrowToWeight(weight);
  }

  updateBrush(brush: string, value: string) {
    this.cutIfNeeded();
    this.selectionmanager.updateBrush(brush, value);
  }

  narrowToBrush(brush: string) {
    this.cutIfNeeded();
    this.selectionmanager.narrowToBrush(brush);
  }
}
