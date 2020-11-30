import properties from '../properties';

import routeDefinitions from '../definitions/routeDefinitions.json';
import moduleDefinitions from '../definitions/moduleDefinitions.json';
import uiDefinitions from '../definitions/uiDefinitions.json';

import utils from '../utils/utils';

import Menu from '../ui/Menu';
import Font from '../ui/Font';

const CYAN = 0x73FDFF;
const WHITE = 0xFFFFFF;
const BLACK = 0x000000;

export default class RouteSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RouteSelectScene' });
  }

  init(playState) {
    this.playState = playState;
  }

  create() {
    this.font = new Font(this);
    
    this.sounds = {
      select: this.sound.add('select'),
    }

    this.starfield = this.add.image(properties.width / 2, properties.height / 2, 'starfield-background');
    this.background = this.add.image(properties.width / 2, properties.height / 2, 'map-world');

    this.xOffset = (properties.largeButtonWidth + properties.tileWidth) / 2;
    this.yOffset = -properties.tileHeight / 2;

    this.selectedNode = null;

    this.graphics = this.add.graphics();
    this.lines = this.createLines();

    this.overlay = this.add.image(properties.width / 2, properties.height / 2, 'map-world-overlay');
    
    this.nodeMenu = this.createNodeMenu();
    this.shipIcon = this.createShipIcon();
    
    this.menu = new Menu(this, [
      {
        text: 'shipyard',
        cb: () => {
          this.scene.start('BuildHudScene', this.playState);
          this.scene.start('BuildScene', this.playState);
        }
      },
      {
        text: 'takeoff',
        inactive: true,
        cb: () => {
          // this.scene.start('CrashScene', this.playState);
          // this.scene.start('LandScene', this.playState);
          this.scene.start('FlightHudScene', this.playState);
          this.scene.start('FlightScene', this.playState);
          this.scene.start('FlightBackgroundScene', this.playState);
        }
      }
    ], properties.width - (properties.largeButtonWidth / 2) - 8, properties.tileHeight);
  }

  createNodeMenu() {
    const menuConfig = Object.entries(routeDefinitions).map(e => {
      const nodeKey = e[0];
      const node = e[1];
      const inactive = !routeDefinitions[this.playState.currentNode].routes[nodeKey] ||
        routeDefinitions[this.playState.currentNode].routes[nodeKey].map.length === 0;

      return {
        x: node.x + this.xOffset,
        y: node.y + this.yOffset,
        inactive,
        text: node.name,
        cb: () => this.selectNode(nodeKey, activeImage)
      }
    });

    const nodeFromTo = this.font.render(properties.tileWidth, properties.tileHeight, 'Select a Destination');
    const nodeDescription = this.font.render(properties.tileWidth, properties.tileHeight + 20, '');
    const nodeCargo = this.font.render(properties.tileWidth, properties.tileHeight + 68, '');
    const nodeContract = this.font.render(properties.tileWidth, properties.tileHeight + 106, '');
    const nodeTraffic = this.font.render(properties.tileWidth, properties.tileHeight + 126, '');

    const nodeMenu = new Menu(this, menuConfig);

    const activeImage = this.add.image(0, 0, 'tileset-spritesheet', uiDefinitions['button-active'].tileIndex);
    activeImage.visible = false;
  
    return { nodeMenu, nodeFromTo, nodeDescription, nodeCargo, nodeContract, nodeTraffic, activeImage };
  }

  createShipIcon() {
    const { x, y } = routeDefinitions[this.playState.currentNode];
    const commandTileIndex = moduleDefinitions['command'].tileIndex;
    const shipIcon = this.add.image(x, y, 'tileset-spritesheet', commandTileIndex);
    shipIcon.setRotation(3 * Math.PI / 2);
    return shipIcon;
  }

  createLines() {
    this.graphics.clear();

    Object.keys(routeDefinitions).forEach(nodeFromKey => {
      const nodeFrom = routeDefinitions[nodeFromKey];
      
      Object.keys(nodeFrom.routes).forEach(nodeToKey => {
        const { x, y } = routeDefinitions[nodeToKey];
        let lineColor = this.pathIsSelected(nodeFromKey, nodeToKey) ? CYAN : BLACK;
        this.graphics.lineStyle(2, lineColor, 1.0);
        this.graphics.beginPath();
        this.graphics.moveTo(nodeFrom.x + 1, nodeFrom.y + 1);
        this.graphics.lineTo(x + 1, y + 1);
        this.graphics.closePath();
        this.graphics.strokePath();
        lineColor = this.pathIsSelected(nodeFromKey, nodeToKey) ? CYAN : WHITE;
        this.graphics.lineStyle(2, lineColor, 1.0);
        this.graphics.beginPath();
        this.graphics.moveTo(nodeFrom.x, nodeFrom.y);
        this.graphics.lineTo(x, y);
        this.graphics.closePath();
        this.graphics.strokePath();
      });
    });
  }

  pathIsSelected(nodeFromKey, nodeToKey) {
    return (this.playState.currentNode === nodeFromKey && this.selectedNode === nodeToKey) ||
      (this.playState.currentNode === nodeToKey && this.selectedNode === nodeFromKey);
  }

  selectNode(nodeKey) {
    const nodeFrom = routeDefinitions[this.playState.currentNode];
    const nodeTo = routeDefinitions[nodeKey];
    const cargo = nodeFrom.routes[nodeKey].cargo;
    
    const nodeFromToText = `${nodeFrom.name.toUpperCase()} to ${nodeTo.name.toUpperCase()}`;
    const descriptionText = utils.wrapText(nodeTo.description, 40);
    const cargoText = utils.wrapText('CARGO: ' + cargo.description, 40);
    const contractText = `CONTRACT PRICE PER CONTAINER: $${cargo.contract.toLocaleString()}`;
    const trafficText = `TRAFFIC: ${nodeFrom.routes[nodeKey].traffic.toUpperCase()}`;
    
    this.nodeMenu.nodeFromTo.setText(nodeFromToText);
    this.nodeMenu.nodeDescription.setText(descriptionText);
    this.nodeMenu.nodeCargo.setText(cargoText);
    this.nodeMenu.nodeContract.setText(contractText);
    this.nodeMenu.nodeTraffic.setText(trafficText);

    this.nodeMenu.activeImage.visible = true;
    this.nodeMenu.activeImage.setPosition(nodeTo.x + this.xOffset, nodeTo.y + this.yOffset);

    this.selectedNode = nodeKey;

    this.lines = this.createLines();

    this.menu.activate(1);

    this.playState.destinationNode = nodeKey;

    this.sounds.select.play();
  }
}
