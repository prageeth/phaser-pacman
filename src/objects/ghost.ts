import { GameScene } from "../scenes";
import { Wave, SFX } from "../interfaces/game";
import { TurningObject } from "./turning";
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
  private timer: Phaser.Time.Clock = this.scene.time;

  constructor(
    scene: GameScene,
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
    this.play("walk");
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
    this.play("bored");
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

    this.play("walk");
    this.restoreSpeed();
    // this.timer.resume();
    this.onModeSwitch();
  }

  /**
   * Changes sensetive animation.
   */
  normalSoon() {
    if (this.mode === "frightened") {
      this.play("prenormal");
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
    this.initTimer();
    this.inGame = true;
    this.enableScatterMode();
    this.move(Phaser.LEFT);
  }

  /**
   * Move ghost out of house.
   * @param delay - milliseconds.
   */
  escapeFromHome(delay: number) {
    const fadeOut = this.scene.add.tween({
      targets: [this],
      ease: "Linear",
      duration: 300,
      delay: delay,
      alpha: 0
    });
    const fadeIn = this.scene.add
      .tween({
        targets: [this],
        ease: "Linear",
        duration: 300,
        delay: delay,
        alpha: 0
      })
      .stop();
    // fadeOut.onComplete.addOnce(() => {
    //   this.reset(this.home.x, this.home.y);
    //   fadeIn.start();
    // });
    // fadeIn.onComplete.addOnce(() => {
    //   this.onStart();
    //   this.sfx.regenerate.play();
    // });
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
    // const sorted = posibilities.slice().sort((a: number, b: number) => {
    //   return (
    //     Phaser.Math.Distance.Between(this.directions[a], this.target) -
    //     Phaser.Geom.Point.distance(this.directions[b], this.target)
    //   );
    // });

    // // Random choose mode.
    // if (this.mode === "frightened") {
    //   return sorted[this.game.rnd.integerInRange(0, sorted.length - 1)];
    // }

    // Closests to target.
    // return sorted.shift();
    return 1;
  }

  /**
   * Inits object animations.
   */
  private setAnimations() {
    if (!this.scene.anims.get("walk")) {
      this.scene.anims.create({
        key: "walk",
        frames: this.scene.anims.generateFrameNumbers(this.name, {
          start: 0,
          end: 7
        }),
        frameRate: 4,
        repeat: -1
      });
    }
    if (!this.scene.anims.get("bored")) {
      this.scene.anims.create({
        key: "bored",
        frames: this.scene.anims.generateFrameNumbers(this.name, {
          start: 8,
          end: 9
        }),
        frameRate: 4,
        repeat: -1
      });
    }
    if (!this.scene.anims.get("prenormal")) {
      this.scene.anims.create({
        key: "prenormal",
        frames: this.scene.anims.generateFrameNumbers(this.name, {
          start: 8,
          end: 11
        }),
        frameRate: 4,
        repeat: -1
      });
    }
    if (!this.scene.anims.get("dead")) {
      this.scene.anims.create({
        key: "dead",
        frames: this.scene.anims.generateFrameNumbers(this.name, {
          start: 12,
          end: 15
        }),
        frameRate: 4,
        repeat: -1
      });
    }
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
   * Setup new mode timer.
   */
  private initTimer() {
    // this.timer.destroy();
    // this.timer = this.game.time.create(false);
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
    this.play("walk");

    const duration = this.getWaveDuration();

    // if (duration) {
    //   this.timer.add(duration, () => {
    //     this.enableChaseMode();
    //     this.onModeSwitch();
    //   });

    //   this.timer.start();
    // }
  }

  /**
   * Enables chase mode.
   */
  private enableChaseMode() {
    if (!this.inGame) {
      return;
    }

    this.mode = "chase";
    this.play("walk");

    const duration = this.getWaveDuration();

    if (duration) {
      this.waveCount++;

      // this.timer.add(duration, () => {
      //   this.enableScatterMode();
      //   this.onModeSwitch();
      // });
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
    this.play("dead");
    this.updateSpeed(this.speed * 0.2);
    this.target = Object.assign({}, this.homeMarker);
    this.onModeSwitch();
  }

  /**
   * Enables normal mode.
   */
  private disableDeadMode() {
    this.mode = this.recoverMode;

    this.play("walk");
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
}
