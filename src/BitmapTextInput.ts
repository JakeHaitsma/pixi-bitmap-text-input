import { BitmapText, Graphics, TextOptions, Ticker } from "pixi.js";

export interface IBitmapTextInputOptions extends TextOptions {
  domNodeOffset?: { x: number; y: number };
  maxWidth?: number;
  maxHeight?: number;
  maxLength?: number;
  ticker?: Ticker;
}

export class BitmapTextInput extends BitmapText {
  constructor(
    private options: IBitmapTextInputOptions,
    private canvas?: HTMLCanvasElement
  ) {
    super(options);

    this.onRender = this.handleRender.bind(this);
    this.ticker = options.ticker ?? Ticker.shared;

    const isMultiline = options.style?.wordWrap ?? false;

    this.domInput = isMultiline
      ? document.createElement("textarea")
      : document.createElement("input");
    this.domInput.value = options.text?.toString() ?? "";

    // Bind events before adding listeners so listeners can be cleaned by reference on destroy.
    this.onAdded = this.onAdded.bind(this);
    this.onRemoved = this.onRemoved.bind(this);
    this.onInput = this.onInput.bind(this);
    this.onFocused = this.onFocused.bind(this);
    this.onBlurred = this.onBlurred.bind(this);

    // Blur DOM input by default
    this.onBlurred();

    if (options.maxWidth !== undefined || options.maxHeight !== undefined) {
      const mask = new Graphics()
        .rect(0, 0, options.maxWidth ?? 9999, options.maxHeight ?? 9999)
        .fill(0xffffff);
      this.addChild(mask);
      this.mask = mask;
    }

    this.addListeners();
  }

  public get domNode() {
    return this.domInput;
  }

  public get text() {
    return super.text;
  }

  public set text(value: string) {
    super.text = value;
    if (this.domInput) {
      this.domInput.value = value;
    }
  }

  public set inert(value: boolean) {
    this.domInput.inert = value;
    this.onBlurred();
  }

  public get inert() {
    return this.domInput.inert;
  }

  public destroy() {
    super.destroy();
    this.removeListeners();
  }

  private addListeners() {
    this.on("added", this.onAdded);
    this.on("removed", this.onRemoved);
    this.domInput.addEventListener("input", this.onInput);
    this.domInput.addEventListener("focus", this.onFocused);
    this.domInput.addEventListener("blur", this.onBlurred);
    this.ticker.add(this.checkWorldVisible, this);
  }

  private removeListeners() {
    this.off("added", this.onAdded);
    this.off("removed", this.onRemoved);
    this.domInput.removeEventListener("input", this.onInput);
    this.domInput.removeEventListener("focus", this.onFocused);
    this.domInput.removeEventListener("blur", this.onBlurred);
    this.ticker.remove(this.checkWorldVisible, this);
  }

  private onInput() {
    this.text = this.domInput.value;
    this.onBoundsChanged();
  }

  private onFocused() {
    this.alpha = 0;
    this.domInput.style.opacity = "1";
  }

  private onBlurred() {
    this.alpha = 1;
    this.domInput.style.opacity = "0";
  }

  private handleRender() {
    this.onBoundsChanged();
    this.checkWorldVisible();
  }

  private checkWorldVisible() {
    const isWorldVisible = this.isWorldVisible();
    if (isWorldVisible !== this.lastKnownVisible) {
      this.domInput.style.display = isWorldVisible ? "block" : "none";
      this.lastKnownVisible = isWorldVisible;
    }
  }

  /**
   * globalDisplayStatus holds three bits: culled, visible, renderable:
   *
   * - the third bit represents culling (0 = culled, 1 = not culled) 0b100
   * - the second bit represents visibility (0 = not visible, 1 = visible) 0b010
   * - the first bit represents renderable (0 = not renderable, 1 = renderable) 0b001
   *
   * This function checks the second bit to see if the object is visible
   */
  private isWorldVisible() {
    return (this.globalDisplayStatus & 0b10) !== 0;
  }

  /**
   * Adjusts the DOM input position to match the BitmapText position.
   */
  private onBoundsChanged() {
    const { left: canvasLeft, top: canvasTop } = this.canvas
      ? this.canvas.getBoundingClientRect()
      : { left: 0, top: 0 };

    const bounds = this.getBounds();
    const { width: bitmapTextWidth, height: bitmapTextHeight } = bounds;

    const { x: bitmapTextLeft, y: bitmapTextTop } = this.getGlobalPosition();
    const domOffsetX = this.options.domNodeOffset?.x ?? 0;
    const domOffsetY = this.options.domNodeOffset?.y ?? 0;

    this.domInput.style.left = `${canvasLeft + bitmapTextLeft + domOffsetX}px`;
    this.domInput.style.top = `${canvasTop + bitmapTextTop + domOffsetY}px`;
    this.domInput.style.width = `${bitmapTextWidth}px`;
    this.domInput.style.height = `${bitmapTextHeight}px`;
    this.domInput.style.position = "absolute";
    this.domInput.style.border = "none";
    this.domInput.style.padding = "0";
    this.domInput.style.margin = "0";
    this.domInput.style.outline = "none";
    this.domInput.style.background = "none";
    this.domInput.style.resize = "none";
    this.domInput.style.overflow = "hidden";
    if (this.options.style?.fontSize) {
      const fontSize =
        typeof this.options.style.fontSize === "number"
          ? `${this.options.style.fontSize}px`
          : this.options.style.fontSize;
      this.domInput.style.fontSize = fontSize;
    }
    if (this.options.style?.wordWrapWidth !== undefined) {
      this.domInput.style.minWidth = `${this.options.style.wordWrapWidth}px`;
      this.domInput.style.maxWidth = `${this.options.style.wordWrapWidth}px`;
    }
  }

  private onAdded() {
    document.body.appendChild(this.domInput);
  }

  private onRemoved() {
    document.body.removeChild(this.domInput);
  }

  private domInput: HTMLInputElement | HTMLTextAreaElement;
  private lastKnownVisible: boolean | undefined;
  private ticker: Ticker;
}
