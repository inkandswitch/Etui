import m from "mithril";

export const Property = {
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
        oncontextmenu: (e: any) => {
          e.preventDefault();
          e.stopPropagation();
          if (vnode.attrs.onrightclick) {
            vnode.attrs.onrightclick();
          }
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

export const Circle = {
  view(vnode: any) {
    const diameter = vnode.attrs.diameter;
    return m(
      ".circle_wrapper",
      m(".circle", { style: `width: ${diameter}px; height: ${diameter}px;` }),
    );
  },
};
