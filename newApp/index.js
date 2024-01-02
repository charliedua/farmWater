class Entity {
    // Define common methods or properties if any
    getPrintString() {
        // Default implementation (can be overridden)
        return "Entity State";
    }

    update() {
        // Default implementation (can be overridden)
    }
}


class EvaporationUtils {
    /**
     * Calculates evaporation based on volume, temperature, time, and base evaporation rate.
     * @param {number} currentVolume - Current volume of water.
     * @param {number} temperature - Current temperature in °C.
     * @param {number} timeDelta - Time delta in milliseconds.
     * @param {number} evapRateAt20C - Evaporation rate at 20°C in liters per minute.
     * @returns {number} Evaporated water volume.
     */
    static calculateEvaporation(currentVolume, temperature, timeDelta, evapRateAt20C) {
        const baseTemperature = 20;
        const evaporationRatePerMinuteAtBaseTemp = evapRateAt20C;
        const evaporationRatePerSecondAtBaseTemp = evaporationRatePerMinuteAtBaseTemp / 60;

        // Adjusting evaporation rate based on temperature
        let temperatureCoefficient = 0.05 * (temperature - baseTemperature);

        // Preventing negative or excessively high evaporation rates at extreme temperatures
        if (temperature < 0) {
            temperatureCoefficient = Math.max(temperatureCoefficient, -1); // Limiting the reduction to 100%
        }

        const adjustedEvaporationRatePerSecond = evaporationRatePerSecondAtBaseTemp * (1 + temperatureCoefficient);
        const evaporationRate = (adjustedEvaporationRatePerSecond * timeDelta) / 1000;

        return Math.min(currentVolume, Math.max(0, evaporationRate)); // Ensure evaporation is not negative
    }

    /**
     * Calculates moisture evaporation based on temperature and time.
     * @param {number} temperature - Current temperature in °C.
     * @param {number} timeDelta - Time delta in milliseconds.
     * @returns {number} Moisture evaporated.
     */
    static calculateMoistureEvaporation(temperature, timeDelta) {
        const baseEvaporationRate = 0.05;
        const temperatureFactor = 0.01;
        const evaporationRatePerDay = baseEvaporationRate + temperature * temperatureFactor;

        // Handle negative temperature
        const adjustedEvaporationRatePerDay = temperature < 0 ? baseEvaporationRate : evaporationRatePerDay;

        const evaporationRate = adjustedEvaporationRatePerDay * (timeDelta / 86400000);
        return Math.max(0, evaporationRate); // Ensure evaporation is not negative
    }
}


class WorldState {
    temperature = 20;

    setTemperature(newTemperature) {
        this.temperature = newTemperature;
    }
}

class Tank extends Entity {
    #capacity;
    #currentVolume;

    constructor(capacity = 100) {
        super();
        this.#capacity = capacity;
        this.#currentVolume = 0;
    }

    addWater(water) {
        this.#currentVolume += water;
        if (this.#currentVolume > this.#capacity)
            this.#currentVolume = this.#capacity;
    }

    removeWater(water) {
        if (this.#currentVolume >= water) {
            this.#currentVolume -= water;
            return water;
        } else {
            let removedWater = this.#currentVolume;
            this.#currentVolume = 0;
            return removedWater;
        }
    }

    update(world, delta) {
        let evaporatedWater = EvaporationUtils.calculateEvaporation(
            world.temperature,
            this.#currentVolume,
            delta,
            0.5
        );
        this.#currentVolume -= evaporatedWater;
    }

    getStats() {
        return {
            capacity: this.#capacity,
            currentVolume: this.#currentVolume,
        };
    }

    getPrintString() {
        return `Tank contains ${this.#currentVolume}/${this.#capacity}<br />`;
    }
}

class Farm extends Entity {
    #moisture;
    #waterOnTop;
    #maxMoisture;

    constructor() {
        super();
        this.#moisture = 0;
        this.#waterOnTop = 0;
        this.#maxMoisture = 1;
    }

