// import Phaser from "phaser";
import { GameDifficulty, SFX } from "../interfaces/game";
import { GhostName } from "../interfaces/ghost";
import { difficulty } from "../config/difficulty";
import { Collectible } from "../objects/collectible";
import { Pill } from "../objects/pill";
import { Pellet } from "../objects/pellet";
import { Portal } from "../objects/portal";
import { Pacman } from "../objects/pacman";
import { Ghost } from "../objects/ghost";
import { SceneNames } from "./names";
import {
  getObjectsByType,
  getRespawnPoint,
  getTargetPoint
} from "../utils/helpers/tilemap";

/**
 * Main game state.
 */
class GameScene extends Phaser.Scene {
  map: Phaser.Tilemaps.Tilemap;
  bgLayer: Phaser.Tilemaps.StaticTilemapLayer;
  wallsLayer: Phaser.Tilemaps.StaticTilemapLayer;
  active: boolean;
  score: number;
  multi: number;
  lifes: number;
  level: number;
  difficlty: GameDifficulty;
  pellets: Phaser.GameObjects.Group;
  pills: Phaser.GameObjects.Group;
  bonuses: Phaser.GameObjects.Group;
  portals: Phaser.GameObjects.Group;
  ghosts: Phaser.GameObjects.Group;
  ghostsHome = new Phaser.Geom.Point();
  pacman: Pacman;
  blinky: Ghost;
  pinky: Ghost;
  inky: Ghost;
  clyde: Ghost;

  controls: Phaser.Input.Keyboard.CursorKeys;
  spaceKey: Phaser.Input.Keyboard.Key;

  sfx: SFX;

  tileSize: number;

  private tilesetWalls: Phaser.Tilemaps.Tileset;

  private interface: Phaser.GameObjects.Group;
  private lifesArea: Phaser.GameObjects.Sprite[] = [];
  private scoreBtm: Phaser.GameObjects.BitmapText;
  private notification: Phaser.GameObjects.BitmapText;
  private notificationIn: Phaser.Tweens.Tween;
  private notificationOut: Phaser.Tweens.Tween;

  constructor() {
    super({ key: SceneNames.GAME });

    this.tileSize = 16;

    this.onPowerModeStart = this.onPowerModeStart.bind(this);
    this.onPowerModeEnd = this.onPowerModeEnd.bind(this);
  }

  init({ level = 1, lifes = 3, score = 0 }) {
    this.level = level;
    this.lifes = lifes;
    this.score = score;
    this.difficlty = difficulty[this.level - 1];
    this.multi = this.difficlty.multiplier;
    this.active = true;
  }

  create() {
    this.setTiles();
    this.initLayers();
    this.resizeMap();
    this.enablePhysics();
    this.setControls();

    this.createPortals();
    this.createPellets();
    this.createBonuses();
    this.createPills();
    this.createGhosts();
    this.createPacman();

    this.initUI();
    this.initSfx();

    this.sfx.intro.play();
  }

  update() {
    // Check if game is active.
    if (!this.active) {
      this.ghosts.getChildren().forEach(ghost => (ghost as Ghost).stop());
      this.pacman.stop();

      // Restarts state on win/game over or Pacman death.
      if (
        (this.spaceKey && this.spaceKey.isDown) ||
        (this.input.pointer1 && this.input.pointer1.isDown)
      ) {
        // Game over.
        if (this.lifes === 0) {
          // this.scene.start("Game", true, false);
        } else if (this.level <= 3) {
          // Next level.
          // this.scene.start(
          //   "Game",
          //   true,
          //   false,
          //   this.level,
          //   this.lifes + 1,
          //   this.score
          // );
        } else {
          // this.state.start("Game", true, false); // Win.
        }
      }

      return;
    }

    // Checks collisions.
    this.physics.collide(this.pacman, this.wallsLayer, this.pacmanHitWall, null, this);
    this.physics.collide(this.ghosts, this.wallsLayer);

    // Checks overlappings.
    this.physics.overlap(this.ghosts, this.portals, this.teleport, null, this);
    this.physics.overlap(this.pacman, this.portals, this.teleport, null, this);
    this.physics.overlap(this.pacman, this.pellets, this.collect, null, this);
    this.physics.overlap(this.pacman, this.bonuses, this.bonus, null, this);
    this.physics.overlap(this.pacman, this.pills, this.powerMode, null, this);
    this.physics.overlap(this.pacman, this.ghosts, this.meetGhost, null, this);

    this.pacman.updatePosition(this.map, this.wallsLayer.layerIndex);

    // Updates objects positions.
    this.ghostsDo((ghost: Ghost) => {
      ghost.updatePosition(this.map, this.wallsLayer.layerIndex);
      ghost.updateTarget(this.pacman.marker);
    });

    // if (
    //   this.time.events.duration > 0 &&
    //   this.time.events.duration < this.difficlty.powerModeTime * 0.3
    // ) {
    //   this.ghostsDo((ghost: Ghost) => {
    //     ghost.normalSoon();
    //   });
    // }

    this.checkControls();
  }

