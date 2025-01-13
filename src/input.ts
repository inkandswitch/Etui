import Camera from "./camera";
import { Point } from "./geom/point";
import { Vec } from "./geom/vec";
import ToolManager from "./tool-manager";

export type MouseData = {
  world: Point;
  delta: Vec;
  pressure: number;
  tiltX: number;
  tiltY: number;
};

function toInputEvent(e: PointerEvent, camera: Camera): MouseData {
  return {
    world: camera.screenToWorld({ x: e.clientX, y: e.clientY }),
    delta: Vec(e.movementX, e.movementY),
    pressure: e.pressure || 1,
    tiltX: e.tiltX || 0,
    tiltY: e.tiltY || 0,
  };
}

export default class Input {
  camera: Camera;
  toolmanager: ToolManager;

  down = false;

  constructor(camera: Camera, toolmanager: ToolManager) {
    this.camera = camera;
    this.toolmanager = toolmanager;

    window.addEventListener("pointerdown", (e) => {
      this.down = true;
      this.onMouseDown(toInputEvent(e, camera));
    });

    window.addEventListener("pointermove", (e) => {
      const event = toInputEvent(e, camera);
      this.onMouseMove(event);
      if (this.down) {
        this.onMouseDrag(event);
      }
    });

    window.addEventListener("pointerup", (e) => {
      this.down = false;
      this.onMouseUp(toInputEvent(e, camera));
    });

    // pan & pinch to zoom
    window.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        if (e.ctrlKey) {
          this.onZoom(e.deltaY, Point(e.clientX, e.clientY));
        } else {
          this.onPan({ x: -e.deltaX, y: -e.deltaY });
        }
      },
      { passive: false },
    );
  }

  onZoom(delta: number, p: Point) {
    this.camera.updateZoom(delta, p);
  }

  onPan(delta: Vec) {
    this.camera.updatePosition(delta);
  }

  onMouseDown(p: MouseData) {
    this.toolmanager.onMouseDown(p);
  }

  onMouseMove(p: MouseData) {
    this.toolmanager.onMouseMove(p);
  }

  onMouseDrag(p: MouseData) {
    this.toolmanager.onMouseDrag(p);
  }

  onMouseUp(p: MouseData) {
    this.toolmanager.onMouseUp(p);
  }
}
