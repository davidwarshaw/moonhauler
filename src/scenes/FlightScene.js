import properties from '../properties';

import routeDefinitions from '../definitions/routeDefinitions.json';
import mapDefinitions from '../definitions/mapDefinitions.json';

import TileMath from '../utils/TileMath';

import Map from '../sprites/Map';
import Player from '../sprites/Player';

import DamageSystem from '../systems/DamageSystem';
import TrafficSystem from '../systems/TrafficSystem';
import SmokeSystem from '../systems/SmokeSystem';

const SPEED_THRESHOLD = 0.10;
const NO_SPEED_CRASH_TIME = 10000;
const NO_SPEED_GOAL_TIME = 1000;
const GOAL_DISTANCE_TO_WIN = 250;
const STATION_DOCKING_SPEED_THRESHOLD = 0.40;
const STATION_DOCKABLE_COOLDOWN = 5000;
const UNDOCKABLE_TILE_INDEX = 24;

export default class FlightScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FlightScene' });
  }

  init(playState) {
    this.playState = playState;
  }

  create() {
    this.sounds = {
      dock: this.sound.add('dock'),
    }
    this.playState.music.menu.stop();
    this.playState.music.flight.play({ loop: true });

    const { currentNode, destinationNode } = this.playState;
    const currentRoute = routeDefinitions[currentNode].routes[destinationNode];

    this.mapDefinition = mapDefinitions[currentRoute.map];
    
    this.playState.flightStats = {};
    this.belowSpeed = null;
    this.startTime = null;
    this.enginesHaveBeenStarted = false;

    this.map = new Map(this, currentRoute);
    this.player = new Player(this, this.map, this.playState.shipDefinition, this.playState.fuel);

    this.damageSystem = new DamageSystem(this, this.player);
    this.trafficSystem = new TrafficSystem(this, this.map, currentRoute, this.mapDefinition);
    this.smokeSystem = new SmokeSystem(this, this.player);

    if (this.mapDefinition.stationGoal) {
      this.stationDockable = true;
      const { x, y } = this.mapDefinition.goal;
      const worldTilePoint = TileMath.addHalfTile(this.map.tilemap.tileToWorldXY(x, y));
      this.stationDockLockout = this.add.image(worldTilePoint.x, worldTilePoint.y, 'tileset-spritesheet', UNDOCKABLE_TILE_INDEX);
      this.stationDockLockout.visible = false;
      this.dockedAtStation = false;
    }

    this.cameras.main.setBounds(0, 0, this.map.tilemap.widthInPixels, this.map.tilemap.heightInPixels);
    this.cameras.main.startFollow(this.player.commandModule, true, 1, 1, 0, 0);
    
    this.matter.world.setGravity(0, this.map.definition.gravity);
    this.matter.world.on('collisionstart', event => this.collisionStart(event));

    if (properties.debug) {
      this.matter.world.createDebugGraphic();
      this.matter.world.drawDebug = true;
    }

    const hudScene = this.scene.get('FlightHudScene');
    hudScene.events.on('engine-on', moduleName => {
      this.enginesHaveBeenStarted = true;
      return this.player.engineOn(moduleName);
    });
    hudScene.events.on('engine-off', moduleName => this.player.engineOff(moduleName));
  }

  collisionStart(event) {
    if (!this.enginesHaveBeenStarted) {
      return;
    }
    for (var i = 0; i < event.pairs.length; i++) {
      var bodyA = event.pairs[i].bodyA;
      var bodyB = event.pairs[i].bodyB;

      // No module vs module collision
      if ((bodyA.label.startsWith('module') && bodyB.label.startsWith('module'))) {
        continue;
      }
      // console.log(`bodyA.label: ${bodyA.label} vs bodyB.label: ${bodyB.label}`);
      if ((bodyA.label.startsWith('ship') && bodyB.label === 'Rectangle Body') ||
        (bodyB.label.startsWith('ship') && bodyA.label === 'Rectangle Body')) {

          const shipBody = bodyA.label.startsWith('ship') ? bodyA : bodyB;
          this.trafficSystem.resetShipPosition(shipBody);

      } else if ((bodyA.label.startsWith('module') && bodyB.label === 'Rectangle Body') ||
        (bodyB.label.startsWith('module') && bodyA.label === 'Rectangle Body')) {
        continue;
      } else if (bodyA.label.startsWith('module') || bodyB.label.startsWith('module')) {

        if (this.dockedAtStation) {
          continue;
        }

        const moduleBody = bodyA.label.startsWith('module') ? bodyA : bodyB;
        const moduleName = moduleBody.label.split('+')[1];
        const moduleType = moduleName.split(':')[2];
        const tileBody = bodyA.label.startsWith('module') ? bodyB : bodyA;
        const tileType = tileBody.label.split('+')[1];
        // console.log(`moduleType: ${moduleType} tileType: ${tileType}`);
        if (this.map.goalIsStation() && moduleType === 'command' && tileType === 'docking-ring') {
          this.checkIfDocking(tileBody);
        } else {
          const wasDamaged = this.damageSystem.damageModule(moduleBody, moduleName, moduleType, tileBody);
          if (moduleType === 'fuel-tank' && wasDamaged) {
            this.smokeSystem.start(moduleName, moduleBody);
          }
        }
      }
    }
  }

  update(time, delta) {
    if (!this.startTime) {
      this.startTime = time;
    }
    this.player.update(time, delta);
    this.trafficSystem.update(time, delta);

    this.checkIfGameOver(time);
  }

  checkIfGameOver(time) {
    if(this.belowSpeed && this.player.commandModule.body.speed > SPEED_THRESHOLD) {
      this.belowSpeed = null;
    } else if (this.player.commandModule.body.speed <= SPEED_THRESHOLD) {
      if (!this.belowSpeed) {
        this.belowSpeed = time;
      } else {
        // console.log(`time: ${time} this.belowSpeed: ${this.belowSpeed}`);
        const belowSpeedTime = time - this.belowSpeed;
        // console.log(`goalDistance: ${this.player.getDistanceToGoal()} belowSpeedTime: ${belowSpeedTime}`);
        if (belowSpeedTime >= NO_SPEED_GOAL_TIME &&
          this.player.getDistanceToGoal() <= GOAL_DISTANCE_TO_WIN &&
          !this.player.anEngineIsOn() &&
          (!this.map.goalIsStation() || (this.map.goalIsStation() && this.dockedAtStation))) {
          this.win(time);
        } else if (belowSpeedTime >= NO_SPEED_CRASH_TIME &&
          this.player.getDistanceToGoal() > GOAL_DISTANCE_TO_WIN) {
          this.gameOver();
        }
      }
    }
  }

  checkIfDocking(dockingTileBody) {
    if (!this.player.enginesLockedOut && this.stationDockable) {
      if (this.player.commandModule.body.speed <= STATION_DOCKING_SPEED_THRESHOLD &&
        !this.player.anEngineIsOn()) {
        this.player.engineLockout();
        this.dockingConstraint = this.matter.add.constraint(this.player.commandModule, dockingTileBody, 16, 0.8);
        this.dockedAtStation = true;
        this.sounds.dock.play();
      } else {
        this.setUndockable();
      }
    }
  }

  setUndockable() {
    this.stationDockable = false;
    this.stationDockLockout.visible = true;
    this.dockableTimer = this.time.delayedCall(STATION_DOCKABLE_COOLDOWN, () => {
      this.stationDockable = true;
      this.stationDockLockout.visible = false;
    });
  }

  win(time) {
    const { damageCost, damageIncidents } = this.damageSystem.getStats();
    this.playState.flightStats = {
      deliveryTime: time - this.startTime,
      damageCost,
      damageIncidents
    };

    this.playState.music.flight.stop();
    this.playState.music.menu.play({ loop: true });

    this.scene.remove('FlightHudScene');
    this.scene.stop('FlightBackgroundScene');
    this.scene.start('LandScene', this.playState);    
  }

  gameOver() {
    this.playState.flightStats = {};
    this.belowSpeed = null;
    this.startTime = null;

    this.playState.music.flight.stop();
    this.playState.music.menu.play({ loop: true });

    this.scene.remove('FlightHudScene');
    this.scene.stop('FlightBackgroundScene');
    this.scene.start('CrashScene', this.playState);
  }

}
