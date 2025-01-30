import tick from "lib/tick";
import Render from "render";
import Input from "input";

import Camera from "camera";

import StrokeManager from "materials/ink/stroke-manager";
import Slicer from "materials/ink/slicer";
import Painter from "materials/ink/painter";

import SelectionManager from "selection-manager";
import BeamManager from "materials/beam/beam-manager";
import QueryManager from "query-manager";

import PropertyPanel from "panels/property-panel";
import ToolPanel from "panels/tool-panel";
import SelectionPanel from "panels/selection-panel";
import BeamPanel from "panels/beam-panel";

import ToolManager from "tools/tool-manager";
import DrawTool from "tools/drawtool";
import SelectTool from "tools/selecttool";
import BeamTool from "tools/beamtool";
import DragTool from "tools/dragtool";
import QueryTool from "tools/querytool";
import { Deformer } from "materials/beam/deformer";

const render = new Render();
const camera = new Camera();

// managers
const strokemanager = new StrokeManager();
const beammanager = new BeamManager();
const selectionmanager = new SelectionManager(strokemanager, beammanager);
const querymanager = new QueryManager();

// Pipeline
const deformer = new Deformer(strokemanager, beammanager);
const slicer = new Slicer(strokemanager, querymanager);
const painter = new Painter(slicer);

// Register tools
const toolmanager = new ToolManager();
const drawtool = new DrawTool(strokemanager, beammanager);
toolmanager.register("draw", drawtool);
const selecttool = new SelectTool(selectionmanager);
toolmanager.register("select", selecttool);
const beamtool = new BeamTool(beammanager, selectionmanager, strokemanager);
toolmanager.register("beam", beamtool);
const dragtool = new DragTool(beammanager, deformer);
toolmanager.register("drag", dragtool);

const querytool = new QueryTool(querymanager);
toolmanager.register("query", querytool);

// Create panels
new ToolPanel(toolmanager);
new PropertyPanel(drawtool);
new SelectionPanel(selecttool);
new BeamPanel(beamtool);

// Handle input
new Input(camera, toolmanager);

tick((_dt: number) => {
  // Update pass

  slicer.update();
  painter.update();

  // render pass
  render.clear();
  render.beginOffset(camera);
  beammanager.renderBack(render);
  painter.render(render);
  selectionmanager.render(render);
  beammanager.renderFront(render);
  querymanager.render(render);
  deformer.render(render);

  if (drawtool.active) {
    drawtool.render(render);
  }

  render.endOffset();
});
