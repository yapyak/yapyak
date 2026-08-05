export type OffsetJSON = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

export class Offset {
  static zero(): Offset {
    return new Offset();
  }

  left: number;
  top: number;
  right: number;
  bottom: number;

  constructor(left = 0, top = 0, right = 0, bottom = 0) {
    this.left = left;
    this.top = top;
    this.right = right;
    this.bottom = bottom;
  }

  get isZero(): boolean {
    return (
      this.left === 0 && this.top === 0 && this.right === 0 && this.bottom === 0
    );
  }

  isEqual(other: Offset): boolean {
    return (
      this.left === other.left &&
      this.top === other.top &&
      this.right === other.right &&
      this.bottom === other.bottom
    );
  }

  toJSON(): OffsetJSON {
    return {
      bottom: this.bottom,
      left: this.left,
      right: this.right,
      top: this.top,
    };
  }
}
