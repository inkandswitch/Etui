import tick from "./lib/tick";
import Render from "./render";
import Input from "./input";

import Camera from "./camera";

import StrokeManager from "./stroke-manager";
import Slicer from "./slicer";
import Painter from "./painter";

import PropertyPanel from "./panels/property-panel";
import ToolPanel from "./panels/tool-panel";

import ToolManager from "./tool-manager";
import DrawTool from "./tools/drawtool";
import SelectTool from "./tools/selecttool";
import SelectionManager from "./selection-manager";

const render = new Render();
const camera = new Camera();

// Create ink pipeline
const strokemanager = new StrokeManager();
const slicer = new Slicer(strokemanager);
const painter = new Painter(slicer);

const selectionmanager = new SelectionManager(strokemanager);

// Register tools
const toolmanager = new ToolManager();
const drawtool = new DrawTool(strokemanager);
toolmanager.register("draw", drawtool);
const selecttool = new SelectTool(selectionmanager);
toolmanager.register("select", selecttool);

// Create panels
new ToolPanel(toolmanager);
new PropertyPanel(drawtool);

// Handle input
new Input(camera, toolmanager);

tick((dt: number) => {
  render.clear();
  render.beginOffset(camera);

  slicer.update();
  painter.update();
  painter.render(render);

  selectionmanager.render(render);

  render.endOffset();
});