    absorb(moistureToAdd) {
        if (this.#moisture < this.#maxMoisture) {
            let possibleAbsorption = this.#maxMoisture - this.#moisture;
            let actualAbsorption = Math.min(possibleAbsorption, moistureToAdd);
            this.#moisture += actualAbsorption;
            this.#waterOnTop -= actualAbsorption;
            if (this.#waterOnTop < 0) {
                this.#waterOnTop = 0;
            }
        }
    }

    getStats() {
        return {
            moisture: this.#moisture,
            waterOnTop: this.#waterOnTop,
            maxMoisture: this.#maxMoisture,
        };
    }

    addWater(water) {
        this.#waterOnTop += water;
    }

    update(world, delta) {
        let moistureToAdd = this.#waterOnTop / 1000;
        this.absorb(moistureToAdd);

        let evaporatedWater = EvaporationUtils.calculateEvaporation(
            world.temperature,
            this.#waterOnTop,
            delta,
            2
        );
        this.#waterOnTop -= evaporatedWater;
        this.#moisture -=
            EvaporationUtils.calculateMoistureEvaporation(world.temperature, delta) /
            1000;
        // this.#moisture -= this.#calculateMoistureEvaporation() / 1000;

        if (this.#moisture < 0) this.#moisture = 0;
        if (this.#waterOnTop < 0) this.#waterOnTop = 0;
    }

    getPrintString() {
        return (
            `Moisture: ${this.#moisture.toFixed(2)}<br />` +
            `Water on Top: ${this.#waterOnTop.toFixed(2)} liters<br />`
        );
    }
}

class Pipe extends Entity {
    #farm; // Reference to the farm object
    #tank; // Reference to the tank object
    #baseFlowRate; // Base flow rate at 20°C in liters per minute
    #temperatureCoefficient; // Percentage increase per degree Celsius over 20°C
    #lastKnownTemperature; // Stores the last known temperature to calculate the flow rate
    #isFlowing; // Indicates if water is currently flowing through the pipe

    constructor(farm, tank, baseFlowRate = 3, temperatureCoefficient = 0.01) {
        super();
        this.#farm = farm;
        this.#tank = tank;
        this.#baseFlowRate = baseFlowRate;
        this.#temperatureCoefficient = temperatureCoefficient;
        this.#lastKnownTemperature = 20;
        this.#isFlowing = false; // Initially, there is no flow
    }

    setBaseFlow(flowRate){
        this.#baseFlowRate = flowRate;
    }

    update(world, delta) {
        this.#lastKnownTemperature = world.temperature;
        const temperatureDifference = this.#lastKnownTemperature - 20;
        const adjustedFlowRate = this.#baseFlowRate * (1 + this.#temperatureCoefficient * temperatureDifference);
        const flowRatePerMillisecond = adjustedFlowRate / 60000;

        let waterToTransfer = flowRatePerMillisecond * delta;
        let waterFromTank = this.#tank.removeWater(waterToTransfer);

        // Update the flowing status based on the water transferred
        this.#isFlowing = waterFromTank > 0;

        this.#farm.addWater(waterFromTank);
    }

    getStats() {
        // Calculate the current flow rate only if water is flowing
        let currentFlowRate = 0;
        if (this.#isFlowing) {
            const temperatureDifference = this.#lastKnownTemperature - 20;
            currentFlowRate = this.#baseFlowRate * (1 + this.#temperatureCoefficient * temperatureDifference);
        }

        return {
            baseFlowRate: this.#baseFlowRate,
            currentFlowRate: currentFlowRate,
            temperature: this.#lastKnownTemperature,
            isFlowing: this.#isFlowing, // Added to indicate if water is currently flowing
        };
    }
}



class ChartManager {
    constructor() {
        this.charts = {};
    }

    createLineChart(canvasId, labels, maxSize = 100) {
        let ctx = document.getElementById(canvasId).getContext("2d");
        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: labels[0],
                        data: [],
                        borderColor: 'rgb(75, 192, 192)',
                    },
                    {
                        label: labels[1],
                        data: [],
                        borderColor: 'rgb(75, 192, 255)',
                    },
                    {
                        label: labels[2],
                        data: [],
                        borderColor: 'rgb(123, 192, 255)',
                    },
                ]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    },
                    x: {
                        // This option allows the chart to discard old labels if it gets too wide.
                        // Adapted from Chart.js documentation, adjust accordingly if using another library.
                        ticks: {
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: maxSize // Limits the number of labels displayed
                        }
                    }
                },
                // This option is adapted from Chart.js to enable performance optimization.
                // If you are using another library, please check the corresponding documentation.
                animation: {
                    duration: 0 // General animation time
                },
                hover: {
                    animationDuration: 0 // Duration of animations when hovering an item
                },
                responsiveAnimationDuration: 0, // Animation duration after a resize
                elements: {
                    line: {
                        tension: 0.4 // Reduces the initial animation tension to make the chart draw faster
                    },
                    point:{
                        radius: 0 // Reduces the radius of the point to make the chart draw faster
                    }
                },
                maintainAspectRatio: false,
            }
        });
    }
    

    createBarChart(canvasId, label, labels, max=1.5) {
        let ctx = document.getElementById(canvasId).getContext("2d");
        this.charts[canvasId] = new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: new Array(labels.length).fill(0),
                    backgroundColor: labels.map(() => `hsl(${Math.random() * 360}, 50%, 50%)`)
                }],
            },
            options: {
                scales: {
                    y: { beginAtZero: true, max: max }
                },
                animation: false
            }
        });
    }

    updateChartData(canvasId, data) {
        let chart = this.charts[canvasId];
        if (chart) {
            chart.data.datasets[0].data = data;
            chart.update();
        }
    }

    addDataToLineChart(canvasId, label, datas) {
        let chart = this.charts[canvasId];
        if (chart) {
            chart.data.labels.push(label);
            if (chart.data.labels.length > 500) chart.data.labels.shift();

            datas.forEach((data, index) => {
                chart.data.datasets[index].data.push(data)
                if(chart.data.datasets[index].data.length > 500) {
                    chart.data.datasets[index].data.shift(); // remove first element of dataset
                }
            });

        }
    }

    updateLineChart(canvasId) {
        let chart = this.charts[canvasId];
        if (chart) {
            chart.update();
        }
    }
}

