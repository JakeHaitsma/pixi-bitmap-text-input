import * as PIXI from "pixi.js";
import fs from "fs";
import path from "path";
import { beforeAll, describe, expect, it } from "vitest";
import { BitmapTextInput } from "../src/BitmapTextInput";

describe("BitmapTextInput", () => {
  let fontXML: XMLDocument;

  beforeAll(async () => {
    const fontPath = path.resolve(__dirname, "resources");
    const fontXMLPath = path.resolve(fontPath, "font.fnt");
    const fontXMLString = fs.readFileSync(fontXMLPath, "utf-8");
    fontXML = new DOMParser().parseFromString(fontXMLString, "text/xml");
  });

  it("constructs without error", () => {
    const { font: fontName } = PIXI.BitmapFont.install(
      fontXML,
      PIXI.Texture.EMPTY
    );
    const bitmapTextInput = new BitmapTextInput("Lorem ipsum dolor sit amet.", {
      bitmapTextStyle: {
        fontName,
      },
    });
    expect(bitmapTextInput).toBeDefined();
  });

  it("truncates text from initial value", () => {
    const { font: fontName } = PIXI.BitmapFont.install(
      fontXML,
      PIXI.Texture.EMPTY
    );
    const initialText = "Lorem ipsum dolor sit amet.";
    const maxLength = 5;
    const bitmapTextInput = new BitmapTextInput(initialText, {
      bitmapTextStyle: {
        fontName,
      },
      options: {
        maxLength: 5,
      },
    });

    expect(bitmapTextInput.text).toBe(initialText.slice(0, maxLength));
  });

  it("truncates text exceeding max length when set directly", () => {
    const { font: fontName } = PIXI.BitmapFont.install(
      fontXML,
      PIXI.Texture.EMPTY
    );
    const maxLength = 5;
    const bitmapTextInput = new BitmapTextInput("", {
      bitmapTextStyle: {
        fontName,
      },
      options: {
        maxLength,
      },
    });

    const initialText = "Lorem ipsum dolor sit amet.";
    bitmapTextInput.text = initialText;
    expect(bitmapTextInput.text).toBe(initialText.slice(0, maxLength));
  });
});
