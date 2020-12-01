import properties from '../properties';

import moduleDefinitions from '../definitions/moduleDefinitions.json';
import uiDefinitions from '../definitions/uiDefinitions.json';

import Menu from '../ui/Menu';
import Font from '../ui/Font';

export default class BuildHudScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BuildHudScene' });
  }

  init(playState) {
    this.playState = playState;
  }

  create() {
    this.font = new Font(this);
    
    this.sounds = {
      edit: this.sound.add('edit'),
      module: this.sound.add('module'),
    }

    this.editFunctions = [
      { name: "rotate", tileIndex: 32 },
      { name: "delete", tileIndex: 35 },
    ];

    this.editButtons = this.createEditButtons();
    this.moduleButtons = this.createModuleButtons();

    this.menu = new Menu(this, [
      {
        text: 'done',
        cb: () => this.events.emit('button-select', { buttonFunction: 'done' })
      },
      {
        text: 'reset',
        cb: () => this.events.emit('button-select', { buttonFunction: 'reset' })
      }
    ], properties.width - (properties.largeButtonWidth / 2) - 8, properties.tileHeight);

    this.infoText = this.createInfoText();

    this.currentButton = null;

    const buildScene = this.scene.get('BuildScene');
    buildScene.events.on('tile-select', info => this.updateInfoText(info));
  }

  createEditButtons() {
    const padding = 4;
    const y = properties.height - (2 * properties.tileHeight) - (3 * padding);
    const left = padding + properties.tileWidth;

    const editButtons = this.editFunctions.map((editFunction, i) => {
      const x = left + (i * properties.tileWidth) + (i * 2 * padding);
      
      // console.log(`${editFunction.name}: ${x}, ${y}`);
      const image = this.add.image(x, y, 'tileset-spritesheet', editFunction.tileIndex)
        .setInteractive();
      image.on('pointerdown', () => {
        this.sounds.edit.play();
        return this.events.emit('button-select', { buttonFunction: editFunction.name });
      });
        
      
      const frame = this.add.image(x, y, 'tileset-spritesheet', uiDefinitions['button-frame'].tileIndex);  
      
      return { image, frame };
    });

    return editButtons;
  }

  createModuleButtons() {
    const padding = 4;
    const y = properties.height - properties.tileHeight - padding;
    const left = padding + properties.tileWidth;

    const moduleButtons = Object.entries(moduleDefinitions)
      // You can't build another command module or full cargo forks
      .filter(e => e[0] !== 'command' && e[0] !== 'cargo-full')
      .map((moduleEntry, i) => {
        const moduleName = moduleEntry[0];
        const module = moduleEntry[1];
        const x = left + (i * properties.tileWidth) + (i * padding);
        
        const image = this.add.image(x, y, 'tileset-spritesheet', module.tileIndex)
          .setInteractive();
        image.on('pointerdown', () =>{
          this.sounds.module.play();
          return this.events.emit('button-select', { buttonFunction: 'module', type: moduleName });
        });
        
        const frame = this.add.image(x, y, 'tileset-spritesheet', uiDefinitions['button-frame'].tileIndex);  
        
        return { image, frame };
      });

    return moduleButtons;
  }

  createInfoText() {
    let offsetY = 0;
    const description = this.font.render(properties.tileWidth, properties.tileHeight + offsetY, '');
    offsetY += 20;
    const cost = this.font.render(properties.tileWidth, properties.tileHeight + offsetY, '');
    offsetY += 16;
    const repairCost = this.font.render(properties.tileWidth, properties.tileHeight + offsetY, '');
    offsetY += 16;
    const mass = this.font.render(properties.tileWidth, properties.tileHeight + offsetY, '');
    offsetY += 16;
    const thrust = this.font.render(properties.tileWidth, properties.tileHeight + offsetY, '');
    offsetY += 16;
    const fuel = this.font.render(properties.tileWidth, properties.tileHeight + offsetY, '');
    
    const fundsLeft = (properties.width / 2) - 100;
    const funds = this.font.render(fundsLeft, properties.tileHeight, '');
    const buildCost= this.font.render(fundsLeft, properties.tileHeight + 16, '');
    const balance = this.font.render(fundsLeft, properties.tileHeight + 32, '');
    return { description, mass, cost, repairCost, thrust, fuel, funds, buildCost, balance };
  }

  updateInfoText(info) {
    //console.log(info);
    const { module, funds, buildCost } = info;

    if (!module.type) {
      this.infoText.description.setText('');
      this.infoText.mass.setText('');
      this.infoText.cost.setText('');
      this.infoText.repairCost.setText('');
      this.infoText.thrust.setText('');
      this.infoText.fuel.setText('');
    } else {
      const moduleDefinition = moduleDefinitions[module.type];
    
      const mass =
        `        MASS: ${Math.round(moduleDefinition.mass * 10000).toLocaleString()}`;
      const cost =
        `MODULE PRICE: $${Math.round(moduleDefinition.cost).toLocaleString()}`;
      const repairCost =
        ` REPAIR COST: $${Math.round(moduleDefinition.repairCost).toLocaleString()}`;
      const thrustText = moduleDefinition.engine ?
        `      THRUST: ${Math.round(moduleDefinition.engine.thrust * 1000000000).toLocaleString()}` :
        '';
      const fuelText = moduleDefinition.fuel ?
        `      VOLUME: ${Math.round(moduleDefinition.fuel.capacity * 1000).toLocaleString()}` :
        '';

        this.infoText.description.setText(moduleDefinition.description.toUpperCase());
      this.infoText.mass.setText(mass);
      this.infoText.cost.setText(cost);
      this.infoText.repairCost.setText(repairCost);
      this.infoText.thrust.setText(thrustText);
      this.infoText.fuel.setText(fuelText);
    }

    const fundsText     = `      FUNDS: $${funds.toLocaleString()}`;
    const buildCostText = `BUILD PRICE: $${buildCost.toLocaleString()}`;
    const balanceText   = `    BALANCE: $${(funds - buildCost).toLocaleString()}`;

    this.infoText.funds.setText(fundsText);
    this.infoText.buildCost.setText(buildCostText);
    this.infoText.balance.setText(balanceText);
  }

  offsetForText(text) {
    return -(text.length * 8) / 2;
  }
}
