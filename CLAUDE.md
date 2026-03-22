# CLAUDE.md — FarmWater Codebase Guide

This file provides context for AI assistants working on the **farmWater** repository.

---

## Project Overview

**FarmWater** is an interactive browser-based farm water management simulation. It models the relationship between a water storage tank, irrigation pipes, and farm soil moisture, with temperature-dependent physics (evaporation, absorption). The project has two parallel front-end implementations and is deployed via GitHub Pages.

---

## Repository Structure

```
farmWater/
├── .github/
│   └── workflows/
│       └── static.yml        # GitHub Pages deploy workflow (deploys ./newApp)
├── newApp/                   # PRIMARY application (deployed to GitHub Pages)
│   ├── index.html            # Main UI: sliders, stats tables, chart canvases
│   ├── index.js              # Core simulation logic (531 lines, vanilla JS)
│   ├── index_bak.js          # Backup: PIXI graphics with asset loader
│   ├── index_bak_2.js        # Backup: PixiGame class
│   ├── index_bak_3.js        # Backup version
│   ├── matter.js             # Bundled Matter.js physics engine (357KB)
│   ├── data.json             # Storage tank seed data (5 tanks with water levels)
│   ├── farm.png              # Farm tile texture
│   ├── water.png             # Water texture
│   └── droplet.png           # Water droplet texture
├── public/                   # Alternative PIXI.js 2D tile visualization
│   ├── index.html            # Simple PIXI.js canvas setup
│   ├── index.js              # Tile grid + character movement (191 lines)
│   ├── atlas.json            # Sprite atlas metadata (4 character frames)
│   ├── char.png              # Character sprite sheet (128x32, 4 frames)
│   ├── pipes.png             # Pipe texture atlas
│   └── sample.png            # Sample sprite
├── package.json              # Node.js project metadata and scripts
├── package-lock.json         # Dependency lock file
├── webpack.config.js         # Webpack config (entry: ./src/index.js → ./dist/bundle.js)
├── server.js                 # Minimal Node.js HTTP server (port 8080, serves newApp/)
└── README.md                 # Minimal readme (title only)
```

> **Note:** The backup files (`index_bak*.js`) are kept for reference. The canonical active code is `newApp/index.js`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Rendering | PIXI.js v7.3.2 (WebGL 2D) |
| Physics | Matter.js v0.19.0 |
| Charts | Chart.js (CDN) |
| Bundler | Webpack v5.89.0 |
| Dev server | http-server v14.1.1 |
| Language | Vanilla JavaScript (ES6+ classes) |
| Deployment | GitHub Pages (via GitHub Actions) |

---

## Core Architecture (`newApp/index.js`)

The simulation uses a simple entity-component pattern with a central game loop.

### Class Hierarchy

```
Entity (base)
├── Tank       — Water storage with capacity limits
├── Farm       — Soil moisture and absorption model
└── Pipe       — Water transfer from Tank → Farm

WorldState     — Global temperature setting
EvaporationUtils — Static methods for evaporation calculations
ChartManager   — Chart.js wrapper (line charts + bar charts)
Game           — Orchestrator: initializes entities, runs game loop, updates UI
```

### Key Classes

#### `Entity`
Abstract base class. All entities implement:
- `getPrintString()` — returns a display string of entity stats
- `update()` — called each game tick to advance simulation state

#### `WorldState`
Singleton-like object holding global simulation parameters.
- `temperature` defaults to 20°C
- `setTemperature(newTemperature)` — updates global temperature

#### `EvaporationUtils`
Static utility class for physics calculations.
- `calculateEvaporation(temperature)` — evaporation from tanks: `0.05 * (temperature - 20)` L/min delta
- `calculateMoistureEvaporation(temperature)` — moisture loss from farm soil

#### `Tank`
- Properties: `capacity`, `currentVolume` (private)
- Evaporation rate at 20°C: **0.5 L/min**
- Methods: `addWater(amount)`, `removeWater(amount)`, `update()`, `getStats()`

#### `Farm`
- Properties: `moisture`, `waterOnTop`, `maxMoisture` (default: 1 unit)
- Methods: `absorb()`, `addWater(amount)`, `update()`, `getStats()`
- Water on top absorbs into soil each tick; excess evaporates temperature-dependently

#### `Pipe`
- Properties: `baseFlowRate` (default: 3 L/min), `temperatureCoefficient` (0.01)
- Effective flow rate: `baseFlowRate * (1 + 0.01 * (temperature - 20))`
- Methods: `setBaseFlow(rate)`, `update()`, `getStats()`

