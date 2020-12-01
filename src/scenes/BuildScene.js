import properties from '../properties';

import BuildSystem from '../systems/BuildSystem';

export default class BuildScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BuildScene' });
  }

  init(playState) {
    this.playState = playState;
  }

  create() {
    const { tileWidth, tileHeight } = properties;
    const width = properties.buildWidthTiles;
    const height = properties.buildHeightTiles;

    this.tilemap = this.make.tilemap({ tileWidth, tileHeight, width, height });
    this.tileset = this.tilemap.addTilesetImage('tileset', 'tileset', 16, 16, 1, 2);
    this.layer = this.tilemap.createBlankDynamicLayer('build', this.tileset);

    this.buildSystem = new BuildSystem(this, this.tilemap, this.layer);

    this.cameras.main.startFollow(this.buildSystem.currentlySelectedFrame, true, 0.1, 0.1, 0, 0);

    this.layer.setInteractive();
    this.layer.on('pointerdown', pointer => this.buildSystem.pointerDown(pointer));

    const buildHudScene = this.scene.get('BuildHudScene');
    buildHudScene.events.on('button-select', buttonData => this.buildSystem.buttonSelect(buttonData));

    // Pre populate the HUD with build system info
    this.buildSystem.sendInfoEvent();
  }

  update(time, delta) {
  }

  done() {
    // this.scene.stop('BuildHudScene');
    this.scene.remove('BuildHudScene');
    this.scene.start('RouteSelectScene', this.playState);
  }
}
