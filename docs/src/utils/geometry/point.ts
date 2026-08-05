export type PointJSON = {
  x: number;
  y: number;
};

export class Point {
  static zero(): Point {
    return new Point();
  }

  readonly x: number;
  readonly y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  get isZero(): boolean {
    return this.x === 0 && this.y === 0;
  }

  isEqual(point: Point): boolean {
    return this.x === point.x && this.y === point.y;
  }

  toJSON(): PointJSON {
    return {
      x: this.x,
      y: this.y,
    };
  }
}
