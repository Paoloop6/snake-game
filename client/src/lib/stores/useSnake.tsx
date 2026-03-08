import { create } from "zustand";

export type GamePhase = "menu" | "playing" | "paused" | "gameOver";
export type Direction = "up" | "down" | "left" | "right";
export type PowerUpType = "bonus" | "slow" | null;
export type GameMode = "classic" | "speed" | "twin" | "portal" | "walls" | "infinite" | "swapper" | "rewind";

interface Position {
  x: number;
  y: number;
}

interface PowerUp {
  position: Position;
  type: "bonus" | "slow";
  expiresAt: number;
}

interface Portal {
  entry: Position;
  exit: Position;
}

interface Ghost {
  path: Position[];
  currentIndex: number;
}

interface HistoryFrame {
  snake: Position[];
  food: Position;
  direction: Direction;
  score: number;
}

const GRID_SIZE = 20;
const INITIAL_SNAKE: Position[] = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];

function getRandomPosition(occupied: Position[]): Position {
  let pos: Position;
  let attempts = 0;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    attempts++;
    if (attempts > 1000) break;
  } while (occupied.some(o => o.x === pos.x && o.y === pos.y));
  return pos;
}

function generateObstacles(level: number, snake: Position[], food: Position): Position[] {
  if (level < 2) return [];
  const count = Math.min((level - 1) * 3, 15);
  const obstacles: Position[] = [];
  const occupied = [...snake, food];
  
  for (let i = 0; i < count; i++) {
    const pos = getRandomPosition([...occupied, ...obstacles]);
    obstacles.push(pos);
  }
  return obstacles;
}

function generatePortal(occupied: Position[]): Portal {
  const entry = getRandomPosition(occupied);
  const exit = getRandomPosition([...occupied, entry]);
  return { entry, exit };
}

function getAiMove(snakeHead: Position, foodPos: Position, snake: Position[]): Direction {
  const dx = foodPos.x - snakeHead.x;
  const dy = foodPos.y - snakeHead.y;
  
  const possibleMoves: { dir: Direction; pos: Position }[] = [
    { dir: "up", pos: { x: snakeHead.x, y: snakeHead.y - 1 } },
    { dir: "down", pos: { x: snakeHead.x, y: snakeHead.y + 1 } },
    { dir: "left", pos: { x: snakeHead.x - 1, y: snakeHead.y } },
    { dir: "right", pos: { x: snakeHead.x + 1, y: snakeHead.y } },
  ];

  const safeMoves = possibleMoves.filter(m => {
    const p = m.pos;
    if (p.x < 0 || p.x >= GRID_SIZE || p.y < 0 || p.y >= GRID_SIZE) return false;
    if (snake.some(s => s.x === p.x && s.y === p.y)) return false;
    return true;
  });

  if (safeMoves.length === 0) {
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
  }

  safeMoves.sort((a, b) => {
    const distA = Math.abs(a.pos.x - foodPos.x) + Math.abs(a.pos.y - foodPos.y);
    const distB = Math.abs(b.pos.x - foodPos.x) + Math.abs(b.pos.y - foodPos.y);
    return distA - distB;
  });

  return safeMoves[0].dir;
}

interface SnakeState {
  phase: GamePhase;
  snake: Position[];
  food: Position;
  direction: Direction;
  nextDirection: Direction;
  score: number;
  highScore: number;
  speed: number;
  level: number;
  obstacles: Position[];
  powerUp: PowerUp | null;
  activePowerUp: PowerUpType;
  powerUpEndTime: number;
  wrapMode: boolean;
  gameMode: GameMode;
  portal: Portal | null;
  walls: Position[];
  ghosts: Ghost[];
  history: HistoryFrame[];
  rewindCount: number;

  startGame: () => void;
  endGame: (fatal?: boolean) => void;
  goToMenu: () => void;
  togglePause: () => void;
  setDirection: (dir: Direction) => void;
  toggleWrapMode: () => void;
  setGameMode: (mode: GameMode) => void;
  moveFood: (dir: Direction) => void;
  tick: () => void;
}

