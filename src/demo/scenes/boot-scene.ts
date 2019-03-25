import { SceneNames } from "./names";

/**
 * Boot state to set basic game options.
 */
class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneNames.BOOT });
  }

  preload() {
    this.load.image("logo", "../assets/images/logo.png");
  }

  create() {
    this.setScale();

    // Phaser.Canvas.setImageRenderingCrisp(this.canvas);

    this.scene.start(SceneNames.PRELOAD);
  }

  /**
   * Setup propper game scaling.
   */
  private setScale() {
    // this.scale.autoCenter = true;
    // this.scale.pageAlignVertically = true;
    // this.scale.forcePortrait = true;
    // this.scale.aspectRatio = 1.28;
    // this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
  }
}

export { BootScene };
