import { GameScene } from "../scenes";

export interface PortalProps {
  i: number;
  target: number;
}

/**
 * Map portal object.
 */
export class Portal extends Phaser.GameObjects.Sprite {
  constructor(
    scene: GameScene,
    x: number,
    y: number,
    public width: number,
    public height: number,
    public props: PortalProps
  ) {
    super(scene, x, y, null);
  }

  /**
   * Setup object physics.
   */
  setupPhysics() {
    this.scene.physics.world.enable(this);
    this.body.setSize(this.width, this.height, 0, 0);
    this.body.immovable = true;
  }
}
