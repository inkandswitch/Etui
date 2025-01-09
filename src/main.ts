import SettingsPanel from "./settings-panel";
import Tools from "./tools";

import Render, { fill, stroke } from "./render";
import Capture from "./capture";
import Select from "./select";

import { Strokes } from "./stroke";
import Camera from "./camera";

const camera = new Camera();

const strokes = new Strokes();
const capture = new Capture(strokes);
const select = new Select(strokes);

const panel = new SettingsPanel(capture, strokes, select);
const tools = new Tools();

const render = new Render();

// Tick
function tick() {
  render.clear();
  render.offset(camera);

  capture.render(render);
  strokes.render(render);
  select.render(render);

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
  // @ts-ignore
  if (e.target.nodeName != "CANVAS") return; // don't care about non-canvas clicks

  down = true;

  // Convert params
  const world = camera.screenToWorld({ x: e.clientX, y: e.clientY });
  let pressure = 1;
  let tiltX = 0;
  let tiltY = 0;
  if (e.pointerType === "pen") {
    pressure = e.pressure;
    tiltX = e.tiltX;
    tiltY = e.tiltY;
  }

  if (tools.currentTool == "draw") {
    capture.draw(world.x, world.y, pressure, tiltX, tiltY);
  } else if (tools.currentTool == "select") {
    select.start();
    select.draw(world.x, world.y);
  }
});

// stylus input
document.addEventListener("pointermove", (e) => {
  if (!down) return;

  // Convet params
  const world = camera.screenToWorld({ x: e.clientX, y: e.clientY });
  let pressure = 1;
  let tiltX = 0;
  let tiltY = 0;
  if (e.pointerType === "pen") {
    pressure = e.pressure;
    tiltX = e.tiltX;
    tiltY = e.tiltY;
  }

  if (tools.currentTool == "draw") {
    capture.draw(world.x, world.y, pressure, tiltX, tiltY);
  } else if (tools.currentTool == "select") {
    select.draw(world.x, world.y);
  }
});

document.addEventListener("pointerup", (e) => {
  if (!down) return;
  down = false;
  if (tools.currentTool == "draw") {
    capture.end();
  } else if (tools.currentTool == "select") {
    select.end();
  }
});

window.addEventListener("keydown", (e) => {
  if (e.key == "z") {
    camera.reset();
  }
});
