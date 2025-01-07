import SettingsPanel from "./settings-panel";
import Render from "./render";
import Capture from "./capture";
import Stroke, { Strokes } from "./stroke";
import Camera from "./camera";

const camera = new Camera();

const strokes = new Strokes();
const capture = new Capture(strokes);

const panel = new SettingsPanel(capture, strokes);

const render = new Render();

// Tick
function tick() {
  render.clear();
  render.offset(camera);

  strokes.render(render);

  capture.render(render);
  render.endOffset();

  requestAnimationFrame(tick);
}

tick();

window.addEventListener("mousedown", (e) => {
  // @ts-ignore
  if (e.target.nodeName != "CANVAS") return; // don't care about non-canvas clicks
  capture.startStroke(e.offsetX, e.offsetY);
});

window.addEventListener("mousemove", (e) => {
  capture.extendStroke(e.offsetX, e.offsetY);
});

window.addEventListener("mouseup", (e) => {
  capture.endStroke(e.offsetX, e.offsetY);
});

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

window.addEventListener("keydown", (e) => {
  if (e.key == "z") {
    camera.reset();
  }
});
