import { SceneNames, BootScene, PreloadScene, GameScene } from "./scenes";

class PacmanGame extends Phaser.Game {
  tileSize = 16;

  constructor(config: GameConfig) {
    super(config);

    this.initScenes();

    this.scene.start(SceneNames.BOOT);
  }

  /**
   * Creates all game states.
   */
  private initScenes() {
    this.scene.add("Boot", BootScene);
    this.scene.add("Preload", PreloadScene);
    this.scene.add("Game", GameScene);
  }
}

export { PacmanGame };
