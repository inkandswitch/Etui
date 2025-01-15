import m from "mithril";
import ToolManager from "../tool-manager";

export default class ToolPanel {
  panel: HTMLDivElement;

  constructor(toolmanager: ToolManager) {
    this.panel = document.createElement("div");
    document.body.appendChild(this.panel);
    m.mount(this.panel, Panel(toolmanager));
  }
}

const Panel = (toolmanager: ToolManager) => {
  return {
    view() {
      return m(".tool_panel", [
        m(Tool, {
          name: "draw",
          icon: "🖊️",
          toolmanager,
        }),
        m(Tool, {
          name: "select",
          icon: "🖱️",
          toolmanager,
        }),
        m(Tool, {
          name: "beam",
          icon: "🦴",
          toolmanager,
        }),
        m(Tool, {
          name: "erase",
          icon: "🧽",
          toolmanager,
        }),
      ]);
    },
  };
};

const Tool = {
  view(vnode: any) {
    const toolmanager = vnode.attrs.toolmanager;
    return m(
      ".tool",
      {
        title: vnode.attrs.name,
        class: toolmanager.currentTool === vnode.attrs.name ? "--active" : "",
        onclick: () => {
          toolmanager.setCurrentTool(vnode.attrs.name);
        },
      },
      vnode.attrs.icon,
    );
  },
};
