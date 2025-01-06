export default class Render {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement("canvas");
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d")!;
    // scale the canvas to the device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;

    this.ctx.scale(dpr, dpr);
  }

  applyStyle(style: RenderStyle) {
    this.ctx.fillStyle = style.fillStyle;
    this.ctx.strokeStyle = style.strokeStyle;
    this.ctx.lineWidth = style.lineWidth;
    if (style.font) {
      this.ctx.font = style.font;
    }
  }

  line(x1: number, y1: number, x2: number, y2: number, style: RenderStyle) {
    this.applyStyle(style);
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }

  point(x: number, y: number, style: RenderStyle) {
    this.applyStyle(style);
    this.ctx.fillRect(x - 1, y - 1, 2, 2);
  }

  rect(x: number, y: number, w: number, h: number, style: RenderStyle) {
    this.applyStyle(style);
    if (style.doFill) {
      this.ctx.fillRect(x, y, w, h);
    }
    if (style.doStroke) {
      this.ctx.strokeRect(x, y, w, h);
    }
  }
}

export type RenderStyle = {
  fillStyle: string;
  strokeStyle: string;
  font: string | null;
  lineWidth: number;
  doFill: boolean;
  doStroke: boolean;
};

export function defaultStyle(): RenderStyle {
  return {
    fillStyle: "black",
    strokeStyle: "black",
    font: null,
    lineWidth: 1,
    doFill: true,
    doStroke: true,
  };
}

export function fill(fillStyle: string): RenderStyle {
  let s = defaultStyle();
  s.fillStyle = fillStyle;
  s.doStroke = false;
  return s;
}

export function stroke(strokeStyle: string, lineWidth: number): RenderStyle {
  let s = defaultStyle();
  s.strokeStyle = strokeStyle;
  s.lineWidth = lineWidth;
  s.doFill = false;
  return s;
}

export function fillAndStroke(
  fillStyle: string,
  strokeStyle: string,
  lineWidth: number,
): RenderStyle {
  let s = defaultStyle();
  s.fillStyle = fillStyle;
  s.strokeStyle = strokeStyle;
  s.lineWidth = lineWidth;
  return s;
}
