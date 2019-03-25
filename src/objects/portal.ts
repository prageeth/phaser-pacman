export interface PortalProps {
  i: number;
  target: number;
}

/**
 * Map portal object.
 */
export class Portal extends Phaser.GameObjects.Sprite {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    tileSize: number,
    public width: number,
    public height: number,
    public props: PortalProps
  ) {
    super(scene, x - tileSize, y, null);

    this.setOrigin(0, 0.5);

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
