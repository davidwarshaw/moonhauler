import properties from '../properties';

import FlightHudScene from "../scenes/FlightHudScene";

import Font from '../ui/Font';
import Menu from '../ui/Menu';

export default class CrashScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CrashScene' });
  }

  init(playState) {
    this.playState = playState;
  }

  create() {
    this.font = new Font(this);

    this.sounds = {
      scene: this.sound.add('crash'),
    }

    this.messages = [
      ['"When you have to choose between hitting a ship and hitting the ground,',
        'don\'t forget: the ground doesn\'t have a lawyer."'],
      ['"Launching pads get baked by rockets all day.',
        'They\'re tough. Land as hard as you want."'],
      ['"I knew a pilot that would hard burn down from orbit.',
        'Swing it around at the last minute. His ship ain\'t',
        'much to look at anymore, but his widow is easy on the eyes."'],
      ['"There are no landmarks in space. It\'s disorienting.',
        'Keep you eye on the instruments."'],
      ['"Space grade containers don\'t have an upside or a downside.',
        'They don\'t care how the ship lands. Just that it does."'],
      ['"More containers means more rockets,',
        'which means more fuel, which means more rockets, ..."'],
      ['"It\'s ok to leak a little fuel, it all evaporates away.',
        'It does mean it\'s time to start thinking about landing."'],
      ['"Be on alert when dedocking from a station.',
        'Afterall, dedocking is just a technical term for falling."'],
      ['"To dock at a station, hit the docking ring, going slow, with engines off.',
        'If you bounce off the safety lockout, just wait it out and try again."'],
    ];

    const centerX = properties.width / 2;
    const top = 80;
    
    this.title = this.add.image(centerX, top, 'title-crash');

    const text = properties.rng.getItem(this.messages);
    this.images = [];
    text.forEach((textLine, row) => {
      let offsetX = this.offsetForText(textLine);
      let offsetY = 64 + (16 * row);
      this.images.push(this.font.render(centerX + offsetX, top + offsetY, textLine));  
    });

    this.menu = new Menu(this, [
      {
        text: 'retry',
        cb: () => {
          console.log('CrashScene.retry');
          this.scene.add('FlightHudScene', FlightHudScene, true, this.playState);
          this.scene.start('FlightScene', this.playState);
          this.scene.start('FlightBackgroundScene', this.playState);
        }
      },
      {
        text: 'tow to tycho',
        cb: () => {
          console.log('CrashScene.abandon');
          this.playState.currentNode = "tycho-docks";
          this.scene.start('RouteSelectScene', this.playState);
        }
      }
    ], centerX, top + 180);

    this.sounds.scene.play();
  }

  offsetForText(text) {
    return -(text.length * 8) / 2;
  }
}
