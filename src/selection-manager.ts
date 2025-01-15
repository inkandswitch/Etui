import { Point } from "./geom/point";
import Render, { fillAndStroke } from "./render";
import Stroke from "./stroke";
import StrokeManager from "./stroke-manager";

export default class SelectionManager {
  strokemanager: StrokeManager;
  hull: Array<Point> = [];

  constructor(strokemanager: StrokeManager) {
    this.strokemanager = strokemanager;
  }

  beginSelection(p: Point) {
    this.hull = [p];
  }

  extendSelection(p: Point) {
    this.hull.push(p);
  }

  endSelection() {}

  render(r: Render) {
    r.poly(this.hull, fillAndStroke("#00FF0011", "#00FF00", 0.5));
  }
}
