import { Application, Assets } from "pixi.js";
import { BitmapTextInput } from "../src/index";

async function init() {
  await Assets.load("./fonts/Foxley816/bitmap/Foxley816.fnt");

  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);

  const app = new Application();
  await app.init({
    backgroundColor: "#02040a",
    antialias: true,
    resolution: 1,
    canvas,
  });

  const bitmapTextInput = new BitmapTextInput(
    {
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed a magna nec ante rutrum varius. Pellentesque congue finibus nibh sed tincidunt.",
      style: {
        fontFamily: "Foxley816",
        fontSize: 16,
        wordWrap: true,
        wordWrapWidth: 300,
      },
      domNodeOffset: { x: -1, y: 2 },
    },
    canvas
  );
  bitmapTextInput.domNode.style.fontFamily = "'Foxley 816'";
  bitmapTextInput.domNode.style.color = "white";

  // DVD screensaver effect
  let deltaX = 1;
  let deltaY = 1;
  app.ticker.add(() => {
    bitmapTextInput.x += deltaX;
    bitmapTextInput.y += deltaY;

    if (
      bitmapTextInput.x < 0 ||
      bitmapTextInput.x > app.screen.width - bitmapTextInput.width
    ) {
      deltaX *= -1;
    }

    if (
      bitmapTextInput.y < 0 ||
      bitmapTextInput.y > app.screen.height - bitmapTextInput.height
    ) {
      deltaY *= -1;
    }
  });

  app.stage.addChild(bitmapTextInput);
}

init();
