import m from "mithril";
import DrawTool from "../tools/drawtool";
import { Property, Circle } from "./property";

export default class PropertyPanel {
  panel: HTMLDivElement;

  constructor(drawtool: DrawTool) {
    this.panel = document.createElement("div");
    document.body.appendChild(this.panel);
    m.mount(this.panel, Panel(drawtool));
  }
}

const Panel = (drawtool: DrawTool) => {
  return {
    view() {
      if (!drawtool.active) return;
      return m(".property_panel", [
        m(Property, {
          name: "Color",
          value: drawtool.color,
          onchange: (value: string) => (drawtool.color = value),
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
        }),
        m(Property, {
          name: "Weight",
          value: drawtool.weight,
          onchange: (value: number) => (drawtool.weight = value),
          renderValue: (value: number) => m(Circle, { diameter: value * 2 }),
          options: [1, 3, 5, 7, 9, 11, 13],
        }),
        m(Property, {
          name: "Brush",
          value: drawtool.brush,
          onchange: (value: string) => (drawtool.brush = value),
          renderValue: (value: string) => m(".mode", brushIcon(value)),
          options: ["pen", "pencil", "marker", "brush"],
        }),
      ]);
    },
  };
};

function brushIcon(brush: string): string {
  if (brush == "pen") {
    return "✒️";
  } else if (brush == "pencil") {
    return "✏️";
  } else if (brush == "marker") {
    return "🖍️";
  } else if (brush == "brush") {
    return "🖌️";
  }
  return "";
}
