import SettingsPanel from "./settings-panel";
import Tools from "./tools";

import Render from "./render";
import Capture from "./capture";
import Stroke, { Strokes } from "./stroke";
import Camera from "./camera";

const camera = new Camera();

const strokes = new Strokes();
const capture = new Capture(strokes);

const panel = new SettingsPanel(capture, strokes);
const tools = new Tools();

const render = new Render();

// Tick
function tick() {
  render.clear();
  render.offset(camera);

  capture.render(render);

  strokes.render(render);
  render.endOffset();

  requestAnimationFrame(tick);
}

tick();

// pan & pinch to zoom
window.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    if (e.ctrlKey) {
      // Zoom in and out
      camera.updateZoom(e.deltaY);
    } else {
      camera.updatePosition({ x: -e.deltaX, y: -e.deltaY });
    }
  },
  { passive: false },
);

let down = false;

window.addEventListener("pointerdown", (e) => {
  const world = camera.screenToWorld({ x: e.clientX, y: e.clientY });
  // @ts-ignore
  if (e.target.nodeName != "CANVAS") return; // don't care about non-canvas clicks
  down = true;
  if (e.pointerType === "pen") {
    capture.draw(world.x, world.y, e.pressure, e.tiltX, e.tiltY);
  } else {
    capture.draw(world.x, world.y, 1, 0, 0);
  }
});

// stylus input
document.addEventListener("pointermove", (e) => {
  if (!down) return;
  const world = camera.screenToWorld({ x: e.clientX, y: e.clientY });
  if (e.pointerType === "pen") {
    capture.draw(world.x, world.y, e.pressure, e.tiltX, e.tiltY);
  } else {
    capture.draw(world.x, world.y, 1, 0, 0);
  }
});

document.addEventListener("pointerup", (e) => {
  if (!down) return;
  down = false;
  if (e.pointerType === "pen") {
    capture.end();
  } else {
    capture.end();
  }
});

window.addEventListener("keydown", (e) => {
  if (e.key == "z") {
    camera.reset();
  }
});
