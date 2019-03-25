import { Collectible } from "./collectible";

/**
 * Pill object.
 */
export class Pill extends Collectible {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "pill", "pill");
  }
}
