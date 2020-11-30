import properties from '../properties';

import Font from '../ui/Font';
import Menu from '../ui/Menu';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  init(playState) {
    this.playState = playState;
  }

  create() {

    this.font = new Font(this);

    this.sounds = {
      music: this.sound.add('music-menu'),
    }

    const centerX = properties.width / 2;
    const top = 80;

    this.art = [];
    this.art.push(this.add.image(centerX, 300, 'art-pilot'));
    this.title = this.add.image(centerX, top, 'title');

    this.menu = new Menu(this, [
      {
        text: 'start',
        cb: () => {
          //this.sounds.newGame.play();
          this.scene.start('RouteSelectScene', this.playState);
        }
      },
    ], centerX, top + 80);

    this.sounds.music.play({ loop: true });
  }

  offsetForText(text) {
    return -(text.length * 8) / 2;
  }

}
