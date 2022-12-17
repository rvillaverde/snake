const CELL_SIZE = "var(--cell-size)";
const MAX_INTERVAL = 180;
const MIN_INTERVAL = 50;
const LEVEL_BREAKPOINT = 6;

const WIDTH = 25;
const HEIGHT = 15;
const INITIAL_SIZE = 5;

const DIRECTIONS = ["up", "down", "left", "right"];
const FOOD = 2;

const startButton = document.getElementById("start");

class CssStyle {
  constructor(style) {
    this.style = style;
  }

  toString = () =>
    Object.keys(this.style)
      .map((k) => `${k}: ${this.style[k]};`)
      .join("");
}

class Coord {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

const c = (x, y) => new Coord(x, y);

class Tail {
  constructor() {
    this.items = [];
    this.size = INITIAL_SIZE;
  }

  grow = () => {
    this.size++;
  };

  move = (item) => {
    this.items.push(item);

    if (this.size && this.items.length >= this.size) {
      return this.items.shift();
    }
  };
}

class Matrix {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    this.matrix = Array(this.height)
      .fill()
      .map(() => Array(this.width).fill(0));

    // this.randomFood();
    this.render();
  }

  set = (x, y, value) => (this.matrix[y][x] = value);

  render = () => {
    let matrix = "";

    this.matrix.forEach((rows) => {
      rows.forEach((col) => {
        matrix = matrix.concat(
          `<span class="cell ${col ? "filled" : ""} ${
            col === FOOD ? "food" : ""
          }"></span>`
        );
      });
    });

    document.getElementById("matrix").innerHTML = matrix;
  };

  isValidCoord = (x, y) => {
    if (x < 0 || x >= this.width) {
      return false;
    }

    if (y < 0 || y >= this.height) {
      return false;
    }

    return this.isEmpty(x, y);
  };

  isEmpty = (x, y) => this.matrix[y][x] !== 1;
}

class Snake {
  constructor(width, height) {
    if (!defined(width, height)) {
      throw new Error("Undefined value for width or height.");
    }

    this.width = width;
    this.height = height;

    // this.size = INITIAL_SIZE;
    this.head = undefined;
    this.food = undefined;

    this.matrix = undefined;

    document.getElementById("snake-container").innerHTML = this.render();
  }

  start = () => {
    this.matrix = new Matrix(this.width, this.height);
    this.direction = "right";

    this.head = {
      x: random(0, this.width / 2),
      y: random(0, this.height),
    };

    this.size = INITIAL_SIZE;
    this.tail = new Tail();

    this.updateFood();
  };

  render() {
    const style = new CssStyle({
      "grid-template-rows": `repeat(${this.height}, ${CELL_SIZE})`,
      "grid-template-columns": `repeat(${this.width}, ${CELL_SIZE})`,
    });

    return `
      <div class="snake" id="snake">
        <div class="background" style="${style}">
          ${this.renderBackground()}
        </div>
        <div id="matrix" class="matrix" style="${style}"></div>
      </div>
    `;
  }

  renderBackground() {
    let grid = "";

    for (let i = 0; i < this.width * this.height; i++) {
      grid = grid.concat('<span class="box"></span>');
    }

    return grid;
  }

