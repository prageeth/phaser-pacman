import "phaser";

import GameScalePlugin from "phaser-plugin-game-scale";
import { PacmanGame } from "./pacman-game";

const config = {
  title: "PacMan",
  type: Phaser.AUTO,
  parent: "phaser-game",
  antialias: false, // for pixelated graphics
  width: 800,
  height: 600,
  scene: {},
  physics: {
    default: "arcade",
    arcade: {
      debug: true,
      gravity: 0
    }
  },
  // scale: {
  //   mode: Phaser.Scale.FIT,
  //   autoCenter: Phaser.Scale.CENTER_BOTH
  // },
  plugins: {
    global: [
      {
        key: "GameScalePlugin",
        plugin: GameScalePlugin,
        mapping: "gameScale",
        data: {
          minWidth: 400,
          minHeight: 300,
          maxWidth: 1600,
          maxHeight: 1200,
          snap: 0
        }
      }
    ]
  }
};

/**
 * Initialize game on page load.
 */
window.onload = () => {
  new PacmanGame(config);
};
