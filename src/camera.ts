import { Point } from "./geom/point";
import { Vec } from "./geom/vec";

export default class Camera {
  position = { x: 0, y: 0 };
  zoom = 1;

  
  updateZoom(delta: number, zoomCenter: Point) {
    const oldZoom = this.zoom;
    this.zoom = Math.max(0.1, this.zoom - delta * 0.01); // Prevent negative zoom
    
    // Adjust position to keep zoomCenter in the same screen position
    const zoomFactor = this.zoom / oldZoom;
    this.position.x += (zoomCenter.x / this.zoom) * (1 - zoomFactor);
    this.position.y += (zoomCenter.y / this.zoom) * (1 - zoomFactor);
  }

  updatePosition(delta: Vec) {
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
