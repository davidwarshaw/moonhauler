import properties from "../properties";

import Font from './Font';

export default class Menu {
  constructor(scene, items, left, top) {
    this.scene = scene;
    this.items = items;

    this.font = new Font(scene);

    this.sounds = {
      enter: scene.sound.add('enter'),
    }
    
    const x = left || properties.width / 2;
    const height = items.length * properties.tileHeight;
    const start = top || (properties.height - height) / 2;
    
    this.itemImages = items.map((item, i) => {
      const y = start + (i * (properties.tileHeight + 8));
      
      const frameX = item.x || x;
      const frameY = item.y || y;
      const borderFrame = item.inactive ? 0 : 1;
      const frame = scene.add.image(frameX, frameY, 'large-button-frame', borderFrame);

      if (!item.inactive) {
        frame.setInteractive();
      }
      
      frame.on('pointerdown', () => {
        this.sounds.enter.play();
        return item.cb();
      });

      const text = this.font.render(frameX + this.offsetForText(item.text), frameY - 4, item.text);
      return { frame, text };
    });
  }
  
  activate(itemNum) {
    this.itemImages[itemNum].frame.setFrame(1);
    this.itemImages[itemNum].frame.setInteractive();
    //this.itemImages[itemNum].frame.on('pointerdown', () => this.items[itemNum].cb());
  }

  deactivate() {
    this.itemImages[itemNum].frame.setFrame(0);
    this.itemImages[itemNum].frame.disableInteractive();
  }

  offsetForText(text) {
    return -(text.length * 8) / 2;
  }
}