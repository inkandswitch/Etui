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

function toInputEvent(e: PointerEvent | MouseEvent, camera: Camera): MouseData {
  return {
    world: camera.screenToWorld({ x: e.clientX, y: e.clientY }),
    delta: Vec(e.movementX, e.movementY),
    pressure: "pressure" in e ? e.pressure : 1,
    tiltX: "tiltX" in e ? e.tiltX : 0,
    tiltY: "tiltY" in e ? e.tiltY : 0,
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
      //@ts-ignore
      if (e.target.nodeName === "CANVAS") {
        this.down = true;
        this.onMouseDown(toInputEvent(e, camera));
      }
    });

    window.addEventListener("pointermove", (e) => {
      const event = toInputEvent(e, camera);
      this.onMouseMove(event);
      if (this.down) {
        this.onMouseDrag(event);
      }
    });

    window.addEventListener("pointerup", (e) => {
      if (this.down) {
        this.down = false;
        this.onMouseUp(toInputEvent(e, camera));
      }
    });

    window.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.onMouseRightClick(toInputEvent(e, camera));
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

    window.addEventListener("keydown", (e) => {
      this.onKeyDown(e.key);
    });
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

  onMouseRightClick(p: MouseData) {
    this.toolmanager.onMouseRightClick(p);
  }

  onKeyDown(key: string) {
    this.toolmanager.onKeyDown(key);
  }
}
