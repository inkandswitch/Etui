import m from "mithril";
import Config from "./config";

export default class SettingsPanel {
  panel: HTMLDivElement;

  constructor() {
    this.panel = document.createElement("div");
    document.body.appendChild(this.panel);
    m.mount(this.panel, Wrapper);
  }
}

const Wrapper = {
  view() {
    return m(".settings_panel", [
      m(Section, {
        title: "Point Reduction",
        childeren: [
          row(
            "Epsilon",
            m("input", {
              type: "range",
              min: "0",
              max: "5",
              step: "0.05",
              value: Config.simplifyEpsilon,
              oninput: (e: any) => {
                Config.simplifyEpsilon = e.target.value;
                window.capture.recompute();
              },
            }),
          ),
          row(
            "Split point",
            m(
              "select",
              {
                oninput: (e: any) => {
                  Config.simplifyAlgorithm = e.target.value;
                  window.capture.recompute();
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

const Section = {
  open: true,
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
