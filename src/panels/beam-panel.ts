import m from "mithril";
import BeamTool from "tools/beamtool";
import { Property } from "./property";

export default class BeamPanel {
  panel: HTMLDivElement;

  constructor(beamtool: BeamTool) {
    this.panel = document.createElement("div");
    document.body.appendChild(this.panel);
    m.mount(this.panel, Panel(beamtool));
  }
}

const Panel = (beamtool: BeamTool) => {
  return {
    view() {
      if (!beamtool.active) return;

      return m(".property_panel", [
        m(Property, {
          name: "Mode",
          value: beamtool.type,
          onchange: (value: string) => (beamtool.type = value as any),
          renderValue: (value: string) => m(".mode", modeIcon(value)),
          options: ["line", "circle", "curve"],
        }),
      ]);
    },
  };
};

function modeIcon(mode: string) {
  switch (mode) {
    case "line":
      return "│";
    case "circle":
      return "◯";
    case "curve":
      return "➰";
  }
}
