import "vitest-canvas-mock";
import { describe, expect, it, vi } from "vitest";
import {
  BitmapTextInput,
  IBitmapTextInputOptions,
} from "../src/BitmapTextInput";
import { Container, Graphics, Ticker } from "pixi.js";

function getBitmapTextInput(
  options: Partial<IBitmapTextInputOptions> = {},
  canvas?: HTMLCanvasElement
) {
  const defaultOptions: IBitmapTextInputOptions = {
    text: "Lorem ipsum dolor sit amet",
  };

  return new BitmapTextInput(
    {
      ...defaultOptions,
      ...options,
    },
    canvas
  );
}

describe("BitmapTextInput", () => {
  it("constructs without error", () => {
    const bitmapTextInput = getBitmapTextInput();

    expect(bitmapTextInput).toBeDefined();
  });

  it("sets initial text value", () => {
    const text = "Hello, world!";
    const bitmapTextInput = getBitmapTextInput({ text });

    expect(bitmapTextInput.text).toBe(text);
    expect(bitmapTextInput.domNode.value).toBe(text);
  });

  it("sets text value", () => {
    const bitmapTextInput = getBitmapTextInput();
    const text = "Goodbye, world!";

    bitmapTextInput.text = text;

    expect(bitmapTextInput.text).toBe(text);
    expect(bitmapTextInput.domNode.value).toBe(text);
  });

  it("sets inert value", () => {
    const bitmapTextInput = getBitmapTextInput();

    bitmapTextInput.inert = true;

    expect(bitmapTextInput.inert).toBe(true);
    expect(bitmapTextInput.domNode.inert).toBe(true);
  });

  it("creates DOM node when added to container", () => {
    const bitmapTextInput = getBitmapTextInput();

    const container = new Container();
    container.addChild(bitmapTextInput);

    expect(document.body.contains(bitmapTextInput.domNode)).toBe(true);
  });

  it("deletes DOM node when removed", () => {
    const bitmapTextInput = getBitmapTextInput();
    const container = new Container();
    container.addChild(bitmapTextInput);
    expect(document.body.contains(bitmapTextInput.domNode)).toBe(true);

    container.removeChild(bitmapTextInput);

    expect(document.body.contains(bitmapTextInput.domNode)).toBe(false);
  });

  it("updates text value when input changes", () => {
    const bitmapTextInput = getBitmapTextInput();

    const newText = "New text";
    bitmapTextInput.domNode.value = newText;
    trigger(bitmapTextInput);

    expect(bitmapTextInput.text).toBe(newText);
  });

  it("uses bitmap text by default", () => {
    const bitmapTextInput = getBitmapTextInput();

    expectBitmapTextVisible(bitmapTextInput);
  });

  it("renders DOM input when focused", () => {
    const bitmapTextInput = getBitmapTextInput();

    expectBitmapTextVisible(bitmapTextInput);

    bitmapTextInput.domNode.dispatchEvent(new Event("focus"));

    expectDomNodeVisible(bitmapTextInput);
  });

  it("renders PIXI input when blurred", () => {
    const bitmapTextInput = getBitmapTextInput();

    bitmapTextInput.domNode.dispatchEvent(new Event("focus"));
    expectDomNodeVisible(bitmapTextInput);

    bitmapTextInput.domNode.dispatchEvent(new Event("blur"));

    expectBitmapTextVisible(bitmapTextInput);
  });

  it("sets mask when maxWidth and maxHeight are set", () => {
    const bitmapTextInput = getBitmapTextInput({
      maxWidth: 100,
      maxHeight: 200,
    });

    expect(bitmapTextInput.mask).toBeDefined();
    expect(bitmapTextInput.mask).toBeInstanceOf(Graphics);

    const mask = bitmapTextInput.mask as Graphics;
    expect(mask.width).toBe(100);
    expect(mask.height).toBe(200);
  });

  it("does not set mask when maxWidth and maxHeight are not set", () => {
    const bitmapTextInput = getBitmapTextInput();

    expect(bitmapTextInput.mask).toBeUndefined();
  });

  it("destroys without error", () => {
    const bitmapTextInput = getBitmapTextInput();

    bitmapTextInput.destroy();

    expect(bitmapTextInput).toBeDefined();
  });

  it("uses a custom ticker if provided", () => {
    const ticker = new Ticker();
    ticker.add = vi.fn(ticker.add);

    getBitmapTextInput({ ticker });

    expect(ticker.add).toHaveBeenCalled();
  });

  it("uses ticker shared instance by default", () => {
    const ticker = Ticker.shared;
    ticker.add = vi.fn(ticker.add);

    getBitmapTextInput();

    expect(ticker.add).toHaveBeenCalled();
  });

  it("offsets bitmap input DOM surrogate by canvas position", () => {
    const canvas = getCanvas({ x: 10, y: 10, width: 100, height: 100 });

    const bitmapTextInput = getBitmapTextInput({}, canvas);
    trigger(bitmapTextInput);

    expect(bitmapTextInput.domNode.style.left).toBe("10px");
    expect(bitmapTextInput.domNode.style.top).toBe("10px");
  });

  it("combines canvas, bitmap text, and domNodeOffset offsets", () => {
    const canvas = getCanvas({ x: 10, y: 10, width: 100, height: 100 });

    const bitmapTextInput = getBitmapTextInput(
      {
        domNodeOffset: { x: 5, y: 5 },
      },
      canvas
    );
    bitmapTextInput.position.set(15, 15);
    trigger(bitmapTextInput);

    expect(bitmapTextInput.domNode.style.left).toBe("30px");
    expect(bitmapTextInput.domNode.style.top).toBe("30px");
  });

  it("does not offset bitmap text surrogate when not using canvas", () => {
    const bitmapTextInput = getBitmapTextInput();
    trigger(bitmapTextInput);

    expect(bitmapTextInput.domNode.style.left).toBe("0px");
    expect(bitmapTextInput.domNode.style.top).toBe("0px");
  });

  it("offsets bitmap input DOM surrogate by domNodeOffset", () => {
    const bitmapTextInput = getBitmapTextInput({
      domNodeOffset: { x: 5, y: 10 },
    });
    trigger(bitmapTextInput);

    expect(bitmapTextInput.domNode.style.left).toBe("5px");
    expect(bitmapTextInput.domNode.style.top).toBe("10px");
  });
});

function trigger(input: BitmapTextInput) {
  input.domNode.dispatchEvent(new Event("input"));
}

function expectBitmapTextVisible(input: BitmapTextInput) {
  expect(input.alpha).toBe(1);
  expect(input.domNode.style.opacity).toBe("0");
}

function expectDomNodeVisible(input: BitmapTextInput) {
  expect(input.alpha).toBe(0);
  expect(input.domNode.style.opacity).toBe("1");
}

function getCanvas(params: {
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  const canvas = document.createElement("canvas");
  canvas.getBoundingClientRect = vi.fn(() => ({
    left: params.x,
    top: params.y,
    width: params.width,
    height: params.height,
    right: params.x + params.width,
    bottom: params.y + params.height,
    x: params.x,
    y: params.y,
    toJSON: vi.fn(() => ({})),
  }));

  return canvas;
}
