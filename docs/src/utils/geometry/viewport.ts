export type ViewportJSON = {
  height: number;
  layoutHeight: number;
  layoutWidth: number;
  offsetLeft: number;
  offsetTop: number;
  width: number;
};

export class Viewport {
  static zero() {
    return new Viewport();
  }

  readonly width: number;
  readonly height: number;
  readonly offsetLeft: number;
  readonly offsetTop: number;
  readonly layoutWidth: number;
  readonly layoutHeight: number;

  constructor(
    width = 0,
    height = 0,
    offsetLeft = 0,
    offsetTop = 0,
    layoutWidth = 0,
    layoutHeight = 0,
  ) {
    this.width = width;
    this.height = height;
    this.offsetLeft = offsetLeft;
    this.offsetTop = offsetTop;
    this.layoutWidth = layoutWidth;
    this.layoutHeight = layoutHeight;
  }

  get insetLeft(): number {
    return Math.max(0, this.offsetLeft);
  }

  get insetRight(): number {
    return Math.max(0, this.layoutWidth - this.width - this.offsetLeft);
  }

  get insetTop(): number {
    return Math.max(0, this.offsetTop);
  }

  get insetBottom(): number {
    return Math.max(0, this.layoutHeight - this.height - this.offsetTop);
  }

  isEqual(viewport: Viewport): boolean {
    return (
      this.width === viewport.width &&
      this.height === viewport.height &&
      this.offsetLeft === viewport.offsetLeft &&
      this.offsetTop === viewport.offsetTop &&
      this.layoutWidth === viewport.layoutWidth &&
      this.layoutHeight === viewport.layoutHeight
    );
  }

  toJSON(): ViewportJSON {
    return {
      height: this.height,
      layoutHeight: this.layoutHeight,
      layoutWidth: this.layoutWidth,
      offsetLeft: this.offsetLeft,
      offsetTop: this.offsetTop,
      width: this.width,
    };
  }
}
