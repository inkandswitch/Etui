import Render from "../../render";
import Stroke from "./stroke";

export default class StrokeManager {
  strokes: Map<number, Stroke> = new Map();
  ids: number = 0;

  constructor() {
    this.strokes = new Map();
  }

  addStroke(s: Stroke): number {
    let id = this.ids++;
    this.strokes.set(id, s);
    return id;
  }

  removeStroke(id: number) {
    this.strokes.delete(id);
  }

  getStroke(id: number): Stroke {
    return this.strokes.get(id)!;
  }

  render(r: Render) {
    this.strokes.forEach((s) => {
      s.render(r);
    });
  }
}
