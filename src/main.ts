import tick from "./lib/tick";
import Render from "./render";
import Input from "./input";

import Camera from "./camera";

import StrokeManager from "./stroke-manager";
import Slicer from "./slicer";
import Painter from "./painter";

import PropertyPanel from "./property-panel";
import ToolManager from "./tool-manager";
import { DrawTool } from "./tools/drawtool";

const render = new Render();
const camera = new Camera();

// Create ink pipeline
const strokemanager = new StrokeManager();
const slicer = new Slicer(strokemanager);
const painter = new Painter(slicer);

// Register tools
const toolmanager = new ToolManager();
const drawtool = new DrawTool(strokemanager);
toolmanager.register("draw", drawtool);

// Create panels
new PropertyPanel(drawtool);

// Handle input
const input = new Input(camera, toolmanager);

tick((dt: number) => {
  render.clear();
  render.beginOffset(camera);

  slicer.update();
  painter.update();
  painter.render(render);

  render.endOffset();
});
