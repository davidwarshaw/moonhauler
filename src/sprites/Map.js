import properties from '../properties';

import mapDefinitions from '../definitions/mapDefinitions.json';
import tilesetDefinition from '../definitions/tilesetDefinition.json';

const BACKGROUND_TILE_WEIGHTS = {
  "black": 40,
  "big-star": 1,
  "small-star-1": 5,
  "small-star-2": 5,
}

export default class Map {
  constructor(scene, currentRoute) {
    this.scene = scene;
    this.currentRoute = currentRoute;
    const currentMap = currentRoute.map

    this.definition = mapDefinitions[currentMap];

    const { tileWidth, tileHeight } = properties;
  
    this.tilemap = this.scene.make.tilemap({ key: `map-${currentMap}` });
    this.tileset = this.tilemap.addTilesetImage('tileset_extruded', 'tileset', tileWidth, tileHeight, 1, 2);
    this.layers = {};

    //this.layers.background = this.tilemap.createBlankDynamicLayer('background', this.tileset);
    this.layers.background = this.tilemap.createStaticLayer('background', this.tileset);
    this.layers.collision = this.tilemap.createStaticLayer('collision', this.tileset);
    this.layers.foreground = this.tilemap.createStaticLayer('foreground', this.tileset);

    //this.indexesToLayer(this.populateBackground(), this.layers.background);
    
    this.scene.matter.world.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels);
    
    this.layers.collision.setCollisionByExclusion([-1], true, true);
    this.scene.matter.world.convertTilemapLayer(this.layers.collision);
    this.setCollisionLabels();
  }

  indexesToLayer(indexes, layer) {
    indexes.forEach((row, y) =>
      row.forEach((tileIndex, x) => {
        layer.putTileAt(tileIndex, x, y);
      })
    );
  }

  setCollisionLabels() {
    this.layers.collision.forEachTile(tile => {
      if (!tile.physics.matterBody) {
        return;
      }
      let label = 'tile+default';
      switch (tile.index) {
        case 56: label = 'tile+docking-ring'; break;
      }
      tile.physics.matterBody.body.label = label;
    });
  }

  populateBackground() {
    const tileIndexes = [...Array(this.definition.heightInTiles).keys()].map((y) =>
      [...Array(this.definition.widthInTiles).keys()].map((x) => { 
        const backgroundTile = properties.rng.getWeightedValue(BACKGROUND_TILE_WEIGHTS)
        return tilesetDefinition[backgroundTile].index;
      })
    );
    return tileIndexes;
  }

  getHeightAboveGround(worldX, worldY) {
    const { x, y } = this.tilemap.worldToTileXY(worldX, worldY);
    for (let i = y; i < this.tilemap.height; i++) {
      // console.log(`x: ${x} y: ${y}`);
      if (this.layers.collision.getTileAt(x, i)) {
        return this.tilemap.tileToWorldXY(x, i).y - worldY;
      }
    }
    return -1;
  }

  getGoalWorldXY() {
    const { reverse } = this.currentRoute;
    const goal = reverse ? this.definition.spawn : this.definition.goal;
    return this.tilemap.tileToWorldXY(goal.x, goal.y);
  }

  getSpawn(shipHeight) {
    const { reverse } = this.currentRoute;
    const spawn = reverse ? this.definition.goal : this.definition.spawn;
    const adjustedY = this.definition.stationGoal && reverse ?
      spawn.y + 1 :
      spawn.y - shipHeight + 1;
    return { x: spawn.x, y: adjustedY };
  }

  goalIsStation() {
    const { reverse } = this.currentRoute;
    return this.definition.stationGoal && !reverse ? true : false;
  }
}