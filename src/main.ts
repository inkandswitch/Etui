import Render from "./render";
import Input from "./input";
import Camera from "./camera";
import StrokeManager from "./stroke-manager";
import Slicer from "./slicer";
import Painter from "./painter";

import SelectionManager from "./selection-manager";
import BeamManager from "./beam-manager";
import QueryManager from "./query-manager";

import PropertyPanel from "./panels/property-panel";
import ToolPanel from "./panels/tool-panel";
import SelectionPanel from "./panels/selection-panel";

import ToolManager from "./tool-manager";
import DrawTool from "./tools/drawtool";
import SelectTool from "./tools/selecttool";
import BeamTool from "./tools/beamtool";
import QueryTool from "./tools/querytool";
import type { Doc } from "./datatype";
import type Stroke from "./stroke";

export interface EtuiInstance {
  onStrokeComplete?: (stroke: Stroke) => void;
  onCameraChange?: (camera: Doc["camera"]) => void;
  addStroke: (stroke: Stroke) => void;
  setCamera: (camera: Doc["camera"]) => void;
  cleanup: () => void;
}

export function setupEtui(canvas: HTMLCanvasElement): EtuiInstance {
  // Initialize render with canvas
  const render = new Render(canvas);
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

  let stopTickCallback: (() => void) | undefined;

  // Set up render loop
  const startTick = () => {
    let running = true;
    const tickFn = (dt: number) => {
      if (!running) return;
      render.clear();
      render.beginOffset(camera);

      slicer.update();
      painter.update();
      painter.render(render);

      // strokemanager.render(render);

      selectionmanager.render(render);

      if (beamtool.active) {
        beammanager.render(render);
      }

      querymanager.render(render);

      render.endOffset();
      requestAnimationFrame(() => tickFn(performance.now()));
    };
    tickFn(performance.now());
    return () => {
      running = false;
    };
  };

  stopTickCallback = startTick();

  return {
    onStrokeComplete: undefined,
    onCameraChange: undefined,
    addStroke: (stroke: Stroke) => {
      strokemanager.addStroke(stroke);
    },
    setCamera: (cameraState) => {
      Object.assign(camera, cameraState);
    },
    cleanup: () => {
      stopTickCallback?.();
    },
  };
}
