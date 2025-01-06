import Render from "./render";
import Capture from "./capture";

let render = new Render();
let capture = new Capture();

// Tick
function tick() {
  render.ctx.clearRect(0, 0, render.canvas.width, render.canvas.height);
  capture.render(render);
  requestAnimationFrame(tick);
}

tick();
