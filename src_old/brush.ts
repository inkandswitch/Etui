export type StrokeProps = {
  color: string;
  thickness: number;
  length: number;
};

export type PointProps = {
  offset: number;
  pressure: number;
  tilt_x: number;
  tilt_y: number;
};

export type InkletProps = {
  color: string;
  shape: string;
  rotation: number;
  scale_x: number;
  scale_y: number;
  offset_orthogonal: number;
  offset_aligned: number;
};

export function PenBrush(stroke: StrokeProps, point: PointProps): InkletProps {
  return {
    color: stroke.color,
    shape: "circle",
    rotation: 0,
    scale_x: point.pressure,
    scale_y: point.pressure,
    offset_orthogonal: 0,
    offset_aligned: 0,
  };
}
