import m from "mithril";
import Capture from "./capture";
import Stroke, { Strokes } from "./stroke";

export default class SettingsPanel {
  panel: HTMLDivElement;

  constructor(capture: Capture, strokes: Strokes) {
    this.panel = document.createElement("div");
    document.body.appendChild(this.panel);
    m.mount(this.panel, Panel(capture, strokes));
  }
}

const Panel = (capture: Capture, strokes: Strokes) => {
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
        m(Section, {
          title: "Resampling",
          childeren: [
            row(
              "Debug Render",
              m("input", {
                type: "checkbox",
                checked: strokes.debugRender,
                oninput: (e: any) => (strokes.debugRender = e.target.checked),
              }),
            ),
            row(
              "Step Size",
              m("input", {
                type: "range",
                min: "0.5",
                max: "10",
                step: ".5",
                value: strokes.step,
                oninput: (e: any) => {
                  strokes.step = parseFloat(e.target.value);
                  strokes.rebuildInklets();
                },
              }),
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
