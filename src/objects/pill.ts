import { GameScene } from "../scenes";

/**
 * Pellet object.
 */
export class Pill extends Phaser.GameObjects.Sprite {
  constructor(scene: GameScene, x: number, y: number) {
    const offset = 0; //scene.tileSize / 2;

    super(scene, x - offset, y - offset, "pill");
  }

  /**
   * Setup object physics.
   */
  setupPhysics() {
    // this.physics.enable(this);
    this.body.setSize(16, 16, 0, 0);
    this.body.immovable = true;
    // this.anchor.set(0.5);
  }
}
