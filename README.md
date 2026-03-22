# FarmWater

An interactive browser-based farm water management simulation that models water storage, irrigation, and soil moisture dynamics with temperature-dependent physics.

## What It Does

FarmWater simulates the lifecycle of water on a farm:

- A **water tank** stores water that evaporates faster at higher temperatures
- **Irrigation pipes** transfer water from the tank to the farm at a temperature-adjusted flow rate
- **Farm soil** absorbs surface water into moisture, which also evaporates over time
- Live **Chart.js charts** and stats tables update in real time as the simulation runs

The simulation runs at 10 FPS with stats refreshing every 500 ms, making it easy to observe how temperature changes affect the entire water system.

## Key Features

- Temperature-dependent physics for evaporation and flow rate
- Interactive sliders for temperature, pipe flow rate, and water volume to add
- Four live charts: farm moisture, tank volume, pipe flow, and a time-series line chart
- START/STOP controls for the simulation loop
- No build step required — runs directly in the browser

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)

### Installation

```bash
git clone <repository-url>
cd farmWater
npm install
```

### Running Locally

**Option 1 — Node.js server** (serves `newApp/index.html` on port 8080):

```bash
node server.js
```

Then open [http://localhost:8080](http://localhost:8080) in your browser.

**Option 2 — http-server CLI** (recommended for development; serves all static assets correctly):

```bash
npx http-server ./newApp -p 8080
```

> **Note:** `server.js` serves only the HTML file and does not resolve linked assets (JS, images). Use `http-server` for full functionality during development.

### Usage

Once the app is open in a browser:

| Control | Description |
|---|---|
| **START / STOP** | Start or pause the simulation loop |
| **Temperature slider** | Set ambient temperature (0–100 °C); affects evaporation and pipe flow |
| **Pipe Flow slider** | Set the pipe's base flow rate (0–100 L/min) |
| **Water slider + addWater** | Choose an amount (0–20 L) and click to fill the tank |

The stats tables and charts update automatically while the simulation is running.

## Project Structure

```
farmWater/
├── newApp/          # PRIMARY app — deployed to GitHub Pages
│   ├── index.html   # UI: sliders, stat tables, chart canvases
│   ├── index.js     # Simulation logic (Tank, Farm, Pipe, Game classes)
│   ├── data.json    # Seed data for storage tanks
│   └── matter.js    # Bundled Matter.js physics engine
├── public/          # Experimental PIXI.js tile-based visualization
├── server.js        # Minimal Node.js HTTP server (port 8080)
├── package.json
└── webpack.config.js
```

The `newApp/` directory is the canonical application and the only directory deployed to GitHub Pages. The `public/` directory is a separate experimental sandbox.

## Architecture Overview

The simulation uses a simple entity-component pattern:

```
Entity (base)
├── Tank    — Capacity-limited water storage with evaporation
├── Farm    — Soil moisture model with absorption and evaporation
└── Pipe    — Transfers water from Tank → Farm each tick

WorldState      — Holds global temperature
EvaporationUtils — Static physics calculations
ChartManager    — Chart.js wrapper for bar + line charts
Game            — Orchestrates entities, game loop, and UI updates
```

All temperature physics use `(temperature - 20)` as the delta from the 20 °C baseline.

## Deployment

Pushes to `main` automatically deploy `newApp/` to GitHub Pages via the workflow in [`.github/workflows/static.yml`](.github/workflows/static.yml). No build step is needed — files are served as-is.

## Tech Stack

| Concern | Technology |
|---|---|
| 2D rendering | PIXI.js v7.3.2 (CDN) |
| Physics engine | Matter.js v0.19.0 |
| Charts | Chart.js (CDN) |
| Language | Vanilla JavaScript (ES6+ classes) |
| Dev server | http-server v14.1.1 |
| Bundler | Webpack v5.89.0 (placeholder; not used by `newApp/`) |
| Deployment | GitHub Pages via GitHub Actions |

## Contributing

1. Fork the repository and create a feature branch
2. Make changes inside `newApp/` for production changes, or `public/` for experimental work
3. Test locally using `npx http-server ./newApp -p 8080`
4. Open a pull request against `main`

Do not delete the `index_bak*.js` files in `newApp/` — they are intentional historical snapshots.

## Known Limitations

- `webpack.config.js` references `./src/index.js` which does not exist; bundling is non-functional
- `server.js` serves only a single hardcoded HTML file, not full static assets
- No test suite is configured (`npm test` exits with an error)
- `matter.js` is checked in as a 357 KB vendor file rather than managed via npm
- `newApp/` and `public/` are parallel implementations with no shared code

## Getting Help

- Open an issue in the repository for bugs or feature requests
- Review [`CLAUDE.md`](CLAUDE.md) for a detailed architectural reference used by AI assistants
