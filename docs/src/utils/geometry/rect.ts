import { Point } from './point';

export type RectJSON = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export class Rect {
  static zero(): Rect {
    return new Rect();
  }

  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;

  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  get bottom(): number {
    return this.top + this.height;
  }

  get center(): Point {
    return new Point(this.x + this.width / 2, this.y + this.height / 2);
  }

  get isZero(): boolean {
    return (
      this.x === 0 && this.y === 0 && this.width === 0 && this.height === 0
    );
  }

  get left(): number {
    return this.x;
  }

  get right(): number {
    return this.left + this.width;
  }

  get top(): number {
    return this.y;
  }

  contains(point: Point): boolean {
    return (
      point.x >= this.left &&
      point.x <= this.right &&
      point.y >= this.top &&
      point.y <= this.bottom
    );
  }

  isEqual(rect: Rect): boolean {
    return (
      this.x === rect.x &&
      this.y === rect.y &&
      this.width === rect.width &&
      this.height === rect.height
    );
  }

  toJSON(): RectJSON {
    return {
      height: this.height,
      width: this.width,
      x: this.x,
      y: this.y,
    };
  }
}
