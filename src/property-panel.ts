import m from "mithril";
import { DrawTool } from "./tools/drawtool";

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
          value: drawtool.color,
          onchange: (value: string) => (drawtool.color = value),
        }),
        m(".property", ""),
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
    return m(
      ".property",
      {
        onclick: () => {
          vnode.state.open = !open;
        },
      },
      [
        m(".swatch", { style: `background: ${color};` }),
        m(
          ".property_menu",
          {
            class: open ? "--open" : "",
          },
          [
            m(".swatch", {
              style: "background: #000000;",
              onclick: () => onchange("#000000"),
            }),
            m(".swatch", {
              style: "background: #FF6F61;",
              onclick: () => onchange("#FF6F61"),
            }),
            m(".swatch", {
              style: "background: #5FD9C9;",
              onclick: () => onchange("#5FD9C9"),
            }),
            m(".swatch", {
              style: "background: #5AB1F0;",
              onclick: () => onchange("#5AB1F0"),
            }),
            m(".swatch", {
              style: "background: #A785E2;",
              onclick: () => onchange("#A785E2"),
            }),
            m(".swatch", {
              style: "background: #FFA987;",
              onclick: () => onchange("#FFA987"),
            }),
            m(".swatch", {
              style: "background: #FFD966;",
              onclick: () => onchange("#FFD966"),
            }),
          ],
        ),
      ],
    );
  },
};
