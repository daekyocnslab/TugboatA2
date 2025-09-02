// Converted React Native TypeScript module for rendering detection and landmark annotations
// Note: PIL Image rendering functions are adapted using react-native-svg or react-native-canvas libraries

export type Color = {
  r: number;
  g: number;
  b: number;
  a?: number;
};

export const Colors = {
  BLACK: { r: 0, g: 0, b: 0 },
  RED: { r: 255, g: 0, b: 0 },
  GREEN: { r: 0, g: 255, b: 0 },
  BLUE: { r: 0, g: 0, b: 255 },
  PINK: { r: 255, g: 0, b: 255 },
  WHITE: { r: 255, g: 255, b: 255 },
};

export type Point = {
  x: number;
  y: number;
  scaled: (factor: [number, number]) => Point;
};

export const scalePoint = (pt: Point, factor: [number, number]): Point => {
  const [sx, sy] = factor;
  return { ...pt, x: pt.x * sx, y: pt.y * sy };
};

export type RectOrOval = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  oval?: boolean;
};

export const scaleRect = (rc: RectOrOval, factor: [number, number]): RectOrOval => {
  const [sx, sy] = factor;
  return {
    ...rc,
    left: rc.left * sx,
    top: rc.top * sy,
    right: rc.right * sx,
    bottom: rc.bottom * sy,
  };
};

export type Line = {
  x_start: number;
  y_start: number;
  x_end: number;
  y_end: number;
  dashed?: boolean;
};

export const scaleLine = (ln: Line, factor: [number, number]): Line => {
  const [sx, sy] = factor;
  return {
    ...ln,
    x_start: ln.x_start * sx,
    y_start: ln.y_start * sy,
    x_end: ln.x_end * sx,
    y_end: ln.y_end * sy,
  };
};

export type FilledRectOrOval = {
  rect: RectOrOval;
  fill: Color;
};

export type AnnotationItem = Point | RectOrOval | FilledRectOrOval | Line;

export type Annotation = {
  data: AnnotationItem[];
  normalized_positions: boolean;
  thickness: number;
  color: Color;
};

export const scaleAnnotation = (
  annotation: Annotation,
  factor: [number, number]
): Annotation => {
  if (!annotation.normalized_positions) {
    throw new Error("Position data must be normalized");
  }
  const scaledData = annotation.data.map((item) => {
    if ("x" in item && "y" in item) return scalePoint(item, factor);
    if ("x_start" in item && "y_start" in item) return scaleLine(item, factor);
    if ("rect" in item) return { ...item, rect: scaleRect(item.rect, factor) };
    return scaleRect(item, factor);
  });
  return {
    ...annotation,
    data: scaledData,
    normalized_positions: false,
  };
};

// Rendering would typically be done using SVG or canvas in RN
// e.g., in <Svg> component, map over annotation data and render elements
// This module does not implement visual rendering logic directly