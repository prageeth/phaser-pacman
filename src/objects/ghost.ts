import { TurningObject } from "./turning";
import { Wave, SFX } from "../interfaces/game";
import { GhostMode } from "../interfaces/ghost";

/**
 * Ghosts object boilerplate.
 */
export class Ghost extends TurningObject {
  mode: GhostMode;
  sfx: SFX;
  inGame = false;
  name: string;

  private target = new Phaser.Geom.Point();
  private scatterTarget = new Phaser.Geom.Point();
  private prevMarker = new Phaser.Geom.Point();
  private homeMarker = new Phaser.Geom.Point();
  private recoverMode: GhostMode;
  private waveCount = 0;
  private escapeTimer: Phaser.Time.TimerEvent;
  private timer: Phaser.Time.TimerEvent;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    key: string,
    frame: number,
    tileSize: number,
    speed: number,
    target: Phaser.Geom.Point,
    public home: Phaser.Geom.Point,
    public wavesDurations: Wave[]
  ) {
    super(scene, x, y, key, frame, tileSize, speed);

    this.name = key;
    this.scatterTarget = target;
    this.homeMarker.x = Math.floor(home.x / this.tileSize);
    this.homeMarker.y = Math.floor(home.y / this.tileSize);

    this.setAnimations();
    this.setSFX();
  }

  /**
   * Updates object position.
   * @param map - game map.
   * @param index - layer index.
   */
  updatePosition(map: Phaser.Tilemaps.Tilemap, index: number) {
    // Prevent updates if inactive.
    if (!this.inGame && this.mode !== "dead") {
      return;
    }

    super.updatePosition(map, index);

    // Checks if new grid position.
    if (!Phaser.Geom.Point.Equals(this.prevMarker, this.marker)) {
      const posibilities = this.getPosibleDirections();

      // Make move decision.
      if (posibilities.length > 1) {
        const choice = this.chooseDirection(posibilities);

        this.checkDirection(choice);
      } else {
        this.move(posibilities[0]);
      }

      this.prevMarker = Object.assign({}, this.marker);
    }

    // If resurect point.
    if (
      this.mode === "dead" &&
      Phaser.Geom.Point.Equals(this.homeMarker, this.marker)
    ) {
      this.disableDeadMode();
    }

    // Prevent to stop.
    if (this.body.velocity.x === 0 && this.body.velocity.y === 0) {
      this.move(this.current);
    }

    if (this.turning !== Phaser.NONE) {
      this.turn();
    }
  }

  /**
   * Respawns ghost.
   */
  respawn() {
    super.respawn();

    this.mode = "scatter";
    this.restoreSpeed();
    this.inGame = false;
    this.playAnimation("walk");
    this.anims.stop();
    // this.anims.stop("walk", true);
    // this.timer.pause();
  }

  /**
   * Ghost death.
   */
  die() {
    super.die();

    this.sfx.death.play();
    this.enableDeadMode();
  }

  /**
   * Enables sensitive mode.
   */
  enableSensetiveMode() {
    if (!this.inGame) {
      return;
    }

    if (this.mode !== "frightened") {
      this.recoverMode = this.mode;
    }

    this.mode = "frightened";
    this.playAnimation("bored");
    this.updateSpeed(this.speed * 0.5);
    // this.timer.pause();
    this.onModeSwitch();
  }

  /**
   * Disables sensitive mode.
   */
  disableSensetiveMode() {
    if (!this.inGame) {
      return;
    }

    this.mode = this.recoverMode;

    this.playAnimation("walk");
    this.restoreSpeed();
    // this.timer.resume();
    this.onModeSwitch();
  }

  /**
   * Changes sensetive animation.
   */
  normalSoon() {
    if (this.mode === "frightened") {
      this.playAnimation("prenormal");
    }
  }

  /**
   * Updates target to follow.
   * @param target - current target object.
   */
  updateTarget(target: Phaser.Geom.Point) {
    if (!this.inGame) {
      return;
    }

    if (this.mode === "frightened" || this.mode === "chase") {
      this.target = target;
    }
  }

  /**
   * Ghost game start hook.
   */
  onStart() {
    this.inGame = true;
    this.enableScatterMode();
    this.move(Phaser.LEFT);
  }

  /**
   * Move ghost out of house.
   * @param delay - milliseconds.
   */
  escapeFromHome(delay: number) {
    const fadeIn = this.scene.add.tween({
      targets: [this],
      ease: "Linear",
      duration: 300,
      alpha: 1,
      paused: true,
      onComplete: () => {
        this.onStart();
        this.sfx.regenerate.play();
      }
    });

    const fadeOut = this.scene.add.tween({
      targets: [this],
      ease: "Linear",
      duration: 300,
      alpha: 0,
      paused: true,
      onComplete: () => {
        this.reset(this.home.x, this.home.y);
        fadeIn.play(false);
      }
    });

    this.escapeTimer && this.escapeTimer.destroy();
    this.escapeTimer = this.scene.time.delayedCall(
      delay,
      () => {
        fadeOut.play(false);
      },
      [],
      this
    );
  }

  /**
   * Gets all possible direction.
   */
  private getPosibleDirections() {
    return this.directions.reduce((indexes, point, i) => {
      if (point && point.index === -1 && i !== this.opposites[this.current]) {
        indexes.push(i);
      }
      return indexes;
    }, []);
  }

  /**
   * Make mode decision.
   * @param posibilities - possible directions.
   */
  private chooseDirection(posibilities: number[]): number {
    const sorted = posibilities.slice().sort((a: number, b: number) => {
      const tileA = this.directions[a];
      const tileB = this.directions[b];
      return (
        Phaser.Math.Distance.Between(
          tileA.x,
          tileA.y,
          this.target.x,
          this.target.y
        ) -
        Phaser.Math.Distance.Between(
          tileB.x,
          tileB.y,
          this.target.x,
          this.target.y
        )
      );
    });

    // Random choose mode.
    if (this.mode === "frightened") {
      return sorted[Phaser.Math.Between(0, sorted.length - 1)];
    }

    // Closests to target.
    return sorted.shift();
  }

  /**
   * Inits object animations.
   */
  private setAnimations() {
    this.loadAnimation("walk", {
      frames: this.scene.anims.generateFrameNumbers(this.name, {
        start: 0,
        end: 7
      })
    });
    this.loadAnimation("bored", {
      frames: this.scene.anims.generateFrameNumbers(this.name, {
        start: 8,
        end: 9
      })
    });
    this.loadAnimation("prenormal", {
      frames: this.scene.anims.generateFrameNumbers(this.name, {
        start: 8,
        end: 11
      })
    });
    this.loadAnimation("dead", {
      frames: this.scene.anims.generateFrameNumbers(this.name, {
        start: 8,
        end: 11
      })
    });
  }

  /**
   * Inits objects sounds.
   */
  private setSFX() {
    this.sfx = {
      death: this.scene.sound.add("ghost"),
      regenerate: this.scene.sound.add("regenerate")
    };
  }

  /**
   * Gets mode duration.
   */
  private getWaveDuration(): number {
    return this.wavesDurations.length
      ? this.wavesDurations[this.waveCount][this.mode]
      : 0;
  }

  /**
   * Enables scatter mode.
   */
  private enableScatterMode() {
    if (!this.inGame) {
      return;
    }

    this.target = Object.assign({}, this.scatterTarget);
    this.mode = "scatter";
    this.playAnimation("walk");

    const duration = this.getWaveDuration();

    if (duration) {
      this.timer && this.timer.destroy();
      this.timer = this.scene.time.delayedCall(
        duration,
        () => {
          this.enableChaseMode();
          this.onModeSwitch();
        },
        [],
        this
      );
    }
  }

  /**
   * Enables chase mode.
   */
  private enableChaseMode() {
    if (!this.inGame) {
      return;
    }

    this.mode = "chase";
    this.playAnimation("walk");

    const duration = this.getWaveDuration();

    if (duration) {
      this.waveCount++;

      this.timer && this.timer.destroy();
      this.timer = this.scene.time.delayedCall(
        duration,
        () => {
          this.enableScatterMode();
          this.onModeSwitch();
        },
        [],
        this
      );
    }
  }

  /**
   * Enables dead mode.
   */
  private enableDeadMode() {
    if (this.mode !== "frightened") {
      return;
    }

    this.mode = "dead";

    this.inGame = false;
    this.playAnimation("dead");
    this.updateSpeed(this.speed * 0.2);
    this.target = Object.assign({}, this.homeMarker);
    this.onModeSwitch();
  }

  /**
   * Enables normal mode.
   */
  private disableDeadMode() {
    this.mode = this.recoverMode;

    this.playAnimation("walk");
    this.sfx.regenerate.play();
    this.alive = true;
    this.inGame = true;
    this.restoreSpeed();
    // this.timer.resume();
    this.move(Phaser.LEFT);
  }

  /**
   * Force move direction switch.
   */
  private onModeSwitch() {
    this.checkDirection(this.opposites[this.current]);
  }

  protected buildAnimationKey(key: string) {
    return `ghost-${this.name}-${key}`;
  }
}
