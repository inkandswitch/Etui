import Render from "./render";
import Stroke from "./stroke";

export default class StrokeManager {
  strokes: Map<number, Stroke> = new Map();
  ids: number = 0;

  constructor() {
    this.strokes = new Map();
  }

  addStroke(s: Stroke) {
    this.strokes.set(this.ids, s);
    this.ids++;
  }

  render(r: Render) {
    this.strokes.forEach((s) => {
      s.render(r);
    });
  }
}
