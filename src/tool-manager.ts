import { MouseData } from "./input";

export interface Tool {
  start(): void;
  active: boolean;

  onMouseDown(p: MouseData): void;
  onMouseMove(p: MouseData): void;
  onMouseDrag(p: MouseData): void;
  onMouseUp(p: MouseData): void;
}

export default class ToolManager {
  currentTool: string = "";
  tools: Map<string, Tool>;

  constructor() {
    this.tools = new Map();
  }

  register(name: string, tool: Tool) {
    if (this.currentTool === "") {
      this.currentTool = name;
      tool.active = true;
    }
    this.tools.set(name, tool);
  }

  setCurrentTool(name: string) {
    this.tools.get(this.currentTool)!.active = false;
    this.currentTool = name;
    this.tools.get(this.currentTool)!.start();
    this.tools.get(this.currentTool)!.active = true;
  }

  onMouseDown(p: MouseData) {
    this.tools.get(this.currentTool)!.onMouseDown(p);
  }

  onMouseMove(p: MouseData) {
    this.tools.get(this.currentTool)!.onMouseMove(p);
  }

  onMouseDrag(p: MouseData) {
    this.tools.get(this.currentTool)!.onMouseDrag(p);
  }

  onMouseUp(p: MouseData) {
    this.tools.get(this.currentTool)!.onMouseUp(p);
  }
}
