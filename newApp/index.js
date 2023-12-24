datadiv = document.getElementById("data")

class Entity {
    update() {

    }
}

class Tank {
    constructor(capacity = 100) {
        this.capacity = capacity; //litre
        this.current_volume = 30; //litre
        this.temperature = 20;
    }

    addWater(water) {
        this.current_volume += water;

        if (this.current_volume > this.capacity)
            this.current_volume = this.capacity
    }

    calculateWaterEvaporation() {
        // Simple evaporation model: evaporation rate increases with temperature
        // This is a basic model and can be refined to be more accurate
        const evaporationRate = 0.001 * this.temperature; // Example calculation
        return Math.min(this.current_volume, evaporationRate);
    }

    removeWater(water) {
        if (this.current_volume >= water) {
            this.current_volume -= water;
            return water;
        }
        else {
            let result = this.current_volume;
            this.current_volume = 0;
            return result;
        }

    }

    update() {
        // Calculate and apply evaporation
        let evaporatedWater = this.calculateWaterEvaporation();
        this.current_volume -= evaporatedWater;
    }

    getPrintString() {
        let stats = this.getStats();
        return `${stats}<br />`;
    }

    getStats() {
        return `Tank contains ${this.current_volume}/${this.capacity} litres at ${this.temperature}°C`
    }
}

class Farm extends Entity {
    constructor() {
        super();

        // this.moisture = Math.random(); // between 0 and 1 (1 is 100%) 1Kg of soil has how much water%
        this.moisture = 0 // between 0 and 1 (1 is 100%) 1Kg of soil has how much water%
        this.waterOnTop = 12; // litres
        this.maxMoisture = 0.8;
        this.temperature = 20; // in degrees Celsius
    }

    absorb(moistureToAdd) {
        if (this.moisture < this.maxMoisture) {
            let possibleAbsorption = this.maxMoisture - this.moisture;
            let actualAbsorption = Math.min(possibleAbsorption, moistureToAdd);
            this.moisture += actualAbsorption;
            this.waterOnTop -= actualAbsorption;
            if (this.waterOnTop < 0) {
                this.waterOnTop = 0;
            }
        }
    }

    calculateWaterOnTopEvaporation() {
        // Simple evaporation model: evaporation rate increases with temperature
        // This is a basic model and can be refined to be more accurate
        const evaporationRate = 0.05 * this.temperature; // Example calculation
        return Math.min(this.waterOnTop, evaporationRate);
    }

    calculateMoistureEvaporation() {
        const baseEvaporationRate = 0.5; // Base evaporation rate per update
        const temperatureFactor = 0.02; // How much temperature affects evaporation
        return baseEvaporationRate + (this.temperature * temperatureFactor);
    }

    addWater(water) {
        this.waterOnTop += water;
    }

    update() {
        let moistureToAdd = this.waterOnTop / 1000; // Convert liters to a percentage
        this.absorb(moistureToAdd);

        // Calculate and apply evaporation
        let evaporatedWater = this.calculateWaterOnTopEvaporation();
        this.waterOnTop -= evaporatedWater;
        this.moisture -= this.calculateMoistureEvaporation() / 1000; // Adjust moisture level

        if (this.moisture < 0) this.moisture = 0;
        if (this.waterOnTop < 0) this.waterOnTop = 0;
    }

    getPrintString() {
        let stats = this.getStats();
        return `Moisture: ${stats.moisture}<br />` +
            `Water on Top: ${stats.waterOnTop} liters<br />` +
            `Temperature: ${stats.temperature}°C<br />` +
            `Evaporation Rate: ${stats.evaporationRate} liters/day<br />`;
    }

    setTemperature(newTemperature) {
        this.temperature = newTemperature;
    }

    getStats() {
        let evaporation = this.calculateWaterOnTopEvaporation();
        return {
            moisture: Math.round(this.moisture * 100) / 100,
            waterOnTop: Math.round(this.waterOnTop * 100) / 100,
            temperature: this.temperature,
            evaporationRate: evaporation
        };
    }
}

