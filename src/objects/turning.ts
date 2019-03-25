import { GameScene } from "../scenes";

/**
 * Tuning objects base class.
 */
export abstract class TurningObject extends Phaser.GameObjects.Sprite {
  /**
   * Shout it turn.
   */
  turning = Phaser.NONE;

  /**
   * Current move di/rection.
   */
  current = Phaser.NONE;

  /**
   * Position on map grid.
   */
  marker = new Phaser.Geom.Point();

  /**
   * Sprite scale number.
   */
  scaleSize = 1;

  /**
   * Current surrounding map.
   */
  directions = [];

  /**
   * Opposite direction map.
   */
  opposites = {
    [Phaser.LEFT]: Phaser.RIGHT,
    [Phaser.RIGHT]: Phaser.LEFT,
    [Phaser.DOWN]: Phaser.UP,
    [Phaser.UP]: Phaser.DOWN
  };

  alive = true;

  extraPush: number = 10;

  /**
   * Currect object speed.
   */
  private currentSpeed: number;

  /**
   * Resurrection point.
   */
  private respawnPoint = new Phaser.Geom.Point();

  /**
   * Turn point on map grid.
   */
  private turnPoint = new Phaser.Geom.Point();

  constructor(
    scene: GameScene,
    x: number,
    y: number,
    key: string,
    frame: number,
    public tileSize: number,
    public speed: number,
    private threshold = 4
  ) {
    super(scene, x, y, key, frame);

    this.respawnPoint.x = x;
    this.respawnPoint.y = y;
    this.currentSpeed = speed;

    this.scene.add.existing(this);
    this.setupPhysics();
  }

  /**
   * Updates object position.
   * @param map - game map.
   * @param index - layer index.
   */
  updatePosition(map: Phaser.Tilemaps.Tilemap, index: number) {
    this.setMarker();
    this.updateSensor(map, index);
  }

  /**
   * Updates map grid position.
   */
  setMarker() {
    this.marker.x =
      Phaser.Math.Snap.Floor(Math.floor(this.x), this.tileSize) / this.tileSize;
    this.marker.y =
      Phaser.Math.Snap.Floor(Math.floor(this.y), this.tileSize) / this.tileSize;
  }

  /**
   * Updates object surroundings.
   * @param map - game map.
   * @param index - layer index.
   */
  updateSensor(map: Phaser.Tilemaps.Tilemap, index: number) {
    this.directions[Phaser.LEFT] = map.getTileAt(
      this.marker.x - 1,
      this.marker.y,
      false,
      index
    );
    this.directions[Phaser.RIGHT] = map.getTileAt(
      this.marker.x + 1,
      this.marker.y,
      false,
      index
    );
    this.directions[Phaser.UP] = map.getTileAt(
      this.marker.x,
      this.marker.y - 1,
      false,
      index
    );
    this.directions[Phaser.DOWN] = map.getTileAt(
      this.marker.x,
      this.marker.y + 1,
      false,
      index
    );
  }

  /**
   * Checks move possibility.
   * @param turnTo - movement direction.
   */
  checkDirection(turnTo: number) {
    if (this.turning === turnTo || this.directions[turnTo]) {
      return;
    }

    if (this.current === this.opposites[`${turnTo}`]) {
      this.move(turnTo);
    } else {
      this.turning = turnTo;

      // Adjust point to map grid.
      this.turnPoint.x = this.marker.x * this.tileSize + this.tileSize / 2;
      this.turnPoint.y = this.marker.y * this.tileSize + this.tileSize / 2;
    }
  }

  /**
   * Moves object.
   * @param direction - movement direction.
   */
  move(direction: number) {
    let speed = this.currentSpeed;

    if (direction === Phaser.LEFT || direction === Phaser.UP) {
      speed = -speed;
    }

    if (direction === Phaser.LEFT || direction === Phaser.RIGHT) {
      this.body.velocity.x = speed;
    } else {
      this.body.velocity.y = speed;
    }

    this.current = direction;
  }

  /**
   * Turns object.
   */
  turn(): boolean {
    const cx = Math.floor(this.x);
    const cy = Math.floor(this.y);

    if (
      !Phaser.Math.Fuzzy.Equal(cx, this.turnPoint.x, this.threshold) ||
      !Phaser.Math.Fuzzy.Equal(cy, this.turnPoint.y, this.threshold)
    ) {
      return false;
    }

    this.x = this.turnPoint.x;
    this.y = this.turnPoint.y;

    this.body.reset(this.turnPoint.x, this.turnPoint.y);

    this.move(this.turning);
    this.turning = Phaser.NONE;

    return true;
  }

  /**
   * Stops object.
   */
  stop() {
    this.body.velocity.x = 0;
    this.body.velocity.y = 0;
    this.current = Phaser.NONE;
    this.turning = Phaser.NONE;
  }

  /**
   * Make object dead.
   */
  die() {
    this.alive = false;
  }

  /**
   * Resurrect object.
   */
  respawn() {
    this.stop();
    this.reset(this.respawnPoint.x, this.respawnPoint.y);
    this.body.x = this.x;
    this.body.y = this.y;
  }

  reset(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.alive = true;
    this.visible = true;
  }

  /**
   * Updates object speed.
   * @param value - new speed.
   */
  updateSpeed(value: number) {
    this.currentSpeed = value;
  }

  /**
   * Restores base speed.
   */
  restoreSpeed() {
    this.currentSpeed = this.speed;
  }

  /**
   * Teleports object.
   * @param portalX - entry portal x.
   * @param portalY - entry portal y.
   * @param targetX - out portal x.
   * @param targetY -out portal y.
   */
  teleport(portalX: number, portalY: number, targetX: number, targetY: number, width: number, height: number) {
    let x: number;
    let y: number;

    if (portalX === targetX || portalX > targetX) {
      x = targetX + this.tileSize / 2;
    } else {
      x = targetX - this.tileSize / 2;
    }

    if (portalY === targetY || portalY > targetY) {
      y = targetY + this.tileSize / 2;
    } else {
      y = targetY - this.tileSize / 2;
    }

    // give an extra push to get over the blackhole
    switch (this.current) {
      case Phaser.LEFT:
        x -= width;
        break;
      case Phaser.RIGHT:
        x += width;
        break;
      case Phaser.UP:
        y -= height;
        break;
      case Phaser.DOWN:
        y += height;
        break;
    }

    this.reset(x, y);
    this.move(this.current);
  }

  /**
   * Setup object physics.
   */
  private setupPhysics() {
    this.setOrigin(0.5, 0.5);
    this.setScale(this.scaleSize);

    this.scene.physics.world.enable(this);
    this.scene.physics.world.add(this.body);
    this.body.setSize(
      this.tileSize / 2,
      this.tileSize / 2,
      true
    );
  }
}
