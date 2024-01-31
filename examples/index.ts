import * as PIXI from "pixi.js";
import { BitmapTextInput } from "../src/index";

function init() {
  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);

  const app = new PIXI.Application({
    width: 800,
    height: 600,
    backgroundColor: "#000000",
    antialias: true,
    resolution: 1,
    view: canvas,
  });

  const bitmapTextInput = new BitmapTextInput();
  bitmapTextInput.x = 100;
  bitmapTextInput.y = 100;

  app.stage.addChild(bitmapTextInput);
}

init();