export const useSnake = create<SnakeState>((set, get) => ({
  phase: "menu",
  snake: INITIAL_SNAKE,
  food: { x: 15, y: 10 },
  direction: "right",
  nextDirection: "right",
  score: 0,
  highScore: parseInt(localStorage.getItem("snakeHighScore") || "0"),
  speed: 150,
  level: 1,
  obstacles: [],
  powerUp: null,
  activePowerUp: null,
  powerUpEndTime: 0,
  wrapMode: false,
  gameMode: "classic",
  portal: null,
  walls: [],
  ghosts: [],
  history: [],
  rewindCount: 0,

  startGame: () => {
    const { gameMode } = get();
    const initialSnake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    
    let initialFood: Position;
    if (gameMode === "swapper") {
      initialFood = { x: 15, y: 15 };
    } else {
      initialFood = getRandomPosition(initialSnake);
    }
    
    let portal: Portal | null = null;
    if (gameMode === "portal") {
      portal = generatePortal([...initialSnake, initialFood]);
    }

    const baseSpeed = gameMode === "speed" ? 80 : gameMode === "swapper" ? 200 : 150;

    set({
      phase: "playing",
      snake: initialSnake,
      food: initialFood,
      direction: "right",
      nextDirection: "right",
      score: 0,
      speed: baseSpeed,
      level: 1,
      obstacles: [],
      powerUp: null,
      activePowerUp: null,
      powerUpEndTime: 0,
      portal,
      walls: [],
      wrapMode: gameMode === "infinite",
      ghosts: [],
      history: [],
      rewindCount: 0,
    });
  },

  endGame: (fatal?: boolean) => {
    const { score, highScore, gameMode, history, ghosts } = get();
    
    if (!fatal && gameMode === "rewind" && history.length > 20) {
      const rewindFrames = Math.min(20, history.length - 1);
      const newHistory = history.slice(0, -rewindFrames);
      const restoreFrame = newHistory[newHistory.length - 1];
      
      if (restoreFrame) {
        const ghostPath = history.slice(-rewindFrames).map(f => f.snake[0]);
        const newGhost: Ghost = {
          path: ghostPath,
          currentIndex: 0,
        };
        
        set({
          snake: restoreFrame.snake,
          food: restoreFrame.food,
          direction: restoreFrame.direction,
          nextDirection: restoreFrame.direction,
          score: restoreFrame.score,
          history: newHistory,
          ghosts: [...ghosts, newGhost],
          rewindCount: get().rewindCount + 1,
        });
        return;
      }
    }
    
    if (score > highScore) {
      localStorage.setItem("snakeHighScore", score.toString());
      set({ highScore: score });
    }
    set({ phase: "gameOver" });
  },

  goToMenu: () => {
    set({ phase: "menu" });
  },

  togglePause: () => {
    const { phase } = get();
    if (phase === "playing") {
      set({ phase: "paused" });
    } else if (phase === "paused") {
      set({ phase: "playing" });
    }
  },

  toggleWrapMode: () => {
    set(state => ({ wrapMode: !state.wrapMode }));
  },

  setGameMode: (mode: GameMode) => {
    set({ gameMode: mode, wrapMode: mode === "infinite" });
  },

  setDirection: (dir: Direction) => {
    const { direction, gameMode } = get();
    if (gameMode === "swapper") return;
    
    const opposites: Record<Direction, Direction> = {
      up: "down",
      down: "up",
      left: "right",
      right: "left",
    };
    if (opposites[dir] !== direction) {
      set({ nextDirection: dir });
    }
  },

  moveFood: (dir: Direction) => {
    const { food, snake, gameMode } = get();
    if (gameMode !== "swapper") return;

    const moves: Record<Direction, Position> = {
      up: { x: food.x, y: food.y - 1 },
      down: { x: food.x, y: food.y + 1 },
      left: { x: food.x - 1, y: food.y },
      right: { x: food.x + 1, y: food.y },
    };

    let newFood = moves[dir];
    newFood = {
      x: (newFood.x + GRID_SIZE) % GRID_SIZE,
      y: (newFood.y + GRID_SIZE) % GRID_SIZE,
    };

    if (!snake.some(s => s.x === newFood.x && s.y === newFood.y)) {
      set({ food: newFood });
    }
  },

  tick: () => {
    const { 
      snake, food, nextDirection, score, endGame, obstacles,
      powerUp, activePowerUp, powerUpEndTime, wrapMode, level,
      gameMode, portal, walls, ghosts, history
    } = get();

    if (gameMode === "rewind") {
      const frame: HistoryFrame = {
        snake: snake.map(s => ({ ...s })),
        food: { ...food },
        direction: nextDirection,
        score,
      };
      if (history.length < 300) {
        set({ history: [...history, frame] });
      } else {
        set({ history: [...history.slice(1), frame] });
      }
    }

    const updatedGhosts = ghosts.map(g => ({
      ...g,
      currentIndex: g.currentIndex + 1,
    })).filter(g => g.currentIndex < g.path.length);

    for (const ghost of updatedGhosts) {
      const ghostPos = ghost.path[ghost.currentIndex];
      if (ghostPos && snake[0].x === ghostPos.x && snake[0].y === ghostPos.y) {
        endGame(true);
        return;
      }
    }
    set({ ghosts: updatedGhosts });

    let currentDirection = nextDirection;
    if (gameMode === "swapper") {
      currentDirection = getAiMove(snake[0], food, snake);
    }
    
    set({ direction: currentDirection });
    
    const head = snake[0];
    const moves: Record<Direction, Position> = {
      up: { x: head.x, y: head.y - 1 },
      down: { x: head.x, y: head.y + 1 },
      left: { x: head.x - 1, y: head.y },
      right: { x: head.x + 1, y: head.y },
    };
    
    let newHead = moves[currentDirection];

    if (wrapMode || gameMode === "infinite") {
      newHead = {
        x: (newHead.x + GRID_SIZE) % GRID_SIZE,
        y: (newHead.y + GRID_SIZE) % GRID_SIZE,
      };
    } else {
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        if (gameMode === "swapper") {
          set({ score: score + 100 });
          const newSnake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 },
          ];
          set({ snake: newSnake, level: level + 1 });
          return;
        }
        endGame();
        return;
      }
    }

    if (portal && newHead.x === portal.entry.x && newHead.y === portal.entry.y) {
      newHead = { ...portal.exit };
    } else if (portal && newHead.x === portal.exit.x && newHead.y === portal.exit.y) {
      newHead = { ...portal.entry };
    }

    if (snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
      if (gameMode === "swapper") {
        set({ score: score + 100 });
        const newSnake = [
          { x: 10, y: 10 },
          { x: 9, y: 10 },
          { x: 8, y: 10 },
        ];
        set({ snake: newSnake, level: level + 1 });
        return;
      }
      endGame();
      return;
    }

    if (obstacles.some(obs => obs.x === newHead.x && obs.y === newHead.y)) {
      endGame();
      return;
    }

    if (walls.some(wall => wall.x === newHead.x && wall.y === newHead.y)) {
      if (gameMode === "swapper") {
        set({ score: score + 50 });
        return;
      }
      endGame();
      return;
    }

    let newSnake = [newHead, ...snake];
    const now = Date.now();
    
    let currentActivePowerUp = activePowerUp;
    if (activePowerUp && now > powerUpEndTime) {
      currentActivePowerUp = null;
      set({ activePowerUp: null, powerUpEndTime: 0 });
    }

    let currentPowerUp = powerUp;
    if (powerUp && now > powerUp.expiresAt) {
      currentPowerUp = null;
      set({ powerUp: null });
    }

    if (powerUp && newHead.x === powerUp.position.x && newHead.y === powerUp.position.y) {
      if (powerUp.type === "bonus") {
        const bonusPoints = 50;
        set({ 
          score: score + bonusPoints,
          powerUp: null,
        });
      } else if (powerUp.type === "slow") {
        set({
          activePowerUp: "slow",
          powerUpEndTime: now + 5000,
          powerUp: null,
        });
      }
    }
    
    if (newHead.x === food.x && newHead.y === food.y) {
      if (gameMode === "swapper") {
        endGame();
        return;
      }

      const newScore = score + 10;
      const newLevel = Math.floor(newScore / 100) + 1;
      const levelChanged = newLevel > level;

      let newDirection = currentDirection;
      if (gameMode === "twin" && newSnake.length > 1) {
        newSnake = newSnake.reverse();
        const twinHead = newSnake[0];
        const twinSecond = newSnake[1];
        if (twinHead.x < twinSecond.x) newDirection = "left";
        else if (twinHead.x > twinSecond.x) newDirection = "right";
        else if (twinHead.y < twinSecond.y) newDirection = "up";
        else newDirection = "down";
      }
      
      let baseSpeed = gameMode === "speed" 
        ? Math.max(40, 80 - (newLevel - 1) * 10)
        : Math.max(80, 150 - (newLevel - 1) * 15);
      if (currentActivePowerUp === "slow") {
        baseSpeed = Math.min(baseSpeed + 50, 200);
      }

      let newWalls = walls;
      if (gameMode === "walls") {
        const wallPos = getRandomPosition([...newSnake, food, ...walls]);
        newWalls = [...walls, wallPos];
      }

      const newObstacles = levelChanged && gameMode === "classic" 
        ? generateObstacles(newLevel, newSnake, food) 
        : obstacles;
      const allOccupied = [...newSnake, ...newObstacles, ...newWalls];
      const newFood = getRandomPosition(allOccupied);
      
      let newPortal = portal;
      if (gameMode === "portal") {
        newPortal = generatePortal([...allOccupied, newFood]);
      }
      
      let newPowerUp = currentPowerUp;
      if (!currentPowerUp && Math.random() < 0.3 && gameMode !== "speed") {
        const powerUpType = Math.random() < 0.5 ? "bonus" : "slow";
        newPowerUp = {
          position: getRandomPosition([...allOccupied, newFood]),
          type: powerUpType,
          expiresAt: now + 8000,
        };
      }

      set({
        snake: newSnake,
        food: newFood,
        score: newScore,
        speed: baseSpeed,
        level: newLevel,
        obstacles: newObstacles,
        powerUp: newPowerUp,
        portal: newPortal,
        walls: newWalls,
        direction: newDirection,
        nextDirection: newDirection,
      });
    } else {
      newSnake.pop();
      
      let baseSpeed = gameMode === "speed"
        ? Math.max(40, 80 - (level - 1) * 10)
        : gameMode === "swapper"
        ? Math.max(120, 200 - (level - 1) * 20)
        : Math.max(80, 150 - (level - 1) * 15);
      if (currentActivePowerUp === "slow") {
        baseSpeed = Math.min(baseSpeed + 50, 200);
      }
      
      set({ snake: newSnake, speed: baseSpeed });
    }
  },
}));

export { GRID_SIZE };
