// types.tsx
// React Native / TypeScript version of detection types

export interface ImageTensor {
  tensorData: number[][][] | number[][][][];
  padding: [number, number, number, number];
  originalSize: [number, number];
}

export class Rect {
  constructor(
    public xCenter: number,
    public yCenter: number,
    public width: number,
    public height: number,
    public rotation: number,
    public normalized: boolean
  ) {}

  get size(): [number, number] {
    const w = this.width;
    const h = this.height;
    return this.normalized ? [w, h] : [Math.round(w), Math.round(h)];
  }

  scaled(size: [number, number], normalize: boolean = false): Rect {
    if (this.normalized === normalize) return this;
    let [sx, sy] = size;
    if (normalize) {
      sx = 1 / sx;
      sy = 1 / sy;
    }
    return new Rect(
      this.xCenter * sx,
      this.yCenter * sy,
      this.width * sx,
      this.height * sy,
      this.rotation,
      false
    );
  }

  points(): [number, number][] {
    const x = this.xCenter;
    const y = this.yCenter;
    const w = this.width / 2;
    const h = this.height / 2;
    const pts: [number, number][] = [
      [x - w, y - h],
      [x + w, y - h],
      [x + w, y + h],
      [x - w, y + h],
    ];
    if (this.rotation === 0) return pts;

    const s = Math.sin(this.rotation);
    const c = Math.cos(this.rotation);
    return pts.map(([px, py]) => {
      const dx = px - x;
      const dy = py - y;
      return [dx * c - dy * s + x, dx * s + dy * c + y];
    });
  }
}

export class BBox {
  constructor(
    public xmin: number,
    public ymin: number,
    public xmax: number,
    public ymax: number
  ) {}

  get asTuple(): [number, number, number, number] {
    return [this.xmin, this.ymin, this.xmax, this.ymax];
  }

  get width(): number {
    return this.xmax - this.xmin;
  }

  get height(): number {
    return this.ymax - this.ymin;
  }

  get empty(): boolean {
    return this.width <= 0 || this.height <= 0;
  }

  get normalized(): boolean {
    return this.xmin >= -1 && this.xmax < 2 && this.ymin >= -1;
  }

  get area(): number {
    return this.empty ? 0 : this.width * this.height;
  }

  intersect(other: BBox): BBox | null {
    const xmin = Math.max(this.xmin, other.xmin);
    const ymin = Math.max(this.ymin, other.ymin);
    const xmax = Math.min(this.xmax, other.xmax);
    const ymax = Math.min(this.ymax, other.ymax);
    return xmin < xmax && ymin < ymax ? new BBox(xmin, ymin, xmax, ymax) : null;
  }

  scale(size: [number, number]): BBox {
    const [sx, sy] = size;
    return new BBox(
      this.xmin * sx,
      this.ymin * sy,
      this.xmax * sx,
      this.ymax * sy
    );
  }

  absolute(size: [number, number]): BBox {
    return this.normalized ? this.scale(size) : this;
  }
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export class Detection {
  public data: number[][];
  public score: number;

  constructor(data: number[][], score: number) {
    this.data = data;
    this.score = score;
  }

  get length(): number {
    return this.data.length - 2;
  }

  get bbox(): BBox {
    const [xmin, ymin] = this.data[0];
    const [xmax, ymax] = this.data[1];
    return new BBox(xmin, ymin, xmax, ymax);
  }

  get keypoints() {

    return 

  }

  scaled(factor: [number, number] | number): Detection {
    const f = Array.isArray(factor)
      ? factor
      : [factor, factor];
    const scaled = this.data.map(([x, y]) => [x * f[0], y * f[1]]);
    return new Detection(scaled, this.score);
  }

  [Symbol.iterator]() {
    return this.data.slice(2)[Symbol.iterator]();
  }

  get(index: number): [number, number] {
    const [x, y] = this.data[index + 2];
    return [x, y];
  }
}