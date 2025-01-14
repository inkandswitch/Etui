import tick from "./lib/tick";
import Render from "./render";
import Input from "./input";

import Camera from "./camera";

// Rendering pipeline
import StrokeManager from "./stroke-manager";
import Slicer from "./slicer";
import Painter from "./painter";

// Tools
import ToolManager from "./tool-manager";
import { DrawTool } from "./tools/drawtool";

const render = new Render();
const camera = new Camera();
const toolmanager = new ToolManager();

const strokemanager = new StrokeManager();
const slicer = new Slicer(strokemanager);
const painter = new Painter(slicer);

const input = new Input(camera, toolmanager);

toolmanager.register("draw", new DrawTool(strokemanager));

tick((dt: number) => {
  render.clear();
  render.beginOffset(camera);

  slicer.update();
  painter.update();
  painter.render(render);

  render.endOffset();
});