  /**
   * Update controls handler.
   */
  checkControls() {
    this.keyboardControls();

    if (this.pacman.turning !== Phaser.NONE) {
      this.pacman.turn();
    }
  }

  /**
   * Keyboard handler.
   */
  keyboardControls() {
    if (this.controls.left.isDown) {
      this.pacman.onControls(Phaser.LEFT);
    } else if (this.controls.right.isDown) {
      this.pacman.onControls(Phaser.RIGHT);
    } else if (this.controls.up.isDown) {
      this.pacman.onControls(Phaser.UP);
    } else if (this.controls.down.isDown) {
      this.pacman.onControls(Phaser.DOWN);
    } else {
      this.pacman.turning = Phaser.NONE;
    }
  }

  /**
   * Inits map portals.
   */
  createPortals() {
    this.portals = this.add.group();
    // this.portals.enableBody = true;

    const portals = getObjectsByType("portal", this.map, "objects");

    portals.forEach(p => {
      this.portals.add(
        new Portal(this, p.x, p.y, p.width, p.height, p.properties)
      );
    });
  }

  /**
   * Inits pellets.
   */
  createPellets() {
    this.pellets = this.add.group();
    this.physics.world.enable(this.pellets);

    const pellets = getObjectsByType("pillow", this.map, "objects");

    pellets.forEach(p => {
      this.pellets.add(
        new Pellet(this, p.x, p.y)
      );
    });
  }

  /**
   * Inits pellets.
   */
  createBonuses() {
    // bonuses
    this.bonuses = this.add.group();
    this.physics.world.enable(this.bonuses);
  }

  /**
   * Inits pills.
   */
  createPills() {
    this.pills = this.add.group();
    this.physics.world.enable(this.pills);

    const pills = getObjectsByType("pill", this.map, "objects");

    pills.forEach(p => {
      this.pills.add(new Pill(this, p.x, p.y));
    });
  }

  /**
   * Inits Ghosts.
   */
  createGhosts() {
    this.ghosts = this.add.group();
    // this.ghosts.enableBody = true;
    this.ghostsHome = getRespawnPoint("blinky", this.map);

    this.addGostByName("blinky");
    this.addGostByName("inky");
    this.addGostByName("pinky");
    this.addGostByName("clyde");
  }

  /**
   * Inits Pacman.
   */
  createPacman() {
    const respawn = getRespawnPoint("pacman", this.map);
    this.pacman = new Pacman(
      this,
      respawn.x,
      respawn.y,
      this.tileSize,
      this.difficlty.pacmanSpeed
    );
    this.pacman.afterStart(() => this.afterPacmanRun());
  }

  /**
   * Pacman start hook.
   */
  afterPacmanRun() {
    this.sfx.intro.stop();
    this.blinky.onStart();
    this.pinky.escapeFromHome(8000);
    this.inky.escapeFromHome(10000);
    this.clyde.escapeFromHome(12000);
  }

  pacmanHitWall() {
    this.pacman.stopMoving();
  }

  /**
   * Portals handler.
   * @param unit - ghost or pacman to teleport.
   * @param portal - portal object.
   */
  teleport(unit: Pacman | Ghost, portal: Portal) {
    const { x, y, width, height } = this.portals.getChildren().filter(
      (p: Portal) => p.props.i === portal.props.target
    )[0] as Portal;
    unit.teleport(portal.x, portal.y, x, y, width, height);
  }

