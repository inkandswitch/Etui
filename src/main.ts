import SettingsPanel from "./settings-panel";
import Tools from "./tools";

import Render, { fill, stroke } from "./render";
import Capture from "./capture";
import Select from "./select";

import Stroke, { Strokes } from "./stroke";
import Camera from "./camera";
import { catmullRomSpline } from "./geom";

const camera = new Camera();

const strokes = new Strokes();
const capture = new Capture(strokes);
const select = new Select(strokes);

const panel = new SettingsPanel(capture, strokes, select);
const tools = new Tools();

const render = new Render();

// draw catmul rom spline
const spline: Array<{ x: number; y: number }> = [];
const a = { x: 220, y: 80 };
const b = { x: 200, y: 100 };
const c = { x: 200, y: 200 };
const d = { x: 220, y: 220 };

for (let i = 0; i < 100; i++) {
  const t = i / 100;
  let point = catmullRomSpline(a, b, c, d, t);
  spline.push(point);
}

// Tick
function tick() {
  render.clear();
  render.offset(camera);

  capture.render(render);
  strokes.render(render);
  select.render(render);

  render.poly(spline, stroke("red", 1), false);
  render.circle(a.x, a.y, 2, fill("red"));
  render.circle(b.x, b.y, 2, fill("red"));
  render.circle(c.x, c.y, 2, fill("red"));
  render.circle(d.x, d.y, 2, fill("red"));

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
