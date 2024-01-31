import * as PIXI from "pixi.js";

export class BitmapTextInput extends PIXI.Container {
  constructor() {
    super();

    this.on("added", () => {
      console.log("BitmapTextInput added to stage.");
    });

    this.on("removed", () => {
      console.log("BitmapTextInput removed from stage.");
    });
  }
}
