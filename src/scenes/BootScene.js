import properties from "../properties";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Misc
    this.load.image('font-small', 'assets/fonts/atari_like.png');
    this.load.image('title', 'assets/images/title.png');
    this.load.image('title-land', 'assets/images/title-land.png');
    this.load.image('title-crash', 'assets/images/title-crash.png');
    this.load.image('art-pilot', 'assets/images/pilot.png');
    this.load.spritesheet('large-button-frame', 'assets/images/large-button-frame.png', {
      frameWidth: 160,
      frameHeight: 16,
      margin: 0,
      spacing: 0,
    });
    this.load.image('map-world', 'assets/images/map-world.png');
    this.load.image('map-world-overlay', 'assets/images/map-world-overlay.png');

    this.load.image('starfield-background', 'assets/images/starfield-background.png');
    this.load.image('starfield-foreground', 'assets/images/starfield-foreground.png');

    // Map
    this.load.tilemapTiledJSON("map-crater-hop", "assets/images/crater-hop.json");
    this.load.tilemapTiledJSON("map-geofront", "assets/images/geofront.json");
    this.load.tilemapTiledJSON("map-gateway", "assets/images/gateway.json");
    this.load.tilemapTiledJSON("map-crater-refinery", "assets/images/crater-refinery.json");
    this.load.tilemapTiledJSON("map-refinery-mine", "assets/images/refinery-mine.json");
    this.load.tilemapTiledJSON("map-malapert", "assets/images/malapert.json");
    this.load.tilemapTiledJSON("map-elevator", "assets/images/elevator.json");

    this.load.image('tileset', 'assets/images/tileset_extruded.png');

    // Sprites
    this.load.spritesheet('tileset-spritesheet', 'assets/images/tileset_extruded.png', {
      frameWidth: 16,
      frameHeight: 16,
      margin: 1,
      spacing: 2,
    });

    // Ships
    this.load.spritesheet('ship-01', 'assets/images/ships/ship-01.png', {
      frameWidth: 48,
      frameHeight: 16
    });
    this.load.spritesheet('ship-02', 'assets/images/ships/ship-02.png', {
      frameWidth: 64,
      frameHeight: 16
    });
    this.load.spritesheet('ship-03', 'assets/images/ships/ship-03.png', {
      frameWidth: 64,
      frameHeight: 48
    });
    this.load.spritesheet('ship-04', 'assets/images/ships/ship-04.png', {
      frameWidth: 64,
      frameHeight: 48
    });


    // Audio
    this.load.audio('music-menu', 'assets/audio/music-menu.mp3');
    this.load.audio('music-flight', 'assets/audio/music-flight.mp3');

    this.load.audio('select', 'assets/audio/sfx_menu_select2.wav');
    this.load.audio('enter', 'assets/audio/sfx_menu_select5.wav');
    this.load.audio('edit', 'assets/audio/sfx_menu_move1.wav');
    this.load.audio('module', 'assets/audio/sfx_menu_move2.wav');
    this.load.audio('impact-light', 'assets/audio/sfx_exp_short_soft9.wav');
    this.load.audio('impact-medium', 'assets/audio/sfx_exp_short_hard16.wav');
    this.load.audio('impact-heavy', 'assets/audio/sfx_exp_short_hard8.wav');
    this.load.audio('land', 'assets/audio/sfx_sounds_fanfare3.wav');
    this.load.audio('crash', 'assets/audio/sfx_alarm_loop8.wav');
    this.load.audio('dock', 'assets/audio/sfx_sound_depressurizing.wav');
    this.load.audio('drop-alarm', 'assets/audio/sfx_alarm_loop2.wav');
    this.load.audio('rocket', 'assets/audio/sfx_vehicle_engineloop.wav');

    const shipDefinition = [
      [{ type: null}, { type: "command", angle: 1.5 * Math.PI, name: '1-0-command' }, { type: null}],
      [{ type: "engine-small", angle: 0, name: '0-4-engine-small' }, { type: "cross", angle: 0, name: '1-4-cross' }, { type: "engine-small", angle: Math.PI, name: '2-4-engine-small' }],
      [{ type: null }, { type: "tee", angle: 1.5 * Math.PI, name: '1-3-cross' }, { type: "cargo-empty", angle: 0, name: '0-1-cargo-empty' }],
      [{ type: "fuel-tank", angle: 0, name: '0-1-fuel-tank' }, { type: "cross", angle: 0, name: '1-1-cross' }, { type: "fuel-tank", angle: Math.PI, name: '0-1-fuel-tank' }],
      [{ type: null}, { type: "engine-large", angle: 1.5 * Math.PI, name: '1-5-engine-large' }, { type: null}],
    ];
    
    this.playState = {};
    this.playState.shipDefinition = shipDefinition;
    this.playState.shipBuild = {
      lastTile: { x: 12, y: 6 }
    };
    this.fuel = 100;
    this.playState.funds = 22000;
    this.playState.currentNode = "tycho-station";
    this.playState.flightStats = {
      deliveryTime: 3000,
      damageCost: -2000,
      damageIncidents: 4
    };

    this.playState.shipDefinition = this.fixShipDefinition();
    this.playState.music = {};
  }

  create() {
    this.scene.start('TitleScene', this.playState);
  }

  fixShipDefinition() {
    const emptyShipDefTile = { type: null };
    const fixedShipDefinition =  [...Array(properties.buildHeightTiles)]
      .map(() => Array(properties.buildWidthTiles).fill(emptyShipDefTile));

    const shipY = 5;
    const shipX = 11;
    this.playState.shipDefinition.forEach((row, y) =>
      row.forEach((module, x) => {
        if (!module.type) {
          return;
        }
        module.name = `${x}:${y}:${module.type}`;
        fixedShipDefinition[y + shipY][x + shipX] = module;
      })
    );

    return fixedShipDefinition;
  }
}
