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
    static calculateEvaporation(
        currentVolume,
        temperature,
        timeDelta,
        evapRateAt20C
    ) {
        // Base evaporation rate at 20°C: evapRateAt20C liters per minute
        const baseTemperature = 20; // Baseline temperature in °C
        const evaporationRatePerMinuteAtBaseTemp = evapRateAt20C; // Liters per minute at 20°C
        const evaporationRatePerSecondAtBaseTemp =
            evaporationRatePerMinuteAtBaseTemp / 60; // Convert to liters per second

        // Adjusting evaporation rate based on current temperature
        // Assuming linear relationship: increase/decrease by 5% per °C difference from base
        const temperatureCoefficient = 0.05 * (temperature - baseTemperature);
        const adjustedEvaporationRatePerSecond =
            evaporationRatePerSecondAtBaseTemp * (1 + temperatureCoefficient);

        // Calculate evaporation based on time delta (in milliseconds)
        const evaporationRate =
            (adjustedEvaporationRatePerSecond * timeDelta) / 1000; // Convert to liters per millisecond
        return Math.min(currentVolume, evaporationRate);
    }

    static calculateMoistureEvaporation(temperature, timeDelta) {
        const baseEvaporationRate = 0.05;
        const temperatureFactor = 0.01;
        const evaporationRatePerDay =
            baseEvaporationRate + temperature * temperatureFactor;
        const evaporationRate = evaporationRatePerDay * (timeDelta / 86400000);
        return evaporationRate;
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
            0.5
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
    #farm;
    #tank;
    #baseFlowRate; // Base flow rate at 20°C in liters per minute
    #lastFlow; // Amount of water flowed in the last update
    #temperatureCoefficient; // Percentage increase per degree Celsius
    #lastKnownTemperature; // Store the last known temperature to calculate current flow rate

    constructor(farm, tank, baseFlowRate = 300, temperatureCoefficient = 0.01) {
        super();
        this.#farm = farm;
        this.#tank = tank;
        this.#baseFlowRate = baseFlowRate; // Set this to the desired flow rate in liters per minute
        this.#temperatureCoefficient = temperatureCoefficient; // 1% increase per degree Celsius
        this.#lastFlow = 0;
        this.#lastKnownTemperature = 20; // Initialize with a default value of 20°C
    }

    update(world, delta) {
        // Update the last known temperature
        this.#lastKnownTemperature = world.temperature;

        // Calculate the temperature difference from the base temperature of 20°C
        const temperatureDifference = world.temperature - 20;
        // Adjust the flow rate based on the current temperature
        const adjustedFlowRate =
            this.#baseFlowRate *
            (1 + this.#temperatureCoefficient * temperatureDifference);

        // Convert adjusted flow rate to liters per millisecond, then multiply by delta
        const flowRatePerMillisecond = adjustedFlowRate / 60000; // There are 60,000 milliseconds in a minute
        let waterToTransfer = flowRatePerMillisecond * delta;

        // Remove water from tank and add to farm based on the calculated water to transfer
        let waterFromTank = this.#tank.removeWater(waterToTransfer);
        this.#lastFlow = waterFromTank;
        this.#farm.addWater(waterFromTank);
    }

    getStats() {
        // Calculate the current flow rate based on the last known temperature
        const temperatureDifference = this.#lastKnownTemperature - 20;
        const currentFlowRate = this.#lastFlow > 0 ?
            this.#baseFlowRate *
            (1 + this.#temperatureCoefficient * temperatureDifference) : this.#lastFlow;

        return {
            baseFlowRate: this.#baseFlowRate,
            currentFlowRate: currentFlowRate,
            lastFlow: this.#lastFlow,
            temperature: this.#lastKnownTemperature,
        };
    }

    getPrintString() {
        // Calculate the current flow rate based on the last delta
        //   let currentFlowRate = (this.#lastFlow / this.#lastDelta) * 60000; // Convert back to liters per minute
        //   return `<b>Pipe</b><br />Flowing from Tank to Farm at ${currentFlowRate.toFixed(
        //     2
        //   )} L/min<br />`;
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
    

    createBarChart(canvasId, label, labels, max=10) {
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
            if (chart.data.labels.length > 100) chart.data.labels.shift();

            datas.forEach((data, index) => {
                chart.data.datasets[index].data.push(data)
                if(chart.data.datasets[index].data.length > 100) {
                    chart.data.datasets[index].data.shift(); // remove first element of dataset
                }
            });

        }

        chart.update();
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
            .addEventListener("click", () => this.#tank.addWater(0.2));
        
        this.setUpCharts();
    }

    start() {
        this.#isRunning = true;
        this.loop(10);
        document.getElementById("stop").removeAttribute("disabled");
        document.getElementById("start").setAttribute("disabled", true);
        this.#intervalID = setInterval(() => {
            this.updateCharts();
            this.updateStatsTable();
        }, 200);
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
                <tr><td>Last Flow</td><td>${pipeStats.lastFlow.toFixed(
                2
            )} L</td></tr>
                <tr><td>Temperature</td><td>${pipeStats.temperature}°C</td></tr>
            </table>
        </div>
    `;

        document.getElementById("statsTable").innerHTML = html;
    }

    setUpCharts() {
        this.chartManager.createBarChart("farmStatsChart", "Farm Stats", ["Moisture", "Water on Top"]);
        this.chartManager.createBarChart("tankStatsChart", "Tank Stats", ["Current Volume"], this.#tank.getStats().capacity + 10);
        this.chartManager.createBarChart("pipeStatsChart", "Pipe Stats", ["Last Flow", "Current Flow Rate"]);
        this.chartManager.createLineChart("lineChartCanvas", ["Temperature", "Moisture"]);
    }

    updateCharts() {
        let farmStats = this.#farm.getStats();
        this.chartManager.updateChartData("farmStatsChart", [farmStats.moisture, farmStats.waterOnTop]);

        let tankStats = this.#tank.getStats();
        this.chartManager.updateChartData("tankStatsChart", [tankStats.currentVolume]);

        let pipeStats = this.#pipe.getStats(this.#world);
        this.chartManager.updateChartData("pipeStatsChart", [pipeStats.lastFlow, pipeStats.currentFlowRate]);

        let currentTime = new Date().toLocaleTimeString();
        this.chartManager.addDataToLineChart("lineChartCanvas", currentTime, [this.#world.temperature, this.#farm.getStats().moisture]);
    }
}

// Example usage:
let myGame = new Game(10);
myGame.setup();
myGame.start();