  /**
   * Munch handler.
   * @param pacman - pacman object.
   * @param item - pill or pellet to collect.
   */
  collect(pacman: Pacman, item: Collectible) {
    const points =
      {
        pellet: 10,
        pill: 50
      }[item.key] || 0;

    if (points) {
      item.destroy();
      this.updateScore(points);
    }

    // All items eaten by Pacman.
    if (!this.pellets.countActive()) {
      pacman.sfx.munch.stop();
      const nextLevel = this.level < 3;
      const text = nextLevel
        ? `level ${this.level} completed`
        : "game completed";
      this.level++;
      this.active = false;
      this.ghostsDo((ghost: Ghost) => ghost.stop());

      if (!nextLevel) {
        this.sfx.win.play();
      }

      this.showNotification(text);
    } else {
      // Bonuses initialization.
      const eaten = `${this.pellets.getChildren().length -
        this.pellets.countActive()}`;

      const bonusName = {
        "60": "cherry",
        "120": "strawberry",
        "150": "apple"
      }[eaten];

      if (bonusName) {
        this.placeBonus(bonusName);
      }
    }
  }

  /**
   * Bonus eat handler.
   * @param pacman - pacman object.
   * @param bonus - friut.
   */
  bonus(pacman: Pacman, bonus) {
    const amount =
      {
        cherry: 2,
        strawberry: 3,
        apple: 4
      }[bonus.key] || 1;

    bonus.destroy();
    this.sfx.fruit.play();

    this.multi = this.multi * amount;

    this.time.addEvent({
      delay: 3000,
      callbackScope: this,
      callback: () => {
        this.multi = this.difficlty.multiplier;
      }
    });
  }

  /**
   * Pill eat handler.
   * @param pacman - pacman object.
   * @param pill - power pill.
   */
  powerMode(pacman: Pacman, pill: Pill) {
    this.collect(pacman, pill);

    pacman.enablePowerMode(
      this.difficlty.powerModeTime,
      this.onPowerModeStart,
      this.onPowerModeEnd
    );
  }

  /**
   * Pacman power mode start hook.
   */
  onPowerModeStart() {
    this.sfx.intermission.play();
    this.ghostsDo((ghost: Ghost) => ghost.enableSensetiveMode());
  }

  /**
   * Pacman power mode end hook.
   */
  onPowerModeEnd() {
    this.sfx.intermission.stop();
    this.sfx.regenerate.play();
    this.ghostsDo((ghost: Ghost) => ghost.disableSensetiveMode());
  }

  /**
   * Ghost overlap handler.
   * @param pacman - pacman object.
   * @param ghost - ghost object.
   */
  meetGhost(pacman: Pacman, ghost: Ghost) {
    // Prevent multiple overlaps.
    if (!pacman.alive || !ghost.alive) {
      return;
    }

    // Pacman powerfull.
    if (ghost.mode === "frightened" && pacman.mode === "power") {
      ghost.die();
      this.updateScore(200);
    } else {
      // Ghost eats Pacman.
      this.ghostsDo((ghost: Ghost) => ghost.stop());
      this.updateLifes(-1);

      // Game over.
      if (this.lifes === 0) {
        pacman.sfx.munch.stop();
        this.sfx.over.play();
        this.active = false;
        this.showNotification("game over");
      } else {
        // Minus 1 Pacman life.
        pacman.die();
        this.ghostsDo((ghost: Ghost) => ghost.respawn());
      }
    }
  }

  /**
   * Creates map.
   */
  private setTiles() {
    this.map = this.add.tilemap("level");
    this.tilesetWalls = this.map.addTilesetImage("walls", "walls");
    this.map.setCollisionBetween(1, 33, true, true, "walls");
  }

  /**
   * Gets random pellet position on map.
   */
  private getRandomPelletPosition(): Phaser.Geom.Point {
    const pellets: Phaser.GameObjects.GameObject[] = this.pellets.getChildren();
    const randomPellet = pellets[
      Phaser.Math.Between(0, pellets.length - 1)
    ] as Phaser.GameObjects.Sprite;
    const { x, y } = randomPellet;

    return { x, y } as Phaser.Geom.Point;
  }

  /**
   * Puts fruit on map.
   * @param name - fruit name.
   */
  private placeBonus(name: "string") {
    const rndPoint = this.getRandomPelletPosition();
    // this.add.sprite(rndPoint.x, rndPoint.y, name, 0, this.bonuses);
  }

