import * as PIXI from "pixi.js";
import { BitmapTextInput } from "../src/index";

async function init() {
  await PIXI.Assets.load("./fonts/Foxley816/bitmap/Foxley816.fnt");

  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);

  const app = new PIXI.Application({
    backgroundColor: "#02040a",
    antialias: true,
    resolution: 1,
    view: canvas,
  });

  const bitmapTextInput = new BitmapTextInput(
    "Lorem ipsum dolor sit amet.",
    {
      fontName: "Foxley816",
      maxWidth: 300,
    },
    {
      color: "white",
      fontFamily: "'Foxley 816'",
      fontSize: "16px",
      marginTop: "-2px",
      marginRight: "-2px",
    }
  );
  bitmapTextInput.x = Math.round(150);
  bitmapTextInput.y = Math.round(150);

  let dx = 1;
  let dy = 1;
  app.ticker.add(() => {
    bitmapTextInput.x += dx;
    bitmapTextInput.y += dy;

    if (
      bitmapTextInput.x < 0 ||
      bitmapTextInput.x > app.screen.width - bitmapTextInput.width
    ) {
      dx *= -1;
    }

    if (
      bitmapTextInput.y < 0 ||
      bitmapTextInput.y > app.screen.height - bitmapTextInput.height
    ) {
      dy *= -1;
    }
  });

  app.stage.addChild(bitmapTextInput);
}

init();
