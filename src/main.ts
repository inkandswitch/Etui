import SettingsPanel from "./settings-panel";
import Render from "./render";
import Capture from "./capture";
import Stroke from "./stroke";

const strokes: Array<Stroke> = [];
const panel = new SettingsPanel();
const render = new Render();

const capture = new Capture(strokes);
window.capture = capture;

// Tick
function tick() {
  render.ctx.clearRect(0, 0, render.canvas.width, render.canvas.height);

  for (const stroke of strokes) {
    stroke.render(render);
  }

  capture.render(render);
  requestAnimationFrame(tick);
}

tick();
