import { PacmanGame } from "../../game/pacman-game";
import { SceneNames } from "./names";

/**
 * Main game state.
 */
class GameScene extends Phaser.Scene {
  pacmanGame: PacmanGame;

  controls: Phaser.Input.Keyboard.CursorKeys;
  spaceKey: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: SceneNames.GAME });
  }

  create() {
    this.setControls();
    this.pacmanGame = new PacmanGame(this, 16, false);
    this.pacmanGame.reset({ level: 1, lives: 3, score: 0 });
    this.pacmanGame.init();
  }

  update() {
    this.pacmanGame.update(this.shouldRestart, this.checkControls);
  }

  shouldRestart = () => {
    return (
      (this.spaceKey && this.spaceKey.isDown) ||
      (this.input.pointer1 && this.input.pointer1.isDown)
    );
  };

  checkControls = () => {
    const direction = this.getKeyboardDirections();
    return {
      direction
    };
  };

  private getKeyboardDirections() {
    if (this.controls.left.isDown) {
      return Phaser.LEFT;
    } else if (this.controls.right.isDown) {
      return Phaser.RIGHT;
    } else if (this.controls.up.isDown) {
      return Phaser.UP;
    } else if (this.controls.down.isDown) {
      return Phaser.DOWN;
    }
    return null;
  }

  /**
   * Set game controls.
   */
  private setControls() {
    this.spaceKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    this.controls = this.input.keyboard.createCursorKeys();
  }
}

export { GameScene };
