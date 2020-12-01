import properties from '../properties';

import shipdefinitions from '../definitions/shipDefinitions.json';

const HOME_Y_THRESHOLD = 20;

const SHIP_RATIOS = {
  1:3,
  2:2,
  3:2,
  4:1,
}

export default class TrafficSystem {
  constructor(scene, map, currentRoute, currentMap) {
    this.scene = scene;
    this.map = map;
    this.currentRoute = currentRoute;
    this.currentMap = currentMap;

    this.ships = [];

    this.numConcurrentShips = 4;
    switch (this.currentRoute.traffic) {
      case "moderate": {
        this.numConcurrentShips = 8;
        break;
      }
      case "heavy": {
        this.numConcurrentShips = 16;
        break;
      }
    }

    this.ships = [...Array(this.numConcurrentShips).keys()].map(i => this.addShip());
  }

  update(time, delta) {
    this.ships.forEach(ship => {
      const shipDefinition = shipdefinitions[ship.shipId];
      
      // console.log(`ship-0${i}: ${ship.x}, ${ship.y}`);
      const rotationUpDirection = ship.reversed ? 1 : -1;
      if (ship.y < ship.homePositionY - HOME_Y_THRESHOLD) {
        ship.setRotation(rotationUpDirection * shipDefinition.rotationFactor);
      } else if (ship.y > ship.homePositionY + HOME_Y_THRESHOLD) {
        ship.setRotation(-1 * rotationUpDirection * shipDefinition.rotationFactor);
      } else {
        const rotation = ship.reversed ? Math.PI : 0;
        ship.setRotation(rotation);
      }

      // console.log(`speed: ${ship.body.speed}`);
      if (ship.body.speed < shipDefinition.topSpeed) {
        ship.thrust(shipDefinition.thrust);
      }
    });
  }

  addShip() {
    const i = properties.rng.getWeightedValue(SHIP_RATIOS);
    const shipId = `ship-0${i}`;
    const shipDefinition = shipdefinitions[shipId];
    const { minY, maxY, velocity } = this.currentMap.ships;

    const reversed = properties.rng.getItem([true, false])

    const options = {
      label: `ship+${shipId}`,
      angle: 0,
      mass: shipDefinition.mass,
      inverseMass: 1 / shipDefinition.mass,
      ignoreGravity: true,
      frictionAir: 0,
    };
    const positionX = this.map.tilemap.widthInPixels * (properties.rng.getPercentage() / 100);
    const positionYTile = minY + ((maxY - minY) * (properties.rng.getPercentage() / 100));
    const homePositionY = positionYTile * properties.tileHeight;
    const shipMatterSprite = this.scene.matter.add.sprite(positionX, homePositionY, shipId, 0, options);

    const rotation = reversed ? Math.PI : 0;
    shipMatterSprite.setRotation(rotation);

    this.scene.anims.create({
      key: `${shipId}-flying`,
      frames: this.scene.anims.generateFrameNumbers(shipId, { start: 0, end: 1 }),
      frameRate: properties.animFrameRate,
      repeat: -1
    });
    shipMatterSprite.anims.play(`${shipId}-flying`);

    shipMatterSprite.shipId = shipId;
    shipMatterSprite.reversed = reversed;
    shipMatterSprite.homePositionY = homePositionY;

    return shipMatterSprite;
  }

  resetShipPosition(shipBody) {
    const ship = shipBody.gameObject;
    // console.log(`Ship reset from: ${ship.x}, ${ship.y}`);
    const x = ship.reversed ? this.map.tilemap.widthInPixels : 0;
    const rotation = ship.reversed ? Math.PI : 0;
    ship.setPosition(x, ship.homePositionY);
    ship.setVelocity(0, 0);
    ship.setRotation(rotation);
    // console.log(`to: ${ship.x}, ${ship.y}`);
  }
}