  handleKeyDown = (e) => {
    switch (e.code) {
      case "ArrowRight":
        e.preventDefault();
        if (this.isValidDirection("right")) {
          this.direction = "right";
        }
        break;
      case "ArrowLeft":
        e.preventDefault();
        if (this.isValidDirection("left")) {
          this.direction = "left";
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (this.isValidDirection("up")) {
          this.direction = "up";
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (this.isValidDirection("down")) {
          this.direction = "down";
        }
        break;
      default:
        return;
    }
  };

  handleInterval = () => {
    switch (this.direction) {
      case "up":
        return this.moveUp();
      case "down":
        return this.moveDown();
      case "left":
        return this.moveLeft();
      case "right":
        return this.moveRight();
      default:
        return;
    }
  };

  moveLeft = () => this.move(this.head.x - 1, this.head.y);

  moveRight = () => this.move(this.head.x + 1, this.head.y);

  moveUp = () => this.move(this.head.x, this.head.y - 1);

  moveDown = () => this.move(this.head.x, this.head.y + 1);

  move = (newX, newY) => {
    const { x, y } = this.head;

    if (this.matrix.isValidCoord(newX, newY)) {
      this.head.x = newX;
      this.head.y = newY;
      this.updateMatrix(x, y, 0);
      this.updateMatrix(this.head.x, this.head.y, 1);

      if (this.hasFood(this.head.x, this.head.y)) {
        this.eat();
      }

      this.updateTail(c(x, y));
      this.matrix.render();

      return this.tail.size;
    }

    return false;
  };

  eat = () => {
    this.tail.grow();
    this.food = undefined;
    this.updateFood();
  };

  updateMatrix = (x, y, value) => this.matrix.set(x, y, value);

  updateFood = () => {
    // tail + head
    if (this.tail.size + 1 === this.width * this.height) {
      return;
    }

    while (true) {
      const x = random(0, this.width);
      const y = random(0, this.height);

      if (this.matrix.isEmpty(x, y)) {
        this.food = c(x, y);
        this.matrix.set(x, y, FOOD);
        return;
      }
    }
  };

  updateTail = (coord) => {
    this.updateMatrix(coord.x, coord.y, 1);

    const last = this.tail.move(coord);

    if (last) {
      this.updateMatrix(last.x, last.y, 0);
    }
  };

  isValidDirection = (direction) => {
    const isValid = (x, y) => this.matrix.isValidCoord(x, y);

    if (direction === "up") {
      return isValid(this.head.x, this.head.y - 1);
    }

    if (direction === "down") {
      return isValid(this.head.x, this.head.y + 1);
    }

    if (direction === "left") {
      return isValid(this.head.x - 1, this.head.y);
    }

    if (direction === "right") {
      return isValid(this.head.x + 1, this.head.y);
    }

    return true;
  };

  hasFood = (x, y) => this.food.x === x && this.food.y === y;
}

class Game {
  constructor() {
    this.interval = undefined;
    this.paused = false;
    this.gameOver = false;

    this.level = 1;
    this.score = 0;

    this.snake = new Snake(WIDTH, HEIGHT);

    document.addEventListener("keyup", this.handleKeyUp);
  }

  get speed() {
    if (this.level === 1) {
      return MAX_INTERVAL;
    }

    return MAX_INTERVAL / this.level + MIN_INTERVAL;
  }

  start = () => {
    this.score = 0;
    this.level = 1;

    this.gameOver = false;
    this.setInterval();

    gameOverScreen.hide();
    this.snake.start();

    const event = new Event("gameStarted");

    document.getElementById("snake-container").dispatchEvent(event);
    document.addEventListener("keydown", this.handleKeyDown);
  };

  pause = () => (this.paused = true);

  resume = () => (this.paused = false);

  stop = () => {
    this.clearInterval();
    this.gameOver = true;

    gameOverScreen.show(this.score);
    const event = new Event("gameOver");

    document.getElementById("snake-container").dispatchEvent(event);
    document.removeEventListener("keydown", this.handleKeyDown);
  };

  handleKeyDown = (e) => this.snake.handleKeyDown(e);

  handleInterval = () => {
    if (this.paused) {
      return;
    }

    const result = this.snake.handleInterval();

    if (!result) {
      return this.stop();
    }

    if (result - INITIAL_SIZE > this.score) {
      this.updateScore(result);
    }
  };

  handleKeyUp = (e) => {
    switch (e.code) {
      case "Space":
        if (this.gameOver) {
          return this.start();
        }
    }
  };

  setInterval = () => {
    if (this.interval) {
      this.clearInterval();
    }

    this.interval = setInterval(this.handleInterval, this.speed);
  };

  clearInterval = () => {
    clearInterval(this.interval);
    this.interval = undefined;
  };

  updateScore = (size) => {
    this.score = size - INITIAL_SIZE;

    this.updateLevel();
  };

  updateLevel = () => {
    this.level = Math.floor(this.score / LEVEL_BREAKPOINT) || 1;
    this.setInterval();
  };
}

const defined = (...values) => values.every((v) => v !== undefined);

const random = (min, max) => Math.floor(Math.random() * (max - min) + min);

const renderSnake = (snake) => {
  document.getElementById("snake-container").innerHTML = snake.render();
};

const gameOverScreen = {
  id: "game-over",
  hide() {
    const element = document.getElementById(this.id);
    element && element.remove();
  },
  show(score) {
    const element = `<div class="${this.id}" id="${this.id}">
      <div class="content">
        <h2>Game over!</h2>
        <p>Your score: ${score}</div>
      </div>
    </div>`;

    document.getElementById("snake").innerHTML += element;
  },
};

const toggleStartButton = (disabled) => (startButton.disabled = disabled);

const game = new Game();
startButton.addEventListener("click", game.start);

document
  .getElementById("snake-container")
  .addEventListener("gameStarted", () => toggleStartButton(true));

document
  .getElementById("snake-container")
  .addEventListener("gameOver", () => toggleStartButton(false));

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    game.pause();
  } else {
    game.resume();
  }
});
