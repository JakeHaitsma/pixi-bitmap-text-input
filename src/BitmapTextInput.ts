import * as PIXI from "pixi.js";

interface IBitmapTextInputOptions {
  /**
   * Whether the text input and corresponding DOM input should be multiline.
   * When `true` the underlying DOM element type is a `textarea`, otherwise it is an `input`.
   */
  multiline?: boolean;

  /**
   * A callback to fire when the DOM input receives a key down event.
   * @param event The keyboard event associated with the keypress.
   */
  onKeyDown?: (event: KeyboardEvent) => void;

  /**
   * A callback to fire when the DOM input receives a key up event.
   * @param event The keyboard event associated with the keypress.
   */
  onKeyUp?: (event: KeyboardEvent) => void;

  /**
   * A list of available Font characters, used for sizing the bitmap text container.
   * Defaults to English alphanumerics.
   */
  alphabet?: string;

  /**
   * The maximum number of characters allowed in the input.
   */
  maxLength?: number;
}

export class BitmapTextInput extends PIXI.Container {
  constructor(
    text: string,
    {
      bitmapTextStyle = {},
      domInputStyle = {},
      options = {},
    }: {
      bitmapTextStyle?: Partial<PIXI.IBitmapTextStyle & { multiline: boolean }>;
      domInputStyle?: Partial<CSSStyleDeclaration>;
      options?: IBitmapTextInputOptions;
    } = {}
  ) {
    super();

    this.options = options;

    this.bitmapText = new PIXI.BitmapText(text, bitmapTextStyle);
    this.addChild(this.bitmapText);

    this.domInput = options.multiline
      ? document.createElement("textarea")
      : document.createElement("input");
    this.domInput.value = text;
    if (options.maxLength !== undefined) {
      this.domInput.maxLength = options.maxLength;
    }
    this.domInput.style.position = "absolute";
    this.domInput.style.width =
      (bitmapTextStyle.maxWidth ?? this.bitmapText.width) + "px";
    this.domInput.style.border = "none";
    this.domInput.style.padding = "0";
    this.domInput.style.margin = "0";
    this.domInput.style.outline = "none";
    this.domInput.style.background = "none";
    this.domInput.style.resize = "none";
    this.domInput.style.overflow = "hidden";
    Object.assign(this.domInput.style, domInputStyle);

    // Bind events before adding listeners so listeners can be cleaned by reference on destroy.
    this.onAdded = this.onAdded.bind(this);
    this.onRemoved = this.onRemoved.bind(this);
    this.onInput = this.onInput.bind(this);
    this.onFocused = this.onFocused.bind(this);
    this.onBlurred = this.onBlurred.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);

    if (bitmapTextStyle.maxWidth !== undefined && !options.multiline) {
      // By default `maxWidth` causes text to wrap, but we want to clip it (to match DOM element behavior).
      // To do this, we create a mask that clips the text and remove `maxWidth`.
      const text = this.bitmapText.text;

      // PIXI does not guarantee we'll have loaded the Font at this point, and BitmapText._font is internal.
      // We could potentially use an alphabet from `_font.chars.map(String.fromCharCode)`. For now, allow consumers
      // to provide a character set for sizing and fall back to English alphanumerics.
      this.bitmapText.text =
        options.alphabet ??
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      this.bitmapText.maxWidth = 0;
      this.bitmapTextMask = new PIXI.Graphics();
      this.bitmapTextMask.beginFill(0xffffff);
      this.bitmapTextMask.drawRect(
        0,
        0,
        bitmapTextStyle.maxWidth,
        this.bitmapText.maxLineHeight
      );
      this.bitmapTextMask.endFill();
      this.addChild(this.bitmapTextMask);

      this.bitmapText.mask = this.bitmapTextMask;
      this.bitmapText.text = text;
    }

    // Blur by default
    this.onBlurred();

    this.addListeners();
  }

  public set text(value: string) {
    const truncatedValue =
      this.options.maxLength !== undefined &&
      value.length > this.options.maxLength
        ? value.slice(0, this.options.maxLength)
        : value;

    this.domInput.value = truncatedValue;
    this.bitmapText.text = truncatedValue;
  }

  public set inert(value: boolean) {
    this.domInput.inert = value;
    if (value) {
      this.onBlurred();
    }
  }

  public get text() {
    return this.domInput.value;
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
    this.domInput.addEventListener("keydown", this.onKeyDown);
    this.domInput.addEventListener("keyup", this.onKeyUp);
    PIXI.Ticker.shared.add(this.checkWorldVisible, this);
  }

  private removeListeners() {
    this.off("added", this.onAdded);
    this.off("removed", this.onRemoved);
    this.domInput.removeEventListener("input", this.onInput);
    this.domInput.removeEventListener("focus", this.onFocused);
    this.domInput.removeEventListener("blur", this.onBlurred);
    this.domInput.removeEventListener("keydown", this.onKeyDown);
    this.domInput.removeEventListener("keyup", this.onKeyUp);
    PIXI.Ticker.shared.remove(this.checkWorldVisible, this);
  }

  private onKeyDown(event: Event) {
    if (typeof this.options.onKeyDown === "function") {
      this.options.onKeyDown(event as KeyboardEvent);
    }
  }

  private onKeyUp(event: Event) {
    if (typeof this.options.onKeyUp === "function") {
      this.options.onKeyUp(event as KeyboardEvent);
    }
  }

  private onInput() {
    this.bitmapText.text = this.domInput.value;
    this.onBoundsChanged();
  }

  private onFocused() {
    this.bitmapText.visible = false;
    this.domInput.style.opacity = "1";
  }

  private onBlurred() {
    this.bitmapText.visible = true;
    this.domInput.style.opacity = "0";
  }

  render(renderer: PIXI.Renderer): void {
    super.render(renderer);

    const canvasBounds = renderer.view.getBoundingClientRect?.();
    if (canvasBounds) {
      this.canvasBoundingRect = this.calculateCanvasBounds(canvasBounds);
      this.onBoundsChanged();
    }

    this.checkWorldVisible();
  }

  private checkWorldVisible() {
    if (this.worldVisible !== this.lastKnownVisible) {
      this.domInput.style.display = this.worldVisible ? "block" : "none";
      this.lastKnownVisible = this.worldVisible;
    }
  }

  private calculateCanvasBounds(bounds: PIXI.ICanvasRect) {
    const { x, y, width, height } = bounds;

    return { left: x + window.scrollX, top: y + window.scrollY, width, height };
  }

  private onBoundsChanged() {
    if (!this.canvasBoundingRect) return;

    const { left: canvasLeft, top: canvasTop } = this.canvasBoundingRect;
    const { x: bitmapTextLeft, y: bitmapTextTop } = this.bitmapText.getBounds();
    this.domInput.style.left = `${canvasLeft + bitmapTextLeft}px`;
    this.domInput.style.top = `${canvasTop + bitmapTextTop}px`;
  }

  private onAdded() {
    document.body.appendChild(this.domInput);
  }

  private onRemoved() {
    document.body.removeChild(this.domInput);
  }

  private bitmapText: PIXI.BitmapText;
  private domInput: HTMLInputElement | HTMLTextAreaElement;
  private canvasBoundingRect:
    | { left: number; top: number; width: number; height: number }
    | undefined;
  private lastKnownVisible: boolean | undefined;
  private options: IBitmapTextInputOptions;
  private bitmapTextMask: PIXI.Graphics | undefined;
}
