import { GameScene } from "../scenes";
import { PacmanMode } from "../interfaces/pacman";
import { SFX } from "../interfaces/game";
import { TurningObject } from "./turning";

/**
 * Pacman hero.
 */
export class Pacman extends TurningObject {
  mode: PacmanMode;
  sfx: SFX;

  private started = false;
  private powerTimer: Phaser.Time.TimerEvent;
  private afterStartFn: Function;

  constructor(
    scene: GameScene,
    x: number,
    y: number,
    tileSize: number,
    speed: number
  ) {
    super(scene, x, y, "pacman", 0, tileSize, speed, 16);

    this.setAnimations();
    this.setSFX();
  }

  /**
   * Sets move start hook.
   * @param callback - hook to invoke.
   */
  afterStart(callback: Function) {
    this.afterStartFn = callback;
  }

  /**
   * Move on controls.
   * @param direction - movement direction.
   */
  onControls(direction: number) {
    if (direction !== this.current && this.alive) {
      this.checkDirection(direction);
    }

    if (!this.started && this.turning === direction) {
      this.disablePowerMode();
      this.move(direction);
      // this.sfx.munch.play(undefined, undefined, undefined, true);
      this.started = true;
      this.afterStartFn();
    }
  }

  /**
   * Enables power mode.
   * @param time - milliseconds.
   * @param onStart - mode start hook.
   * @param onEnd - mode end hook.
   */
  enablePowerMode(time: number, onStart: Function, onEnd: Function) {
    if (this.mode === "power") {
      // If already in power mode increase time.
      time += this.powerTimer.elapsed;
      this.powerTimer.destroy();
    } else {
      this.mode = "power";
    }

    onStart();

    this.powerTimer = this.scene.time.delayedCall(
      time,
      (onEnd: Function) => {
        this.disablePowerMode();
        onEnd && onEnd();
      },
      [onEnd],
      this
    );
  }

  /**
   * Disables power mode.
   */
  disablePowerMode() {
    this.mode = "normal";
  }

  /**
   * Moves object.
   * @param direction - movement direction.
   */
  move(direction: number) {
    super.move(direction);

    this.play("munch");

    this.scaleX = this.scaleSize;
    this.angle = 0;

    if (direction === Phaser.LEFT) {
      this.scaleX = -this.scaleSize;
    } else if (direction === Phaser.UP) {
      this.angle = 270;
    } else if (direction === Phaser.DOWN) {
      this.angle = 90;
    }
  }

  stopMoving() {
    this.play("resting");
  }

  /**
   * Pacman death.
   */
  die() {
    super.die();

    this.stop();
    this.scaleX = this.scaleSize;
    this.angle = 0;
    this.sfx.munch.stop();
    this.play("die");
    this.sfx.death.play();
  }

  /**
   * Pacman resurection.
   */
  respawn() {
    super.respawn();
    this.play("resting");
    this.started = false;
  }

  /**
   * Inits object animations.
   */
  private setAnimations() {
    if (!this.scene.anims.get("resting")) {
      this.scene.anims.create({
        key: "resting",
        frames: [{key: "pacman", frame: 1}],
        frameRate: 15,
        repeat: -1
      });
    }
    if (!this.scene.anims.get("munch")) {
      this.scene.anims.create({
        key: "munch",
        frames: [
          ...this.scene.anims.generateFrameNumbers("pacman", {
            start: 0,
            end: 2
          }),
          ...this.scene.anims.generateFrameNumbers("pacman", {
            start: 1,
            end: 0
          })
        ],
        frameRate: 15,
        repeat: -1
      });
    }
    if (!this.scene.anims.get("die")) {
      this.scene.anims.create({
        key: "die",
        frames: this.scene.anims.generateFrameNumbers("pacman", {
          start: 2,
          end: 13
        }),
        frameRate: 10,
        repeat: 0
      });
      this.on(
        "animationcomplete",
        (animation, frame) => {
          if (animation.key === "die") {
            this.visible = false;
            this.frame = animation.frames[0];
            this.respawn();
          }
        },
        this
      );
    }
  }

  /**
   * Setup object sounds.
   */
  private setSFX() {
    this.sfx = {
      munch: this.scene.sound.add("munch"),
      death: this.scene.sound.add("death")
    };
  }
}
