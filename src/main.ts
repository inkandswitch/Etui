import SettingsPanel from "./settings-panel";
import Render from "./render";
import Capture from "./capture";
import Stroke from "./stroke";

const strokes: Array<Stroke> = [];
const capture = new Capture(strokes);

const panel = new SettingsPanel(capture);

const render = new Render();

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
