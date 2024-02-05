import * as PIXI from "pixi.js";

export class BitmapTextInput extends PIXI.Container {
  constructor(
    text: string,
    private bitmapTextStyle: Partial<PIXI.IBitmapTextStyle> = {},
    domInputStyle: Partial<CSSStyleDeclaration> = {}
  ) {
    super();

    this.bitmapText = new PIXI.BitmapText(text, bitmapTextStyle);

    this.addChild(this.bitmapText);

    this.domInput = this.isMultiline
      ? document.createElement("textarea")
      : document.createElement("input");
    this.domInput.value = text;
    this.domInput.style.position = "absolute";
    this.domInput.style.width =
      (this.bitmapTextStyle.maxWidth ?? this.bitmapText.width) + "px";
    this.domInput.style.border = "none";
    this.domInput.style.padding = "0";
    this.domInput.style.margin = "0";
    this.domInput.style.outline = "none";
    this.domInput.style.background = "none";
    this.domInput.style.resize = "none";
    this.domInput.style.overflow = "hidden";

    Object.assign(this.domInput.style, domInputStyle);

    // Bind events before adding listeners so listeners can be cleaned by reference on destroy.
    this.handleAdded = this.handleAdded.bind(this);
    this.handleRemoved = this.handleRemoved.bind(this);
    this.onInput = this.onInput.bind(this);
    this.onFocused = this.onFocused.bind(this);
    this.onBlurred = this.onBlurred.bind(this);

    // Blur by default
    this.onBlurred();

    this.addListeners();
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
    this.on("added", this.handleAdded);
    this.on("removed", this.handleRemoved);
    this.domInput.addEventListener("input", this.onInput);
    this.domInput.addEventListener("focus", this.onFocused);
    this.domInput.addEventListener("blur", this.onBlurred);
  }

  private removeListeners() {
    this.off("added", this.handleAdded);
    this.off("removed", this.handleRemoved);
    this.domInput.removeEventListener("input", this.onInput);
    this.domInput.removeEventListener("focus", this.onFocused);
    this.domInput.removeEventListener("blur", this.onBlurred);
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

  private handleAdded() {
    document.body.appendChild(this.domInput);
  }

  private handleRemoved() {
    document.body.removeChild(this.domInput);
  }

  private get isMultiline() {
    return this.bitmapTextStyle.maxWidth !== undefined;
  }

  private bitmapText: PIXI.BitmapText;
  private domInput: HTMLInputElement | HTMLTextAreaElement;
  private canvasBoundingRect:
    | { left: number; top: number; width: number; height: number }
    | undefined;
  private lastKnownVisible: boolean | undefined;
}
