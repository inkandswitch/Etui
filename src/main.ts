import tick from "./lib/tick";
import Render from "./render";
import Input from "./input";

import Camera from "./camera";

import StrokeManager from "./stroke-manager";
import Slicer from "./slicer";
import Painter from "./painter";

import SelectionManager from "./selection-manager";
import BeamManager from "./beam-manager";

import PropertyPanel from "./panels/property-panel";
import ToolPanel from "./panels/tool-panel";
import SelectionPanel from "./panels/selection-panel";

import ToolManager from "./tool-manager";
import DrawTool from "./tools/drawtool";
import SelectTool from "./tools/selecttool";
import BeamTool from "./tools/beamtool";

const render = new Render();
const camera = new Camera();

// Create ink pipeline
const strokemanager = new StrokeManager();
const slicer = new Slicer(strokemanager);
const painter = new Painter(slicer);

const selectionmanager = new SelectionManager(strokemanager);
const beammanager = new BeamManager();

// Register tools
const toolmanager = new ToolManager();
const drawtool = new DrawTool(strokemanager);
toolmanager.register("draw", drawtool);
const selecttool = new SelectTool(selectionmanager);
toolmanager.register("select", selecttool);
const beamtool = new BeamTool(beammanager, selectionmanager, strokemanager);
toolmanager.register("beam", beamtool);

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
  beammanager.render(render);

  render.endOffset();
});
