import { useEffect, useCallback } from "react";
import { useSnake, GRID_SIZE, Direction, GameMode } from "@/lib/stores/useSnake";

const CELL_SIZE = 20;

const GAME_MODES: { id: GameMode; name: string; desc: string }[] = [
  { id: "classic", name: "Classic", desc: "Normal snake with levels & obstacles" },
  { id: "speed", name: "Speed", desc: "Fast gameplay, no power-ups" },
  { id: "infinite", name: "Infinite", desc: "No walls - wrap around edges" },
  { id: "twin", name: "Twin", desc: "Snake reverses when eating" },
  { id: "portal", name: "Portal", desc: "Teleport between portals" },
  { id: "walls", name: "Walls", desc: "Eating creates walls" },
  { id: "swapper", name: "Swapper", desc: "Control food, dodge AI snake!" },
  { id: "rewind", name: "Rewind", desc: "Death rewinds time, avoid ghosts" },
];

export function SnakeGame() {
  const {
    phase,
    snake,
    food,
    score,
    highScore,
    speed,
    level,
    obstacles,
    powerUp,
    activePowerUp,
    wrapMode,
    gameMode,
    portal,
    walls,
    ghosts,
    rewindCount,
    startGame,
    setDirection,
    moveFood,
    togglePause,
    goToMenu,
    setGameMode,
    tick,
  } = useSnake();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        if (phase === "playing" || phase === "paused") {
          e.preventDefault();
          togglePause();
          return;
        }
      }

      if (phase !== "playing") return;

      const keyDirections: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        W: "up",
        s: "down",
        S: "down",
        a: "left",
        A: "left",
        d: "right",
        D: "right",
      };

      if (keyDirections[e.key]) {
        e.preventDefault();
        if (gameMode === "swapper") {
          moveFood(keyDirections[e.key]);
        } else {
          setDirection(keyDirections[e.key]);
        }
      }
    },
    [phase, setDirection, moveFood, togglePause, gameMode]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (phase !== "playing") return;
    const interval = setInterval(tick, speed);
    return () => clearInterval(interval);
  }, [phase, speed, tick]);

  if (phase === "menu") {
    return (
      <div style={{ 
        minHeight: "100vh", 
        backgroundColor: "#000", 
        display: "flex", 
        flexDirection: "column",
        alignItems: "center", 
        justifyContent: "center",
        fontFamily: "monospace",
        padding: "20px"
      }}>
        <h1 style={{ color: "#0f0", fontSize: "48px", marginBottom: "10px" }}>SNAKE</h1>
        <p style={{ color: "#888", marginBottom: "20px", fontSize: "14px" }}>Arrow keys to move | P to pause</p>
        
        <div style={{ marginBottom: "20px", textAlign: "center" }}>
          <p style={{ color: "#0ff", marginBottom: "10px" }}>SELECT MODE:</p>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(2, 1fr)", 
            gap: "8px",
            maxWidth: "420px"
          }}>
            {GAME_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setGameMode(mode.id)}
                style={{
                  padding: "10px 15px",
                  fontSize: "14px",
                  backgroundColor: gameMode === mode.id ? "#0f0" : "#222",
                  color: gameMode === mode.id ? "#000" : "#0f0",
                  border: gameMode === mode.id ? "2px solid #0f0" : "2px solid #333",
                  cursor: "pointer",
                  fontFamily: "monospace",
                  textAlign: "left"
                }}
              >
                <div style={{ fontWeight: "bold" }}>{mode.name}</div>
                <div style={{ 
                  fontSize: "11px", 
                  color: gameMode === mode.id ? "#000" : "#888",
                  marginTop: "2px"
                }}>
                  {mode.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {highScore > 0 && (
          <p style={{ color: "#ff0", marginBottom: "15px" }}>Best: {highScore}</p>
        )}
        
        <button
          onClick={startGame}
          style={{
            padding: "15px 50px",
            fontSize: "24px",
            backgroundColor: "#0f0",
            color: "#000",
            border: "none",
            cursor: "pointer",
            fontFamily: "monospace",
            fontWeight: "bold"
          }}
        >
          PLAY
        </button>
      </div>
    );
  }

  if (phase === "paused") {
    return (
      <div style={{ 
        minHeight: "100vh", 
        backgroundColor: "#000", 
        display: "flex", 
        flexDirection: "column",
        alignItems: "center", 
        justifyContent: "center",
        fontFamily: "monospace"
      }}>
        <h1 style={{ color: "#ff0", fontSize: "48px", marginBottom: "20px" }}>PAUSED</h1>
        <p style={{ color: "#fff", fontSize: "20px", marginBottom: "10px" }}>Score: {score}</p>
        <p style={{ color: "#0ff", fontSize: "16px", marginBottom: "10px" }}>Level: {level}</p>
        <p style={{ color: "#888", fontSize: "14px", marginBottom: "30px" }}>Mode: {gameMode.toUpperCase()}</p>
        <div style={{ display: "flex", gap: "15px" }}>
          <button
            onClick={togglePause}
            style={{
              padding: "15px 40px",
              fontSize: "20px",
              backgroundColor: "#0f0",
              color: "#000",
              border: "none",
              cursor: "pointer",
              fontFamily: "monospace"
            }}
          >
            RESUME
          </button>
          <button
            onClick={goToMenu}
            style={{
              padding: "15px 40px",
              fontSize: "20px",
              backgroundColor: "#333",
              color: "#fff",
              border: "2px solid #666",
              cursor: "pointer",
              fontFamily: "monospace"
            }}
          >
            HOME
          </button>
        </div>
      </div>
    );
  }

  if (phase === "gameOver") {
    return (
      <div style={{ 
        minHeight: "100vh", 
        backgroundColor: "#000", 
        display: "flex", 
        flexDirection: "column",
        alignItems: "center", 
        justifyContent: "center",
        fontFamily: "monospace"
      }}>
        <h1 style={{ color: "#f00", fontSize: "48px", marginBottom: "20px" }}>GAME OVER</h1>
        <p style={{ color: "#fff", fontSize: "24px", marginBottom: "10px" }}>Score: {score}</p>
        <p style={{ color: "#0ff", fontSize: "18px", marginBottom: "10px" }}>Level: {level}</p>
        <p style={{ color: "#888", fontSize: "14px", marginBottom: "10px" }}>Mode: {gameMode.toUpperCase()}</p>
        {gameMode === "rewind" && rewindCount > 0 && (
          <p style={{ color: "#f0f", fontSize: "14px", marginBottom: "10px" }}>Rewinds used: {rewindCount}</p>
        )}
        {score >= highScore && score > 0 && (
          <p style={{ color: "#ff0", marginBottom: "10px" }}>NEW HIGH SCORE!</p>
        )}
        <p style={{ color: "#888", marginBottom: "30px" }}>Best: {highScore}</p>
        <div style={{ display: "flex", gap: "15px" }}>
          <button
            onClick={startGame}
            style={{
              padding: "15px 40px",
              fontSize: "20px",
              backgroundColor: "#0f0",
              color: "#000",
              border: "none",
              cursor: "pointer",
              fontFamily: "monospace"
            }}
          >
            AGAIN
          </button>
          <button
            onClick={goToMenu}
            style={{
              padding: "15px 40px",
              fontSize: "20px",
              backgroundColor: "#333",
              color: "#fff",
              border: "2px solid #666",
              cursor: "pointer",
              fontFamily: "monospace"
            }}
          >
            HOME
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "#000", 
      display: "flex", 
      flexDirection: "column",
      alignItems: "center", 
      justifyContent: "center",
      fontFamily: "monospace"
    }}>
      <div style={{ display: "flex", gap: "20px", marginBottom: "5px", flexWrap: "wrap", justifyContent: "center" }}>
        <p style={{ color: "#0f0", fontSize: "18px" }}>Score: {score}</p>
        <p style={{ color: "#0ff", fontSize: "18px" }}>Lvl: {level}</p>
        <p style={{ color: "#888", fontSize: "18px" }}>{gameMode.toUpperCase()}</p>
        {activePowerUp === "slow" && (
          <p style={{ color: "#00f", fontSize: "18px" }}>SLOW</p>
        )}
        {gameMode === "rewind" && ghosts.length > 0 && (
          <p style={{ color: "#f0f", fontSize: "18px" }}>Ghosts: {ghosts.length}</p>
        )}
      </div>

      {gameMode === "swapper" && (
        <p style={{ color: "#f00", fontSize: "14px", marginBottom: "5px" }}>
          You are the RED food! Dodge the snake!
        </p>
      )}

      <div
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
          backgroundColor: "#111",
          border: `2px solid ${gameMode === "swapper" ? "#f00" : gameMode === "rewind" ? "#f0f" : wrapMode ? "#0ff" : "#0f0"}`,
          position: "relative",
        }}
      >
        {/* Obstacles (gray) */}
        {obstacles.map((obs, index) => (
          <div
            key={`obs-${index}`}
            style={{
              position: "absolute",
              left: obs.x * CELL_SIZE,
              top: obs.y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
              backgroundColor: "#666",
            }}
          />
        ))}

        {/* Walls from walls mode (darker gray) */}
        {walls.map((wall, index) => (
          <div
            key={`wall-${index}`}
            style={{
              position: "absolute",
              left: wall.x * CELL_SIZE,
              top: wall.y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
              backgroundColor: "#444",
            }}
          />
        ))}

        {/* Portals */}
        {portal && (
          <>
            <div
              style={{
                position: "absolute",
                left: portal.entry.x * CELL_SIZE + 2,
                top: portal.entry.y * CELL_SIZE + 2,
                width: CELL_SIZE - 4,
                height: CELL_SIZE - 4,
                backgroundColor: "#f0f",
                borderRadius: "50%",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: portal.exit.x * CELL_SIZE + 2,
                top: portal.exit.y * CELL_SIZE + 2,
                width: CELL_SIZE - 4,
                height: CELL_SIZE - 4,
                backgroundColor: "#f0f",
                borderRadius: "50%",
              }}
            />
          </>
        )}

        {/* Ghost snakes (rewind mode) - show current position along their path */}
        {ghosts.map((ghost, gIndex) => {
          const ghostPos = ghost.path[ghost.currentIndex];
          if (!ghostPos) return null;
          return (
            <div
              key={`ghost-${gIndex}`}
              style={{
                position: "absolute",
                left: ghostPos.x * CELL_SIZE + 2,
                top: ghostPos.y * CELL_SIZE + 2,
                width: CELL_SIZE - 4,
                height: CELL_SIZE - 4,
                backgroundColor: "#f0f",
                opacity: 0.7,
                borderRadius: "2px",
              }}
            />
          );
        })}

        {/* Snake */}
        {snake.map((segment, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              left: segment.x * CELL_SIZE,
              top: segment.y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
              backgroundColor: gameMode === "swapper" 
                ? (index === 0 ? "#f80" : "#a50") 
                : (index === 0 ? "#0f0" : "#0a0"),
            }}
          />
        ))}

        {/* Food */}
        <div
          style={{
            position: "absolute",
            left: food.x * CELL_SIZE,
            top: food.y * CELL_SIZE,
            width: CELL_SIZE,
            height: CELL_SIZE,
            backgroundColor: "#f00",
            boxShadow: gameMode === "swapper" ? "0 0 10px #f00" : "none",
          }}
        />

        {/* Power-ups */}
        {powerUp && (
          <div
            style={{
              position: "absolute",
              left: powerUp.position.x * CELL_SIZE,
              top: powerUp.position.y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
              backgroundColor: powerUp.type === "bonus" ? "#ff0" : "#00f",
            }}
          />
        )}
      </div>

      <p style={{ color: "#888", fontSize: "12px", marginTop: "10px" }}>
        P to pause
      </p>
    </div>
  );
}
