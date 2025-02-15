import Camera from "./camera";

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
    this.canvas.style.width = window.innerWidth + "px";
    this.canvas.style.height = window.innerHeight + "px";

    this.ctx.scale(dpr, dpr);
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  offset(camera: Camera) {
    this.ctx.save();
    this.ctx.scale(camera.zoom, camera.zoom);
    this.ctx.translate(camera.position.x, camera.position.y);
  }

  endOffset() {
    this.ctx.restore();
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

  circle(x: number, y: number, r: number, style: RenderStyle) {
    this.applyStyle(style);
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, 2 * Math.PI);
    if (style.doFill) {
      this.ctx.fill();
    }
    if (style.doStroke) {
      this.ctx.stroke();
    }
  }

  poly(
    points: Array<{ x: number; y: number }>,
    style: RenderStyle,
    closed = true,
  ) {
    if (points.length < 2) return;

    this.applyStyle(style);
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    if (closed) this.ctx.closePath();
    if (style.doFill) {
      this.ctx.fill();
    }
    if (style.doStroke) {
      this.ctx.stroke();
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