  /**
   * Creates layers.
   */
  private initLayers() {
    // this.bgLayer = this.map.createStaticLayer("background");
    this.wallsLayer = this.map.createStaticLayer("walls", this.tilesetWalls);
  }

  /**
   * Resises map.
   */
  private resizeMap() {
    // this.bgLayer.resizeWorld();
  }

  /**
   * Enables physics.
   */
  private enablePhysics() {
    this.physics.resume();
  }

  /**
   * Creates user interface.
   */
  private initUI() {
    this.interface = this.add.group();

    const text = this.score === 0 ? "00" : `${this.score}`;
    //this.world.centerX
    this.scoreBtm = new Phaser.GameObjects.BitmapText(
      this,
      200,
      100,
      "kong",
      text,
      16
    );
    // this.world.centerX, this.world.centerY + 48
    this.notification = new Phaser.GameObjects.BitmapText(
      this,
      400,
      448,
      "kong",
      "",
      16
    );
    this.notification.alpha = 0;
    this.notificationIn = this.add
      .tween({
        targets: [this.notification],
        ease: "Linear",
        duration: 300,
        delay: 0,
        alpha: 0
      })
      .stop();
    this.notificationOut = this.add
      .tween({
        targets: [this.notification],
        ease: "Linear",
        duration: 300,
        delay: 0,
        alpha: 0
      })
      .stop();

    this.interface.add(this.scoreBtm);
    this.interface.add(this.notification);
    this.updateLifes(0);
  }

  /**
   * Updates player scores.
   * @param points - points to add.
   */
  private updateScore(points: number) {
    this.score += points * this.multi;
    this.scoreBtm.setText(`${this.score}`);
  }

  /**
   * Updates player lifes.
   * @param amount - number of lifes.
   */
  private updateLifes(amount: number) {
    this.lifes += amount;

    // Create if no in UI.
    if (this.lifesArea.length && this.lifesArea.length > this.lifes) {
      const life = this.lifesArea.pop();
      const lifeTween = this.add.tween({
        targets: [life],
        ease: "Linear",
        duration: 300,
        delay: 0,
        alpha: {
          getEnd: () => 0
        },
        onComplete: () => life.destroy()
      });
    } else {
      // Update UI.
      let sprite: Phaser.GameObjects.Sprite;
      let prevSprite: Phaser.GameObjects.Sprite;

      // for (let i = 0; i < this.lifes; i++) {
      //   if (prevSprite) {
      //     sprite = this.add
      //       .sprite(0, 0, "pacman", 1)
      //       .alignTo(prevSprite, Phaser.RIGHT_CENTER, 8, 0);
      //   } else {
      //     sprite = this.add.sprite(8, this.world.bottom - 24, "pacman", 1);
      //   }

      //   this.lifesArea.push(sprite);
      //   prevSprite = sprite;
      // }
    }
  }

  /**
   * Shows game notification.
   * @param text - notification text.
   */
  private showNotification(text: string) {
    this.notification.text = text.toUpperCase();
    this.notificationIn.restart();
  }

  /**
   * Hides game notification.
   */
  private hideNotification() {
    this.notification.text = "";
    this.notificationOut.restart();
  }

  /**
   * Inits music & sounds.
   */
  private initSfx() {
    this.sfx = {
      intro: this.sound.add("intro"),
      over: this.sound.add("over"),
      win: this.sound.add("win"),
      fruit: this.sound.add("fruit"),
      intermission: this.sound.add("intermission"),
      regenerate: this.sound.add("regenerate")
    };
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

  /**
   * Creates new ghost object by name.
   * @param name - ghost name.
   */
  private addGostByName(name: GhostName) {
    const respawn = getRespawnPoint(name, this.map);
    const target = getTargetPoint(name, this.map);

    this[name] = new Ghost(
      this,
      respawn.x,
      respawn.y,
      name,
      2,
      this.tileSize,
      this.difficlty.ghostSpeed,
      target,
      this.ghostsHome,
      this.difficlty.wavesDurations
    );
    this.ghosts.add(this[name]);
  }

  private ghostsDo(callback: Function) {
    this.ghosts.getChildren().forEach(ghost => callback(ghost as Ghost));
  }
}

export { GameScene };
