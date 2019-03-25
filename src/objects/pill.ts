import { GameScene } from "../scenes";
import { Collectible } from "./collectible";

/**
 * Pill object.
 */
export class Pill extends Collectible {

  constructor(scene: GameScene, x: number, y: number) {
    super(scene, x, y, "pill", "pill");
  }

}
