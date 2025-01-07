import { Point, Vec } from "./geom";

export default class Camera {
  position = { x: 0, y: 0 };
  zoom = 1;

  updateZoom(delta: number) {
    this.zoom -= delta * 0.01;
  }

  updatePosition(delta: Point) {
    this.position = Vec.add(this.position, delta);
  }

  reset() {
    this.position = { x: 0, y: 0 };
    this.zoom = 1;
  }

  screenToWorld(input: Point): Point {
    // Convert a screen position to a world position, taking into account the zoom level
    return {
      x: input.x / this.zoom - this.position.x,
      y: input.y / this.zoom - this.position.y,
    };
  }
}
