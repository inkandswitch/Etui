import m from "mithril";

export default class Tools {
  panel: HTMLDivElement;
  currentTool: string = "draw";

  constructor() {
    this.panel = document.createElement("div");
    document.body.appendChild(this.panel);
    m.mount(this.panel, ToolPanel(this));
  }
}

const ToolPanel = (tools: Tools) => {
  return {
    view() {
      return m(".tool_panel", [
        m(Tool(tools, "draw")),
        m(".tool_header", "select"),
        m(Tool(tools, "select exact")),
        m(Tool(tools, "select strokes")),
        m(Tool(tools, "select connected")),
      ]);
    },
  };
};

const Tool = (tools: Tools, name: string) => {
  return {
    view() {
      return m(
        ".tool",
        {
          onclick: () => {
            tools.currentTool = name;
          },
          class: tools.currentTool === name ? "--selected" : "",
        },
        name,
      );
    },
  };
};
