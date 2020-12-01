import properties from '../properties';

import moduleDefinitions from '../definitions/moduleDefinitions.json';
import shipdefinitions from '../definitions/shipDefinitions.json';

const DAMAGE_SPEED_THRESHOLD = 0.30;
const IMPACT_SPEED_THRESHOLDS = [0.5, 1.0];

export default class DamageSystem {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    this.damages = [];
    this.modules = {};
   
    this.sounds = {
      impactLight: scene.sound.add('impact-light'),
      impactMedium: scene.sound.add('impact-medium'),
      impactHeavy: scene.sound.add('impact-heavy'),
    }
  }

  damageModule(moduleBody, moduleName, moduleType, struckBody) {
    if (this.modules[moduleName]) {
      return;
    }
    const { speed } = this.player.commandModule.body;
    if (speed < DAMAGE_SPEED_THRESHOLD) {
      return;
    }

    const { description, repairCost } = moduleDefinitions[moduleType];
    this.damages.push({ description, repairCost });
    this.scene.events.emit('damage-ship', `-$${repairCost.toLocaleString()} ${description}`);
    
    this.modules[moduleName] = true;
    this.scene.time.delayedCall(properties.damageCooldown, () => {
      this.modules[moduleName] = false;
    });

    if (speed < IMPACT_SPEED_THRESHOLDS[0]) {
      this.sounds.impactLight.play();
    } else if (speed < IMPACT_SPEED_THRESHOLDS[1]) {
      this.sounds.impactMedium.play();
    } else {
      this.sounds.impactHeavy.play();
    }

    if (struckBody.label.startsWith('ship')) {
      const shipId = struckBody.label.split('+')[1];
      const { description, repairCost } = shipdefinitions[shipId];
      this.damages.push({ description, repairCost });
      this.scene.events.emit('damage-ship', `-$${repairCost.toLocaleString()} ${description}`);
    }
  }

  getStats() {
    const damageCost = this.damages.reduce((acc, e) => acc - e.repairCost, 0);
    const damageIncidents = this.damages.length;
    return { damageCost, damageIncidents };
  }
}
