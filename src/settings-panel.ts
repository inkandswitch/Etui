import m from "mithril";
import Capture from "./capture";

export default class SettingsPanel {
  panel: HTMLDivElement;

  constructor(capture: Capture) {
    this.panel = document.createElement("div");
    document.body.appendChild(this.panel);
    m.mount(this.panel, Panel(capture));
  }
}

const Panel = (capture: Capture) => {
  return {
    view() {
      return m(".settings_panel", [
        m(Section, {
          title: "Linear approximation",
          childeren: [
            row(
              "Debug Render",
              m("input", {
                type: "checkbox",
                checked: capture.debugRender,
                oninput: (e: any) => (capture.debugRender = e.target.checked),
              }),
            ),
            row(
              "Epsilon",
              m("input", {
                type: "range",
                min: "0",
                max: "5",
                step: "0.05",
                value: capture.epsilon,
                oninput: (e: any) => {
                  capture.epsilon = e.target.value;
                  capture.recompute();
                },
              }),
            ),
            row(
              "Split point",
              m(
                "select",
                {
                  oninput: (e: any) => {
                    capture.algorithm = e.target.value;
                    capture.recompute();
                  },
                },
                [m("option", "furthest"), m("option", "last")],
              ),
            ),
          ],
        }),
      ]);
    },
  };
};

const Section = {
  open: false,
  view(vnode: any) {
    const attrs = vnode.attrs;
    return m(".settings_section", [
      m(
        ".settings_header",
        { onclick: () => (vnode.state.open = !vnode.state.open) },
        m("span", vnode.state.open ? "▼ " : "▶ "),
        attrs.title,
      ),
      vnode.state.open ? attrs.childeren : [],
    ]);
  },
};

function row(label: string, right: m.Vnode) {
  return m(".settings_row", [m("label", label), right]);
}
