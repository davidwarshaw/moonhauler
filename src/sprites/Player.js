import properties from '../properties';

import moduleDefinitions from '../definitions/moduleDefinitions.json';

import TileMath from "../utils/TileMath";

const FUEL_PER_TANK = 6.0;
const FUEL_MASS_PER_TANK = 5;
const FUEL_SEGMENTS = 16;

export default class Player {
  constructor(scene, map, shipDefinition, fuel) {
    this.scene = scene;
    this.map = map;
    this.shipDefinition = shipDefinition;

    this.inFlightDefinition = JSON.parse(JSON.stringify(shipDefinition));

    this.moduleSprites = [];
    this.moduleConstraints = [];
    this.engineSprites = {};
    this.fuelTankSprites = [];

    this.commandModule = null;

    this.fuelInTanks = this.getNumberFuelTanks() * FUEL_PER_TANK;
    this.enginesLockedOut = false;
    this.fuelLeaks = 0;

    const shipHeight = this.getShipHeight();
    const spawn = this.map.getSpawn(shipHeight);
    const worldSpawn = TileMath.addHalfTile(this.map.tilemap.tileToWorldXY(spawn.x, spawn.y));

    this.inFlightDefinition.forEach((row, y) =>
      row.forEach((module, x) => {
        if (!module.type) {
          return;
        }

        // Container forks are filled when flying
        if (module.type === 'cargo-empty') {
          module.type = 'cargo-full';
        }
        const moduleDefinition = moduleDefinitions[module.type];
        // console.log(moduleDefinition);

        const width = properties.tileWidth;
        const height = properties.tileHeight;
        const localX = width * (x - 11);
        const localY = height * (y - 5);
        const worldX = worldSpawn.x + localX;
        const worldY = worldSpawn.y + localY;
        // console.log(`${localX}, ${localY} -> ${worldX}, ${worldY}: ${module.index}`);

        const tileIndex = moduleDefinition.tileIndex;

        const options = {
          label: `module+${module.name}`,
          angle: module.angle,
          mass: moduleDefinition.mass,
          inverseMass: 1 / moduleDefinition.mass,
          frictionAir: 0.005,
        };
        const moduleSprite = scene.matter.add.sprite(worldX, worldY, 'tileset-spritesheet', tileIndex, options);

        moduleSprite.moduleDefinition = JSON.parse(JSON.stringify(moduleDefinition));
        moduleSprite.moduleDefinition.name = module.name;
        moduleSprite.moduleDefinition.firing = false;

        this.moduleSprites.forEach(existingModuleSprite => {
          const constraint = scene.matter.add.constraint(existingModuleSprite, moduleSprite);
          this.moduleConstraints.push(constraint);
        });

        this.moduleSprites.push(moduleSprite);
        if (moduleDefinition.engine) {
          const start = moduleDefinition.tileIndex;
          const end = moduleDefinition.tileIndex + 1;
          scene.anims.create({
            key: `${module.name}-engine-on`,
            frames: scene.anims.generateFrameNumbers('tileset-spritesheet', { start, end, first: end }),
            frameRate: properties.animFrameRate,
            repeat: -1
          });
          scene.anims.create({
            key: `${module.name}-engine-off`,
            frames: scene.anims.generateFrameNumbers('tileset-spritesheet', { start, end: start, first: start }),
            frameRate: properties.animFrameRate,
            repeat: 0
          });

          this.engineSprites[module.name] = moduleSprite;
        }

        if (module.type === 'fuel-tank') {
          this.fuelTankSprites.push(moduleSprite);
        }

        if (module.type === 'command') {
          this.commandModule = moduleSprite;
        }
      }));
    
    this.updateFuelTanksMass();

    this.sounds = {
      rocket: scene.sound.add('rocket'),
    }
  }

  engineOn(engineName) {
    if (this.fuelInTanks === 0) {
      return;
    }
    if (this.enginesLockedOut) {
      return;
    }
    
    const engineSprite = this.engineSprites[engineName];
    engineSprite.moduleDefinition.firing = true;
    engineSprite.anims.play(`${engineName}-engine-on`);
    
    this.sounds.rocket.play({ volume: 0.15, rate: 0.2, loop: true });
  }

