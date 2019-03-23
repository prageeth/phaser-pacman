const getObjectsByType = (
  type: string,
  map: Phaser.Tilemaps.Tilemap,
  layer: string
): any[] => {
  return map
    .getObjectLayer(layer)
    .objects.filter(element => element.type === type);
};

const getRespawnPoint = (
  name: string,
  map: Phaser.Tilemaps.Tilemap,
  layer = "objects"
): Phaser.Geom.Point => {
  const { x, y } = map
    .getObjectLayer(layer)
    .objects.filter(
      element => element.type === "respawn" && element.name === name
    )
    .shift() as Phaser.GameObjects.Sprite;

  return { x, y } as Phaser.Geom.Point;
};

const getTargetPoint = (
  name: string,
  map: Phaser.Tilemaps.Tilemap,
  layer = "objects"
): Phaser.Geom.Point => {
  const { x, y } = map
    .getObjectLayer(layer)
    .objects.filter(
      element => element.type === "target" && element.name === name
    )
    .shift() as Phaser.GameObjects.Sprite;

  return { x, y } as Phaser.Geom.Point;
};

export { getObjectsByType, getRespawnPoint, getTargetPoint };
