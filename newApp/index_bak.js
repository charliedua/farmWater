const app = new PIXI.Application({ width: 800, height: 600 });
document.body.appendChild(app.view);

const loader = new PIXI.Loader();
loader.add('farmTexture', 'farm.png');
loader.add('waterTankTexture', 'water.png');
loader.load(setup);

function setup(loader, resources) {
    const farms = [];
    const waterTanks = [];

    for (let i = 0; i < 5; i++) {
        const farm = new PIXI.Sprite(resources.farmTexture.texture);
        farm.x = i * 120; // Adjust positioning as needed
        farms.push(farm);
        app.stage.addChild(farm);

        const waterTank = createWaterTank(resources.waterTankTexture.texture, i);
        waterTanks.push(waterTank);
        app.stage.addChild(waterTank);
    }

    // Fetch and set water levels
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            data.forEach((item, index) => {
                if (waterTanks[index]) {
                    setWaterLevel(waterTanks[index], item.waterLevel);
                }
            });
        });
}

function createWaterTank(texture, index) {
    const waterTank = new PIXI.Sprite(texture);
    waterTank.x = index * 120 + 60; // Adjust positioning
    waterTank.waterLevel = new PIXI.Graphics();
    waterTank.addChild(waterTank.waterLevel);
    return waterTank;
}

function setWaterLevel(waterTank, level) {
    waterTank.waterLevel.clear();
    waterTank.waterLevel.beginFill(0x0000ff); // Blue color for water
    waterTank.waterLevel.drawRect(0, 0, 50, level); // Adjust size as needed
    waterTank.waterLevel.endFill();
}
