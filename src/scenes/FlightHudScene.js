import properties from '../properties';

import moduleDefinitions from '../definitions/moduleDefinitions.json';
import uiDefinitions from '../definitions/uiDefinitions.json';

import TileMath from "../utils/TileMath";

import Font from '../ui/Font';

const METERS_PER_TILE = 5;

export default class FlightHudScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FlightHudScene' });
  }

  init(playState) {
    this.playState = playState;
  }

  create() {
    this.font = new Font(this);

    this.enginesHaveBeenStarted = false;

    this.engineControls = this.createEngineControls();
    this.fuelGauge = this.createFuelGauge();
    this.setFuelLevel(1);
    this.wayfinder = this.createWayfinder();
    this.damageMessages = [];
    this.damageText = this.createDamageText();

    const flightScene = this.scene.get('FlightScene');
    flightScene.events.on('fuel-level-change', level => this.setFuelLevel(level));
    flightScene.events.on('wayfinder-change', vector => this.setWayfinder(vector));
    flightScene.events.on('damage-ship', text => this.setDamageText(text));
  }

  setFuelLevel(level) {
    this.fuelGauge.forEach(gauge => gauge.fuelLevelImage.setScale(1, level));
  }

  setWayfinder(vector) {
    const distanceMeters = Math.round((vector.distance / properties.tileWidth) * METERS_PER_TILE);
    const elevationMeters = Math.round((vector.elevation / properties.tileWidth) * METERS_PER_TILE);
    const speedMetersPerSecond = Math.round((vector.speed / properties.tileWidth) * METERS_PER_TILE * 100);
    const smoothedSpeedMetersPerSecond = this.enginesHaveBeenStarted ? speedMetersPerSecond : 0;
    const flightSeconds = Math.round(vector.flightTime / 1000);
    this.wayfinder.wayfinderImage.setRotation(vector.angle);
    this.wayfinder.distanceText.setText(
      `DISTANCE: ${distanceMeters}`);
    this.wayfinder.elevationText.setText(
      `  HEIGHT: ${elevationMeters}`);
    this.wayfinder.speedText.setText(
      `   SPEED: ${smoothedSpeedMetersPerSecond}`);
    this.wayfinder.flightTimeText.setText(
      `    TIME: ${flightSeconds}`);
  }

  setDamageText(text) {
    if (text) {
      this.damageMessages.push(text);
    }
    const damageText = this.damageMessages.join('\n');
    this.damageText.setText(damageText);
    this.time.delayedCall(properties.damageCooldown, () => {
      this.damageMessages.shift();
      const damageText = this.damageMessages.join('\n');
      this.damageText.setText(damageText);
    });
  }

  createEngineControls() {
    const engineRows = this.playState.shipDefinition
      .map((row) =>
        row
          .map((module) => moduleDefinitions[module.type] && moduleDefinitions[module.type].engine ? module : null)
          .filter(module => module)
      )
      .filter(row => row.length > 0);

    const longestRowLength = Math.max(...engineRows.map(row => row.length));
    const numRows = engineRows.length;
    const centerX = longestRowLength * properties.tileWidth + 8;
    const top = properties.height - (numRows * properties.tileHeight) - 8;

    // console.log(`controls: centerX: ${centerX} top: ${top}`);
    const engineControls = engineRows.map((row, y) => {
      const left = centerX - ((row.length * properties.tileWidth) / 2);
      const rowY = top + (y * properties.tileHeight);

      // console.log(`row: left: ${left} rowY: ${rowY}`);
      row.map((module, x) => {
        const { engine } = moduleDefinitions[module.type];
        const controlTileIndex = moduleDefinitions[`engine-${engine.size}`].tileIndex;
        const engineX = left + (x * properties.tileWidth);

        // console.log(`engine: ${engineX}, ${rowY}: ${controlTileIndex}`);
        const baseImage = this.add.image(engineX, rowY, 'tileset-spritesheet', uiDefinitions['button-base'].tileIndex);
        const engineImage = this.add.image(engineX, rowY, 'tileset-spritesheet', controlTileIndex)
          .setRotation(module.angle)
          .setInteractive();
        const activeImage = this.add.image(engineX, rowY, 'tileset-spritesheet', uiDefinitions['button-active'].tileIndex);
        activeImage.visible = false;

        engineImage.setData('engine-on', false);
        engineImage.on('pointerdown', () => {
          
          // Toggle engine firing
          this.enginesHaveBeenStarted = true;
          engineImage.setData('engine-on', !engineImage.getData('engine-on'));
          activeImage.visible = engineImage.getData('engine-on');
          
          const event = engineImage.getData('engine-on') ? 'engine-on' : 'engine-off';
          this.events.emit(event, module.name);
        });

        const frameImage = this.add.image(engineX, rowY, 'tileset-spritesheet', uiDefinitions['button-frame'].tileIndex);
        
        return { baseImage, engineImage, activeImage, frameImage };
      })
    });

    return engineControls;
  }

  createFuelGauge() {
    const fuelTanks = this.playState.shipDefinition
      .flat()
      .filter(module => module.type === 'fuel-tank');
    const fuelGaugeCount = fuelTanks.length;

    const right = properties.width - properties.tileWidth - 8;
    const y = properties.height - properties.tileHeight - 8;
    const fuelGauge = [...Array(fuelGaugeCount).keys()].map((i) => {
      const x = right - (i * properties.tileWidth);
      const baseImage = this.add.image(x, y, 'tileset-spritesheet', uiDefinitions['button-base'].tileIndex);
      const fuelTankImage = this.add.image(x, y, 'tileset-spritesheet', moduleDefinitions['fuel-tank'].tileIndex)
        .setRotation(Math.PI / 2);
      const fuelLevelImage = this.add.image(x, y + (properties.tileHeight / 2), 'tileset-spritesheet', uiDefinitions['fuel-level'].tileIndex)
        .setScale(1, 0);
      fuelLevelImage.setOrigin(0.5, 1);
      return { baseImage, fuelTankImage, fuelLevelImage };
    });
  
    return fuelGauge;
  }

  createWayfinder() {
    const x = properties.tileWidth + 8;
    const y = properties.tileHeight + 8;
    const baseImage = this.add.image(x, y, 'tileset-spritesheet', uiDefinitions['button-base'].tileIndex);
    const wayfinderImage = this.add.image(x, y, 'tileset-spritesheet', uiDefinitions['wayfinder'].tileIndex);
    
    const textPoint= TileMath.addHalfTile({ x, y });
    const distanceText = this.font.render(textPoint.x + 8, textPoint.y - 16, '');
    const elevationText = this.font.render(textPoint.x + 8, textPoint.y, '');
    const speedText = this.font.render(textPoint.x + 8, textPoint.y + 16, '');
    const flightTimeText = this.font.render(textPoint.x + 8, textPoint.y + 32, '');
    return { baseImage, wayfinderImage, distanceText, elevationText, speedText, flightTimeText };
  }

  createDamageText() {
    const x = (properties.width / 2) - 96;
    const y = properties.tileHeight + 8;
    const damageText = this.font.render(x, y, '');
    return damageText;
  }

  offsetForText(text) {
    return -(text.length * 8) / 2;
  }
}
