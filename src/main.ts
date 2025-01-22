import tick from "./lib/tick";
import Render from "./render";
import Input from "./input";

import Camera from "./camera";

import StrokeManager from "./stroke-manager";
import Slicer from "./slicer";
import Painter from "./painter";

import SelectionManager from "./selection-manager";
import BeamManager from "./beam/beam-manager";
import QueryManager from "./query-manager";

import PropertyPanel from "./panels/property-panel";
import ToolPanel from "./panels/tool-panel";
import SelectionPanel from "./panels/selection-panel";

import ToolManager from "./tool-manager";
import DrawTool from "./tools/drawtool";
import SelectTool from "./tools/selecttool";
import BeamTool from "./tools/beamtool";
import QueryTool from "./tools/querytool";

const render = new Render();
const camera = new Camera();

// managers
const strokemanager = new StrokeManager();
const beammanager = new BeamManager(strokemanager);
const selectionmanager = new SelectionManager(strokemanager, beammanager);
const querymanager = new QueryManager();

// Pipeline
const slicer = new Slicer(strokemanager, querymanager);
const painter = new Painter(slicer);

// Register tools
const toolmanager = new ToolManager();
const drawtool = new DrawTool(strokemanager);
toolmanager.register("draw", drawtool);
const selecttool = new SelectTool(selectionmanager);
toolmanager.register("select", selecttool);
const beamtool = new BeamTool(beammanager, selectionmanager, strokemanager);
toolmanager.register("beam", beamtool);
const querytool = new QueryTool(querymanager);
toolmanager.register("query", querytool);

// Create panels
new ToolPanel(toolmanager);
new PropertyPanel(drawtool);
new SelectionPanel(selecttool);

// Handle input
new Input(camera, toolmanager);

tick((dt: number) => {
  render.clear();
  render.beginOffset(camera);

  slicer.update();
  painter.update();
  painter.render(render);

  //strokemanager.render(render);

  selectionmanager.render(render);

  if (beamtool.active) {
    beammanager.render(render);
  }

  querymanager.render(render);

  render.endOffset();
});
