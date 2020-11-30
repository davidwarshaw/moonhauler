import properties from "../properties";

import moduleDefinitions from '../definitions/moduleDefinitions.json';

import AStar from "../utils/AStar";
import TileMath from "../utils/TileMath";

const SELECT_FRAME_TILE_INDEX = 22;
const ADD_FRAME_TILE_INDEX = 23;
const UNCONNECTED_TILE_INDEX = 24;
const EMPTY_TILE_INDEX = 29;

export default class BuildSystem {
  constructor(scene, map, layer) {
    this.scene = scene;
    this.map = map;
    this.layer = layer;

    this.resetShip();
  }

  async pointerDown(pointer) {
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tilePoint = this.map.worldToTileXY(worldPoint.x, worldPoint.y);
    const tile = this.layer.getTileAt(tilePoint.x, tilePoint.y);
    if (tile.index !== EMPTY_TILE_INDEX && tile.index !== moduleDefinitions['command'].tileIndex) {
      const worldTilePoint = TileMath.addHalfTile(this.map.tileToWorldXY(tilePoint.x, tilePoint.y));
      this.currentlySelectedPoint = tilePoint;
      this.currentlySelectedFrame.setPosition(worldTilePoint.x, worldTilePoint.y);
      this.sendInfoEvent();
    }
  }

  async pointerUp() {
  }

  async buttonSelect(buttonData) {
    const { buttonFunction, type } = buttonData;
    const { x, y } = this.currentlySelectedPoint;
    switch (buttonFunction) {
      case 'module': {
        const moduleDefinition = moduleDefinitions[type];
        const existingModule = this.shipDefinition[y][x];

        // Only if we can afford it
        if (!existingModule.type && moduleDefinition.cost > this.getBalance()) {
          break;
        } else if (existingModule.type && moduleDefinition.cost > this.getBalance() + existingModule.cost) {
          break;
        }

        const angle = 0;
        const name = `${x}:${y}:${type}`;
        this.shipDefinition[y][x] = { type, angle, name };
        this.layer.putTileAt(moduleDefinition.tileIndex, x, y);
        // The tile rotation needs to be reset
        const tile = this.layer.getTileAt(x, y);
        tile.rotation = angle;
        this.rotateModuleForConnection(x, y);
        this.recreate();
        break;
      }
      case 'rotate': {
        this.rotateModule(x, y);
        this.recreate();
        break;
      }
      case 'delete': {
        if (this.tilePointIsShip({ x, y })) {
          this.shipDefinition[y][x] = { type: null };
          this.layer.removeTileAt(x, y);
          this.recreate();
        }
        break;
      }
      case 'done': {
        this.done();
        break;
      }
      case 'reset': {
        this.resetShip();
        break;
      }
    }

    this.sendInfoEvent();
  }

  sendInfoEvent() {
    const { x, y } = this.currentlySelectedPoint;
    const module = this.shipDefinition[y][x];
    const buildCost = this.buildCost;
    const funds = this.scene.playState.funds;
    this.scene.events.emit('tile-select', { module, funds, buildCost });
  }

  recreate() {
    this.recreateField();
    this.recreateShip();
    this.recreateAddableTiles();
    this.recreateUnconnectedImages();
    this.recreateBuildCost()
  }

  resetShip() {
    this.shipDefinition = JSON.parse(JSON.stringify(this.scene.playState.shipDefinition));

    this.aStar = new AStar(this.shipDefinition);

    this.currentlySelectedPoint = this.scene.playState.shipBuild.lastTile;
    const worldPoint = TileMath.addHalfTile(this.map.tileToWorldXY(this.currentlySelectedPoint.x, this.currentlySelectedPoint.y));
    if (this.currentlySelectedFrame) {
      this.currentlySelectedFrame.destroy();
    }
    this.currentlySelectedFrame = this.scene.add.image(worldPoint.x, worldPoint.y, 'tileset-spritesheet', SELECT_FRAME_TILE_INDEX);

    this.recreate();
  }

  done() {
    // Clear unconnected modules first
    this.unconnecteds.forEach(unconnected => {
      const { x, y } = unconnected.point;
      this.shipDefinition[y][x] = { type: null };
    });

    this.scene.playState.shipDefinition = JSON.parse(JSON.stringify(this.shipDefinition));
    this.scene.playState.shipBuild.lastTile = this.currentlySelectedPoint;
    this.scene.playState.funds = this.getBalance();
    
    this.scene.done();
  }

  recreateField() {
    [...Array(properties.buildHeightTiles).keys()].forEach((y) =>
      [...Array(properties.buildWidthTiles).keys()].forEach((x) => {
        this.layer.putTileAt(EMPTY_TILE_INDEX, x, y);
      }));
  }

