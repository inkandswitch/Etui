import m from "mithril";
import { DrawTool } from "../tools/drawtool";

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
      ]);
    },
  };
};

const Property = {
  open: false,
  view(vnode: any) {
    const open = vnode.state.open;
    const color = vnode.attrs.value;
    const onchange = vnode.attrs.onchange;
    const options = vnode.attrs.options;
    const renderValue = vnode.attrs.renderValue;

    return m(
      ".property",
      {
        title: vnode.attrs.name,
        onclick: () => {
          vnode.state.open = !open;
        },
      },
      [
        renderValue(color),
        m(
          ".property_menu",
          {
            class: open ? "--open" : "",
          },
          options.map((c: any) =>
            m(
              ".option",
              {
                onclick: () => onchange(c),
              },
              renderValue(c),
            ),
          ),
        ),
      ],
    );
  },
};

const Circle = {
  view(vnode: any) {
    const diameter = vnode.attrs.diameter;
    return m(
      ".circle_wrapper",
      m(".circle", { style: `width: ${diameter}px; height: ${diameter}px;` }),
    );
  },
};
