import { GameScene } from "../scenes";
import { Collectible } from "./collectible";

/**
 * Pellet object.
 */
export class Pellet extends Collectible {

  constructor(scene: GameScene, x: number, y: number) {
    const offset = scene.tileSize / 2;
    super(scene, x + offset, y - offset, "pellet", "pellet");
  }

}