  recreateShip() {
    this.shipDefinition.forEach((row, y) =>
      row.forEach((module, x) => {
        if (!module.type) {
          return;
        }

        const moduleDefinition = moduleDefinitions[module.type];

        // Place the tile, then get it to rotate it
        this.layer.putTileAt(moduleDefinition.tileIndex, x, y);
        const tile = this.layer.getTileAt(x, y);
        tile.rotation = module.angle;
      })
    );
  }

  recreateAddableTiles() {
    this.shipDefinition.forEach((row, y) =>
      row.forEach((module, x) => {
        if (!module.type) {
          return;
        }

        const moduleDefinition = moduleDefinitions[module.type];
        
        moduleDefinition.attachments.map(attachment => {
          const rotatedAttachment = TileMath.rotateDirection(attachment, module.angle);
          // console.log(`attachment: ${attachment} rotatedAttachment: ${rotatedAttachment}`);
          const tilePoint = TileMath.getTileNeighborByDirection({ x, y }, rotatedAttachment);
          if (!this.tilePointIsShip(tilePoint)) {
            this.layer.putTileAt(ADD_FRAME_TILE_INDEX, tilePoint.x, tilePoint.y);
          }
        });
      })
    );
  }

  recreateUnconnectedImages() {
    // Clear current addables
    if (this.unconnecteds) {
      this.unconnecteds.forEach(unconnected => unconnected.image.destroy());
    }

    const commandPoint = this.getCommandXY();
    this.unconnecteds = [];
    this.shipDefinition.forEach((row, y) =>
      row.forEach((module, x) => {
        if (!module.type) {
          return;
        }
        const point = { x, y };
        const path = this.aStar.findPath(point, commandPoint);
        if (path.length === 0) {
          const worldTilePoint = TileMath.addHalfTile(this.map.tileToWorldXY(x, y));
          const image = this.scene.add.image(worldTilePoint.x, worldTilePoint.y, 'tileset-spritesheet', UNCONNECTED_TILE_INDEX);
          this.unconnecteds.push({ image, point });
        }
      })
    );
  }

  recreateBuildCost() {
    const newModulesCost = this.shipDefinition
      // Filter out unconnected modules
      .map((row, y) =>
        row.map((module, x) => {
          const unconnected = this.unconnecteds.filter(e => e.x === x && e.y === y);
          if (unconnected.length > 0) {
            return { type: null };
          }
          return module;
        })
      )
      .flat()
      .filter(module => module.type)
      .map(module => moduleDefinitions[module.type].cost)
      .reduce((acc, e) => acc + e, 0);
    // console.log(`newModulesCost: ${newModulesCost}`);

    const existingModulesCost = this.scene.playState.shipDefinition
      .flat()
      .filter(module => module.type)
      .map(module => moduleDefinitions[module.type].cost)
      .reduce((acc, e) => acc + e, 0);
    // console.log(`existingModulesCost: ${existingModulesCost}`);

    const buildCost = newModulesCost - existingModulesCost;
    this.buildCost = buildCost;
  }

  rotateModule(x, y) {
    const tile = this.layer.getTileAt(x, y);
    tile.rotation = Phaser.Math.Wrap(tile.rotation + Math.PI / 2, 0, 2 * Math.PI);
    console.log(tile.rotation);
    this.shipDefinition[y][x].angle = tile.rotation;
  }

  rotateModuleForConnection(x, y) {
    const commandPoint = this.getCommandXY();
    const point = { x, y };
    
    // Rotate up to 4 times
    for (let i = 0; i < 3; i++) {
      const path = this.aStar.findPath(point, commandPoint);
      if (path.length > 0) {
        break;
      }
      this.rotateModule(x, y);
    }
  }

  getModuleFromIndex(index) {
    const entries = Object.entries(moduleDefinitions)
      .filter(moduleEntry => {
        return moduleEntry[1].tileIndex === index;
      });
    return Object.assign({}, { name: entries[0][0] }, entries[0][1]);
  }

  tilePointIsShip(tilePoint) {
    const { x, y } = tilePoint;
    return this.shipDefinition[y][x].type;
  }

  getCommandXY() {
    let commandXY = { x: -1, y: -1 };
    this.shipDefinition.forEach((row, y) =>
      row.forEach((module, x) => {
        if (module.type === 'command') {
          commandXY = { x, y };
        }
      })
    );
    return commandXY;
  }

  getBalance() {
    return this.scene.playState.funds - this.buildCost;
  }
}
