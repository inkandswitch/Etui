import SettingsPanel from "./settings-panel";
import Render from "./render";
import Capture from "./capture";
import Stroke, { Strokes } from "./stroke";

const strokes = new Strokes();
const capture = new Capture(strokes);

const panel = new SettingsPanel(capture, strokes);

const render = new Render();

// Tick
function tick() {
  render.ctx.clearRect(0, 0, render.canvas.width, render.canvas.height);

  strokes.render(render);

  capture.render(render);
  requestAnimationFrame(tick);
}

tick();
