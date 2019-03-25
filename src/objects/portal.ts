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

    this.scene.add.existing(this);
    this.setupPhysics();
  }

  /**
   * Setup object physics.
   */
  setupPhysics() {
    this.scene.physics.world.enable(this);
    this.scene.physics.world.add(this.body);
    this.body.setSize(this.width, this.height, true);
    this.body.immovable = true;
  }
}