class Game {
    #farm;
    #tank;
    #pipe;
    #isRunning = false;
    #desiredFPS;
    #timePerFrame;
    #intervalID;
    #world;

    constructor(desiredFPS = 60) {
        this.#farm = new Farm();
        this.#tank = new Tank();
        this.#pipe = new Pipe(this.#farm, this.#tank);
        this.#isRunning = false;
        this.#desiredFPS = desiredFPS;
        this.#timePerFrame = 1000 / this.#desiredFPS;
        this.#world = new WorldState();
        this.chartManager = new ChartManager();
    }

    setup() {
        console.log("Setting up the farm...");

        document
            .getElementById("stop")
            .addEventListener("click", () => this.stop());
        document
            .getElementById("start")
            .addEventListener("click", () => this.start());
        document
            .getElementById("addWater")
            .addEventListener("click", () => this.#tank.addWater(Number(document.getElementById("waterToAdd").value)));

        document
            .getElementById('temperatureControl')
            .addEventListener('input', (e) => {
                this.#world.setTemperature(e.target.value);
            });
            
        document
            .getElementById('pipeFlowControl')
            .addEventListener('input', (e) => {
                this.#pipe.setBaseFlow(Number(e.target.value))
            });

        document
            .getElementById('waterToAdd')
            .addEventListener('input', (e) => {
                document.getElementById("waterValue").innerText = e.target.value + "L";
            });

        this.setUpCharts();
    }

    start() {
        this.#isRunning = true;
        this.loop(10);
        document.getElementById("stop").removeAttribute("disabled");
        document.getElementById("start").setAttribute("disabled", true);
        this.#intervalID = setInterval(() => {
            this.updateCharts();
            this.chartManager.updateLineChart("lineChartCanvas");
            this.updateStatsTable();
        }, 500);
    }

    loop(last_delay) {
        if (!this.#isRunning) {
            console.log("Game loop stopped.");
            return;
        }

        let startTime = performance.now();

        this.#farm.update(this.#world, last_delay);
        this.#tank.update(this.#world, last_delay);
        this.#pipe.update(this.#world, last_delay);

        const farmStats = this.#farm.getStats();
        const currentTime = new Date().toLocaleTimeString();
        this.chartManager.addDataToLineChart("lineChartCanvas", currentTime, [this.#world.temperature, farmStats.moisture, farmStats.waterOnTop]);

        let endTime = performance.now();
        let frameTime = endTime - startTime;
        let delay = Math.max(0, this.#timePerFrame - frameTime);

        setTimeout(() => this.loop(delay), delay);
    }

    stop() {
        document.getElementById("stop").setAttribute("disabled", true);
        document.getElementById("start").removeAttribute("disabled");
        console.log("Game loop stopped.");
        clearInterval(this.#intervalID);
        this.#isRunning = false;
    }

    updateStatsTable() {
        let farmStats = this.#farm.getStats();
        let tankStats = this.#tank.getStats();
        let pipeStats = this.#pipe.getStats(this.#world); // Pipe's getStats now requires the world state

        let html = `
        <div class="stats-container">
            <table class="stats-table">
                <tr><th>World</th><th>Stats</th></tr>
                <tr><td>Temperature</td><td>${this.#world.temperature
            }°C</td></tr>
            </table>

            <table class="stats-table">
                <tr><th>Farm</th><th>Stats</th></tr>
                <tr><td>Moisture</td><td>${farmStats.moisture.toFixed(
                2
            )}</td></tr>
                <tr><td>Water on Top</td><td>${farmStats.waterOnTop.toFixed(
                2
            )} liters</td></tr>
            </table>

            <table class="stats-table">
                <tr><th>Tank</th><th>Stats</th></tr>
                <tr><td>Capacity</td><td>${tankStats.capacity} liters</td></tr>
                <tr><td>Current Volume</td><td>${tankStats.currentVolume.toFixed(
                2
            )} liters</td></tr>
            </table>

            <table class="stats-table">
                <tr><th>Pipe</th><th>Stats</th></tr>
                <tr><td>Base Flow Rate</td><td>${pipeStats.baseFlowRate.toFixed(
                2
            )} L/min</td></tr>
                <tr><td>Current Flow Rate</td><td>${pipeStats.currentFlowRate.toFixed(
                2
            )} L/min</td></tr>
                <tr><td>Flowing</td><td>${pipeStats.isFlowing ? "Yes" : "No"}</td></tr>
            </table>
        </div>
    `;

        document.getElementById("statsTable").innerHTML = html;
        
    }

    setUpCharts() {
        this.chartManager.createBarChart("farmStatsChart", "Farm Stats", ["Moisture"]);
        this.chartManager.createBarChart("tankStatsChart", "Tank Stats", ["Current Volume", "Water on Top"], this.#tank.getStats().capacity + 10);
        this.chartManager.createBarChart("pipeStatsChart", "Pipe Stats", ["Last Flow", "Current Flow Rate"]);
        this.chartManager.createLineChart("lineChartCanvas", ["Temperature", "Moisture", "Water on Top"]);
    }

    updateCharts() {
        let farmStats = this.#farm.getStats();
        this.chartManager.updateChartData("farmStatsChart", [farmStats.moisture]);

        let tankStats = this.#tank.getStats();
        this.chartManager.updateChartData("tankStatsChart", [tankStats.currentVolume, farmStats.waterOnTop]);

        let pipeStats = this.#pipe.getStats(this.#world);
        this.chartManager.updateChartData("pipeStatsChart", [pipeStats.lastFlow, pipeStats.currentFlowRate]);

        // let currentTime = new Date().toLocaleTimeString();
        // this.chartManager.addDataToLineChart("lineChartCanvas", currentTime, [this.#world.temperature, farmStats.moisture, farmStats.waterOnTop]);
    }
}

// Example usage:
let myGame = new Game(10);
myGame.setup();
myGame.start();
