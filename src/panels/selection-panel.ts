import m from "mithril";
import SelectTool from "../tools/selecttool";
import { Property, Circle } from "./property";

export default class SelectionPanel {
  panel: HTMLDivElement;

  constructor(selecttool: SelectTool) {
    this.panel = document.createElement("div");
    document.body.appendChild(this.panel);
    m.mount(this.panel, Panel(selecttool));
  }
}

const Panel = (selecttool: SelectTool) => {
  return {
    view() {
      if (!selecttool.active) return;

      const colors = Array.from(selecttool.selectionmanager.selectedColors);
      return m(".property_panel", [
        m(Property, {
          name: "Mode",
          value: selecttool.mode,
          onchange: (value: string) => (selecttool.mode = value as any),
          renderValue: (value: string) => m(".mode", modeIcon(value)),
          options: ["whole", "cut", "noodle"],
        }),
        colors.map((color) => {
          return m(Property, {
            name: "Color",
            value: color,
            onchange: (value: string) => selecttool.updateColor(color, value),
            onrightclick: () => {
              selecttool.narrowToColor(color);
            },
            renderValue: (value: string) =>
              m(".swatch", { style: `background: ${value};` }),
            options: [
              "#000000",
              "#FF6F61",
              "#5FD9C9",
              "#5AB1F0",
              "#A785E2",
              "#FFA987",
              "#FFD966",
            ],
          });
        }),
      ]);
    },
  };
};

function modeIcon(mode: string) {
  switch (mode) {
    case "whole":
      return "🥦";
    case "cut":
      return "✂️";
    case "noodle":
      return "🍜";
  }
}
