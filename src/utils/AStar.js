import moduleDefinitions from '../definitions/moduleDefinitions.json';

import TileMath from './TileMath';
const CIRCUIT_BREAKER = 500;

export default class AStar {
  constructor(shipDefinition) {
    this.shipDefinition = shipDefinition;
    this.width = shipDefinition[0].length;
    this.height = shipDefinition.length;
  }

  getAttachments(point) {
    const { type, angle } = this.shipDefinition[point.y][point.x];
    const { attachments } = moduleDefinitions[type];
    const rotated = attachments.map(direction => TileMath.rotateDirection(direction, angle));
    return rotated;
  }

  addNeighbor(point, neighborDirection, neighbors, x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return;
    }
    if (!this.shipDefinition[y][x].type) {
      return;
    }
    const fromAttachments = this.getAttachments(point);
    const toAttachments = this.getAttachments({ x, y });
    const hasCorresponding = TileMath.hasCorrespondingDirections(neighborDirection, fromAttachments, toAttachments)
    if (!hasCorresponding) {
      return;
    }
    // console.log(`added neighbor: x: ${x}, y:${y}`);

    neighbors.push({ x, y });
  }

  getNeighbors(point) {
    // console.log(`getNeighbors: x: ${point.x}, y: ${point.y}`);
    const neighbors = [];
    this.addNeighbor(point, 'up', neighbors, point.x, point.y - 1);
    this.addNeighbor(point, 'down', neighbors, point.x, point.y + 1);
    this.addNeighbor(point, 'left', neighbors, point.x - 1, point.y);
    this.addNeighbor(point, 'right', neighbors, point.x + 1, point.y);
    return neighbors;
  }

  addToOpenSet(openSet, goal, current, previous) {
    // Calculate the scores need to judge better paths
    const gScore = previous ? previous.gScore + 1 : 0;
    const hScore = TileMath.distance(current, goal);
    const fScore = gScore + hScore;
    const currentNode = {
      x: current.x,
      y: current.y,
      previous,
      gScore,
      hScore,
      fScore
    };

    // console.log('openSet before:');
    // openSet.forEach(os => console.log(`x: ${os.x}, y: ${os.y}`));

    // if the open set is empty no need to search for the insertion point
    if (openSet.length === 0) {
      openSet.push(currentNode);
      // console.log('openSet after:');
      // openSet.forEach(os => console.log(`x: ${os.x}, y: ${os.y}`));
      return;
    }

    // console.log(`fScore: ${fScore}`);
    // console.log(`hScore: ${hScore}`);
    // Search for the insertion point in the queue and insert
    for (let i = 0; i < openSet.length; i++) {
      const e = openSet[i];
      // console.log(`e.fScore: ${e.fScore}`);
      // console.log(`e.hScore: ${e.hScore}`);
      if (fScore < e.fScore || (fScore === e.fScore && hScore < e.hScore)) {
        openSet.splice(i, 0, currentNode);
        // console.log('openSet after:');
        // openSet.forEach(os => console.log(`x: ${os.x}, y: ${os.y}`));
        return;
      }
    }

    // Insert at the end if there's no better option
    openSet.push(currentNode);
  }

  findPath(from, to) {
    let circuitCount = 0;
    const openSet = [];
    const closedSet = {};

    // console.log(`goal: x: ${to.x} y: ${to.y}`);

    this.addToOpenSet(openSet, to, from, null);

    while (openSet.length > 0) {
      // console.log('openSet:');
      // openSet.forEach(os => console.log(`x: ${os.x}, y: ${os.y}`));
      // Left pop the next best node from the priority queue
      const current = openSet.shift();

      // If the current key is in the closed set, go to the next one
      const currentKey = TileMath.keyFromPoint(current);
      if (currentKey in closedSet) {
        continue;
      }

      // Add to the closed set
      closedSet[currentKey] = current;

      // If we're at the goal, stop searching
      if (current.x === to.x && current.y === to.y) {
        break;
      }

      // console.log('closedSet:');
      // Object.keys(closedSet).forEach(k => console.log(k));

      // Check neighbors
      for (let neighbor of this.getNeighbors(current)) {
        const neighborKey = TileMath.keyFromPoint(neighbor);
        if (neighborKey in closedSet) {
          continue;
        }
        // console.log(`Adding to openSet: x: ${neighbor.x} y: ${neighbor.y}`);
        this.addToOpenSet(openSet, to, neighbor, current);
      }

      circuitCount++;
      if (circuitCount >= CIRCUIT_BREAKER) {
        // console.log('AStar CIRCUIT_BREAKER tripped.');
        return [];
      }
    }

    // Reconstruct path by left pushing previous nodes back to start
    const path = [];
    let node = closedSet[TileMath.keyFromPoint(to)];
    while (node) {
      path.unshift({ x: node.x, y: node.y });
      node = node.previous;
    }
    return path;
  }
}