#### `ChartManager`
- `createLineChart(canvasId, labels, datasets)` — creates a multi-line time series chart
- `createBarChart(canvasId, labels, data)` — creates a bar chart
- `addDataToLineChart(chart, newData)` — appends data points (max 500 retained)
- `updateChartData(chart, newData)` — replaces bar chart data

#### `Game`
- Runs at configurable FPS (default: **10 FPS**; capable of 60 FPS)
- Stats table refresh interval: **500ms**
- Initializes 4 Chart.js charts on `setUpCharts()`:
  1. `farmStatsChart` — Bar: soil moisture
  2. `tankStatsChart` — Bar: tank volume + water on top
  3. `pipeStatsChart` — Bar: pipe flow rates
  4. `lineChartCanvas` — Line: temperature, moisture, water-on-top over time

---

## Data Model

### `data.json` — Seed Data
```json
{
  "storage1": [
    { "id": 1, "waterLevel": 80 },
    { "id": 2, "waterLevel": 65 },
    { "id": 3, "waterLevel": 50 },
    { "id": 4, "waterLevel": 75 },
    { "id": 5, "waterLevel": 90 }
  ]
}
```
Five storage tanks with initial water levels (0–100 scale).

### `atlas.json` — Sprite Atlas
- 4 frames of 32×32 pixels: `character-front`, `character-back`, `character-left`, `character-right`
- Base texture: `char.png` (128×32 spritesheet)
- Format: TexturePacker

---

## UI Controls (`newApp/index.html`)

| Control | Type | Range | Default |
|---|---|---|---|
| START/STOP | Buttons | — | — |
| Temperature | Slider | 0–100°C | 20°C |
| Pipe Flow | Slider | 0–100 L/min | 3 L/min |
| Water To Add | Slider | 0–20L (step 0.1) | 5L |

---

## Public PIXI.js Visualization (`public/index.js`)

A separate experimental implementation using PIXI.js for tile-based rendering:
- 10×10 tile grid on a 500×500 canvas
- Farm tiles colored `0x663d14`
- Water reservoir at tile (5,5), 3×2 tiles
- Pipe-laying mechanic connecting farm to reservoir
- Character sprite with arrow-key movement and directional rotation (0°, 90°, 180°, −90°)

---

## Development Workflows

### Local Development

```bash
# Install dependencies
npm install

# Run local HTTP server (serves newApp/ on port 8080)
node server.js

# Or use the http-server CLI directly
npx http-server ./newApp -p 8080
```

### Build

```bash
npm run build   # Runs webpack (entry: ./src/index.js → ./dist/bundle.js)
```

> **Note:** The webpack entry `./src/index.js` does not yet exist. The build config is a placeholder for a future bundled version. Active development uses the non-bundled files in `newApp/`.

### Tests

No test framework is currently configured. The test script exits with an error:
```bash
npm test   # Returns: "Error: no test specified"
```

---

## Deployment

GitHub Actions workflow (`.github/workflows/static.yml`):
- Triggers on push to `main` branch
- Uploads `./newApp` directory as a GitHub Pages artifact
- No build step — files are served as-is

---

## Key Conventions

1. **Entity pattern:** All simulation objects extend `Entity` and implement `update()` and `getPrintString()`.
2. **Temperature physics:** All evaporation/flow calculations use `(temperature - 20)` as the delta from the baseline 20°C.
3. **Game loop rate:** Default 10 FPS for simulation; stats refresh at 500ms intervals independently.
4. **Chart data cap:** Line charts retain a maximum of 500 data points to avoid memory growth.
5. **No framework:** The `newApp` simulation is plain JavaScript — avoid adding framework dependencies unless intentional.
6. **Backup files:** Do not delete `index_bak*.js` files — they are intentional historical snapshots.
7. **Deployed directory:** Always edit `newApp/` for changes intended for production. The `public/` directory is an experimental sandbox.

---

## Known Limitations / Technical Debt

- `webpack.config.js` references `./src/index.js` which does not exist — bundling is non-functional.
- `server.js` serves only a single hardcoded file; it is not a full development server.
- No test suite.
- `matter.js` is checked in as a 357KB vendor file rather than managed via npm.
- The `public/` and `newApp/` directories are parallel implementations with duplicated effort and no shared code.
- README.md contains only a title with no documentation.
