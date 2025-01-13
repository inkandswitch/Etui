import tick from "./lib/tick";
import Render, { stroke } from "./render";
import Input from "./input";

import Camera from "./camera";
import ToolManager from "./tool-manager";
import StrokeManager from "./stroke-manager";
import { DrawTool } from "./tools/drawtool";

const render = new Render();
const camera = new Camera();
const toolmanager = new ToolManager();
const strokemanager = new StrokeManager();
const input = new Input(camera, toolmanager);

toolmanager.register("draw", new DrawTool(strokemanager));

tick((dt: number) => {
  render.clear();
  render.beginOffset(camera);

  render.line(0, 0, 100, 100, stroke("black", 1));

  strokemanager.render(render);

  render.endOffset();
});
