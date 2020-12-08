import properties from '../properties';

import routeDefinitions from '../definitions/routeDefinitions.json';
import moduleDefinitions from '../definitions/moduleDefinitions.json';

import Font from '../ui/Font';
import Menu from '../ui/Menu';

const AMOUNT_LENGTH = 9;

export default class LandScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LandScene' });
  }

  init(playState) {
    this.playState = playState;
  }

  create() {
    this.font = new Font(this);
    
    this.sounds = {
      scene: this.sound.add('land'),
    }

    const { currentNode, destinationNode } = this.playState;
    this.destination = routeDefinitions[currentNode].routes[destinationNode];

    const centerX = properties.width / 2;
    const top = 80;
    
    this.title = this.add.image(centerX, top, 'title-land');

    const num = this.getContainerCount();
    const contract = this.destination.cargo.contract;
    const expressSeconds = this.destination.cargo.expressSeconds;
    const { deliveryTime, damageCost, damageIncidents } = this.playState.flightStats;
    const maxDamage = -1 * num * 10000;
    const limitedDamage = damageCost < maxDamage ? maxDamage : damageCost;
    const paid = num * contract;
    const bonus = (deliveryTime / 1000) <= expressSeconds ? paid * 0.2 : 0;
    const profit = paid + bonus + limitedDamage;
    const funds = this.playState.funds + profit;
    
    const contractText = contract.toLocaleString().padStart(AMOUNT_LENGTH, ' ');
    const deliveryTimeText = Math.round(deliveryTime / 1000);
    const paidText = paid.toLocaleString().padStart(AMOUNT_LENGTH, ' ');
    const damageCostText = limitedDamage.toLocaleString().padStart(AMOUNT_LENGTH, ' ');
    const expressBonusText = bonus.toLocaleString().padStart(AMOUNT_LENGTH, ' ');
    const profitText = profit.toLocaleString().padStart(AMOUNT_LENGTH, ' ');
    const fundsText = funds.toLocaleString().padStart(AMOUNT_LENGTH, ' ');

    let text = `${num} container(s) @ $${contractText}`
    let margin = 40;
    this.title = this.font.render(centerX + this.offsetForText(text), top + margin, text);

    text = `Express Time: ${expressSeconds} / Delivery Time: ${deliveryTimeText}`
    margin += 16;
    this.title = this.font.render(centerX + this.offsetForText(text), top + margin, text);

    text = `${damageIncidents} Damage Incidents, Damage: $${Math.abs(damageCost).toLocaleString()}, Deductible: $${Math.abs(maxDamage).toLocaleString()}`
    margin += 16;
    this.title = this.font.render(centerX + this.offsetForText(text), top + margin, text);

    text = `     Contract: $${paidText}`;
    margin += 32;
    this.title = this.font.render(centerX + this.offsetForText(text), top + margin, text);
    
    text = `Express Bonus: $${expressBonusText}`;
    margin += 16;
    this.title = this.font.render(centerX + this.offsetForText(text), top + margin, text);

    text = ` Damage Costs: $${damageCostText}`;
    margin += 16;
    this.title = this.font.render(centerX + this.offsetForText(text), top + margin, text);

    text = `       Profit: $${profitText}`;
    margin += 16;
    this.title = this.font.render(centerX + this.offsetForText(text), top + margin, text);

    text = `        Funds: $${fundsText}`;
    margin += 32;    
    this.title = this.font.render(centerX + this.offsetForText(text), top + margin, text);
    
    this.menu = new Menu(this, [
      {
        text: 'ok',
        cb: () => {
          this.playState.currentNode = this.playState.destinationNode;
          this.playState.destinationNode = null;
          this.playState.funds = funds;
          this.scene.start('RouteSelectScene', this.playState);
        }
      }
    ], properties.width / 2, margin += 160);

    this.sounds.scene.play();
  }

  getContainerCount() {
    const containers = this.playState.shipDefinition
    .flat()
    .filter(module => module.type === 'cargo-empty');
    const containersCount = containers.length;
    return containersCount;
  }

  offsetForText(text) {
    return -(text.length * 8) / 2;
  }
}