  engineOff(engineName) {
    const engineSprite = this.engineSprites[engineName];
    engineSprite.moduleDefinition.firing = false;
    engineSprite.anims.play(`${engineName}-engine-off`);

    if (!this.anEngineIsOn()) {
      this.sounds.rocket.stop();
    }
  }

  allEnginesOff() {
    Object.values(this.engineSprites)
      .forEach(engineSprite => {
        const { name } = engineSprite.moduleDefinition;
        engineSprite.moduleDefinition.firing = false;
        engineSprite.anims.play(`${name}-engine-off`);
      });
  }

  engineLockout() {
    this.allEnginesOff();
    this.enginesLockedOut = true;
  }

  anEngineIsOn() {
    return Object.values(this.engineSprites)
      .some(engineSprite => engineSprite.moduleDefinition.firing);
  }

  update(time, delta) {
    // console.log(`\nplayer: ${this.commandModule.x}, ${this.commandModule.y}`);
    if (this.fuelInTanks != 0) {
      let fuelUsed = 0;
      Object.values(this.engineSprites)
        .filter(engineSprite => engineSprite.moduleDefinition.firing)
        .forEach(engineSprite => {
          const deltaThrust = delta * engineSprite.moduleDefinition.engine.thrust;
          fuelUsed += deltaThrust;
          engineSprite.thrust(deltaThrust);
        });
      
      this.fuelInTanks -= fuelUsed * (1 + this.fuelLeaks);
      if (this.fuelInTanks < 0) {
        this.fuelInTanks = 0;
        this.allEnginesOff();
      }
  
      this.changeFuelLevel();
      // console.log(`fuelInTanks: ${this.fuelInTanks}`);
    }

    this.scene.events.emit('wayfinder-change', this.getWayfinderVector(time, delta));
  }

  getShipHeight() {
    const height = this.inFlightDefinition
      .map(row => row.some(module => module.type))
      .reduce((acc, e) => acc + e);
    return height;
  }

  getNumberFuelTanks() {
    const fuelTanks = this.inFlightDefinition
    .flat()
    .filter(module => module.type === 'fuel-tank');
    return fuelTanks.length;
  }

  getDistanceToGoal() {
    const shipX = this.commandModule.x;
    const shipY = this.commandModule.y;
    const goalXY = this.map.getGoalWorldXY();
    return Phaser.Math.Distance.Between(shipX, shipY, goalXY.x, goalXY.y);
  }

  getWayfinderVector(time, delta) {
    const shipX = this.commandModule.x;
    const shipY = this.commandModule.y;
    const goalXY = this.map.getGoalWorldXY();
    const angle = Phaser.Math.Angle.Between(shipX, shipY, goalXY.x, goalXY.y);
    const distance = Phaser.Math.Distance.Between(shipX, shipY, goalXY.x, goalXY.y);
    const elevation = this.map.getHeightAboveGround(shipX, shipY);
    const speed = this.commandModule.body.speed;
    const flightTime = time - this.scene.startTime;
    return { angle, distance, elevation, speed, flightTime, shipX, shipY };
  }

  changeFuelLevel() {
    const totalFuel = this.getNumberFuelTanks() * FUEL_PER_TANK;
    const fuelLevel = this.fuelInTanks / totalFuel;
    const fuelLevelSegment = fuelLevel * FUEL_SEGMENTS;
    
    if (this.lastFuelLevelSegment && this.lastFuelLevelSegment === fuelLevelSegment) {
      return;
    }

    this.updateFuelTanksMass();

    this.scene.events.emit('fuel-level-change', fuelLevel);
    this.lastFuelLevelSegment = fuelLevelSegment;
  }

  updateFuelTanksMass() {
    const emptyTankMass = moduleDefinitions['fuel-tank'].mass;
    const fuelLevel = this.fuelInTanks / (this.getNumberFuelTanks() * FUEL_PER_TANK);
    const fuelTanksMass = emptyTankMass + (fuelLevel * FUEL_MASS_PER_TANK);
    // console.log(`fuelTanksMass: ${fuelTanksMass}`);
    this.fuelTankSprites.forEach(fuelTankSprite => fuelTankSprite.setMass(fuelTanksMass));
  }

  addFuelLeak() {
    this.fuelLeaks += 1;
  }

}