# Snake Game

## Overview
A classic Snake game built with React with advanced features. Guide the snake to eat food, grow longer, collect power-ups, and avoid obstacles!

## How to Play
- **Move**: Arrow keys or WASD
- **Pause**: P or Escape key
- **Objective**: Eat the red food to grow longer and earn points
- **Power-ups**: Gold = +50 bonus points, Blue = temporary slow mode
- **Levels**: Every 100 points = new level with obstacles (Classic mode)
- **Avoid**: Don't hit walls, obstacles, or your own tail!

## Game Modes
- **Classic**: Normal snake with levels and obstacles
- **Speed**: Fast gameplay, no power-ups
- **Infinite**: No walls - wrap around edges
- **Twin**: Snake reverses direction when eating
- **Portal**: Teleport between pink portals
- **Walls**: Eating food creates new walls
- **Swapper**: Control the food, dodge the AI snake
- **Rewind**: Death rewinds time, avoid your ghost selves

## Project Architecture

### Frontend (`client/src/`)
- `App.tsx` - Main app entry point
- `components/game/SnakeGame.tsx` - Complete game with menu, pause, gameplay, and game over screens

### State Management (`client/src/lib/stores/`)
- `useSnake.tsx` - Game state (snake, food, score, direction, phases, power-ups, obstacles, levels)
- `useAudio.tsx` - Audio state and controls

### Backend (`server/`)
- Express server serving the game client
- Static file serving for production builds

## Tech Stack
- React 18 with TypeScript
- Zustand for state management
- Inline CSS for retro styling
- Vite for development and building

## Recent Changes
- January 8, 2026: Added Swapper mode (control food, dodge AI snake) and Rewind mode (death rewinds time, ghosts retrace path)
- December 8, 2025: Added advanced features - pause, power-ups, levels with obstacles, wrap mode
- December 4, 2025: Changed to simple 2D Snake game