class Pipe {
    constructor(farm, tank, flowRate = 1) {
        this.farm = farm;
        this.tank = tank;
        this.flowRate = flowRate; // L/update
        this.lastFlow = 0;
    }

    update() {
        let waterFromTank = this.tank.removeWater(this.flowRate)
        this.lastFlow = waterFromTank;
        this.farm.addWater(waterFromTank)
    }

    getStats() {
        return "Flowing from Farm to Tank at " + this.lastFlow + "L/s";
    }

    getPrintString() {
        return "<b>Pipe</b><br />" + this.getStats();
    }
}


class Game {
    constructor(desiredFPS = 60) {
        this.farm = new Farm();
        this.tank = new Tank();
        this.pipe = new Pipe(this.farm, this.tank);
        this.isRunning = false;
        this.desiredFPS = desiredFPS;
        this.timePerFrame = 1000 / this.desiredFPS;
    }

    setup() {
        console.log("Setting up the farm...");
        document.getElementById("stop").addEventListener("click", () => this.stop());
        document.getElementById("start").addEventListener("click", () => this.start());
        document.getElementById("addWater").addEventListener("click", () => this.tank.addWater(100));
        this.updateChart = this.setUpChart();
    }

    start() {
        this.isRunning = true;
        this.loop();
        document.getElementById("stop").removeAttribute("disabled")
        document.getElementById("start").setAttribute("disabled", true)
        this.intervalID = setInterval(() => {
            let farmStats = this.farm.getStats();
            this.updateChart(farmStats);
        }, 100); // Update every second
    }

    loop() {
        if (!this.isRunning) {
            console.log("Game loop stopped.");
            return;
        }

        let startTime = performance.now();

        this.farm.update();
        this.tank.update();
        this.pipe.update();

        datadiv.innerHTML = this.farm.getPrintString() + this.tank.getPrintString() + this.pipe.getPrintString();
        // this.updateChart(this.farm.getStats());

        let endTime = performance.now();
        let frameTime = endTime - startTime;
        let delay = Math.max(0, this.timePerFrame - frameTime);

        setTimeout(() => this.loop(), delay);
    }

    stop() {
        document.getElementById("stop").setAttribute("disabled", true)
        document.getElementById("start").removeAttribute("disabled")
        console.log("Game loop stopped.");
        clearInterval(this.intervalID)
        this.isRunning = false;
    }

    setUpChart() {
        let chartData = {
            labels: [],
            datasets: [{
                label: 'Moisture',
                data: [],
                borderColor: 'blue',
                fill: false
            }, {
                label: 'waterOnTop',
                data: [],
                borderColor: 'red',
                fill: false
            }, {
                label: 'evaporationRate',
                data: [],
                borderColor: 'green',
                fill: false
            }]
        };

        let ctx = document.getElementById('farmStatsChart').getContext('2d');
        let farmStatsChart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                scales: {
                    y: { beginAtZero: true }
                },
                animation: false
            }
        });

        return (farmStats) => {
            let now = new Date();
            let timeLabel = now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds(); // Format time as HH:MM:SS

            // Add new data point
            chartData.labels.push(timeLabel);
            chartData.datasets[0].data.push(farmStats.moisture);
            chartData.datasets[1].data.push(farmStats.waterOnTop);
            chartData.datasets[2].data.push(farmStats.evaporationRate);

            // Keep only the last 10 seconds of data
            if (chartData.labels.length > 100) {
                chartData.labels.shift();
                chartData.datasets[0].data.shift();
                chartData.datasets[1].data.shift();
                chartData.datasets[2].data.shift();
            }

            farmStatsChart.update();
        };
    }
}

// Example usage:
let myGame = new Game(10); // Game targeting 15 FPS
myGame.setup();
myGame.start(); // Start the game loop