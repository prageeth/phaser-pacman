import { GameScene } from "../scenes";

/**
 * Collectible object.
 */
export abstract class Collectible extends Phaser.GameObjects.Sprite {
  key: string;

  constructor(scene: GameScene, x: number, y: number, texture: string, key: string) {
    super(scene, x, y, texture);

    this.key = key;
    this.setOrigin(0.5, 0.5);

    this.scene.add.existing(this);
    this.setupPhysics();
  }

  /**
   * Setup object physics.
   */
  setupPhysics() {
    this.scene.physics.world.enable(this);
    this.scene.physics.world.add(this.body);
    this.body.setSize(16, 16, true);
    this.body.immovable = true;
  }
}
