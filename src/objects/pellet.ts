import { Collectible } from "./collectible";

/**
 * Pellet object.
 */
export class Pellet extends Collectible {
  constructor(scene: Phaser.Scene, x: number, y: number, tileSize: number) {
    const offset = tileSize / 2;
    super(scene, x + offset, y - offset, "pellet", "pellet");
  }
}
