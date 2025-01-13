export type Point = {
  x: number;
  y: number;
};

export function Point(x: number, y: number): Point {
  return { x, y };
}

// reflect point a around point b
Point.reflect = (a: Point, b: Point): Point => {
  return Point(2 * b.x - a.x, 2 * b.y - a.y);
};
