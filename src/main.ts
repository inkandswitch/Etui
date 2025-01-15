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

import Stroke from "./stroke";
import SelectionPanel from "./panels/selection-panel";

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
new SelectionPanel(selecttool);

// Handle input
new Input(camera, toolmanager);

// // Example
// const s = new Stroke("red", 1);
// s.addPoint({
//   pressure: 1,
//   tiltX: 0,
//   tiltY: 0,
//   world: { x: 0, y: 0 },
//   delta: { x: 0, y: 0 },
// });

// s.addPoint({
//   pressure: 1,
//   tiltX: 0,
//   tiltY: 0,
//   world: { x: 100, y: 100 },
//   delta: { x: 100, y: 100 },
// });

// s.addPoint({
//   pressure: 1,
//   tiltX: 0,
//   tiltY: 0,
//   world: { x: 200, y: 100 },
//   delta: { x: 100, y: 0 },
// });

// strokemanager.addStroke(s);

tick((dt: number) => {
  render.clear();
  render.beginOffset(camera);

  slicer.update();
  painter.update();
  painter.render(render);

  //strokemanager.render(render);

  selectionmanager.render(render);

  render.endOffset();
});
