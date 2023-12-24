const WIDTH = 500;
const HEIGHT = 500;

const app = new PIXI.Application({
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: 0x1099bb,
    antialias: true,
});

// app.renderer.resize(window.innerWidth, window.innerHeight)
app.renderer.view.style.position = "absolute"
document.body.appendChild(app.view);



// Tile and grid settings
const gridWidth = 10;
const gridHeight = 10;
const tileSize = WIDTH/gridWidth;

// Create a character sprite
const characterTexture = PIXI.Texture.from('sample.png');
const character = new PIXI.Sprite(characterTexture);
character.width = character.height = tileSize*1.5; // Half the size of a tile
character.anchor.set(0.5);

// Initial character position
let characterTileX = 0;
let characterTileY = 0;
character.x = characterTileX * tileSize + tileSize / 2;
character.y = characterTileY * tileSize + tileSize / 2;



const farmTexture = PIXI.Texture.from('farm.png'); // Replace with your farm image path
const waterTexture = PIXI.Texture.from('water.png'); // Replace with your water image path
const pipeTexture = PIXI.Texture.from('pipes.png'); // Update with the correct path

function layPipes(startX, startY, endX, endY) {
    // Assume the cornerPipeTexture has been loaded similarly to the horizontalPipeTexture
    const cornerPipeTexture = new PIXI.Texture(pipeTexture.baseTexture, new PIXI.Rectangle(251,301,131,121));
    const horizontalPipeTexture = new PIXI.Texture(pipeTexture.baseTexture, new PIXI.Rectangle(432,102,97,200));
    

    let x = startX;
    let y = startY;
    let pipeTile;

    // Lay horizontal pipes first, then vertical
    while (x !== endX) {
        pipeTile = new PIXI.Sprite(horizontalPipeTexture);
        pipeTile.rotation = Math.PI / 2;
        pipeTile.width = tileSize;
        pipeTile.height = tileSize;
        pipeTile.x = x * tileSize;
        pipeTile.y = y * tileSize;
        app.stage.addChild(pipeTile);
        x += (x < endX) ? 1 : -1;
    }

    // If there's a turn, add a corner sprite
    if (startY !== endY) {
        pipeTile = new PIXI.Sprite(cornerPipeTexture);
        pipeTile.width = tileSize;
        pipeTile.height = tileSize;
        // The corner is at the end of the horizontal pipes and the start of the vertical
        pipeTile.x = (x - 1) * tileSize;
        pipeTile.y = y * tileSize;
        // Rotate the corner pipe sprite if necessary
        // if (startX < endX && startY < endY) {
        //     pipeTile.rotation = Math.PI / 2; // 90 degrees
        // } else if (startX > endX && startY < endY) {
        //     pipeTile.rotation = Math.PI; // 180 degrees
        // } else if (startX > endX && startY > endY) {
        //     pipeTile.rotation = -Math.PI / 2; // -90 degrees
        // }
        // Other cases for rotation as needed
        app.stage.addChild(pipeTile);
    }

    // Lay vertical pipes
    while (y !== endY) {
        pipeTile = new PIXI.Sprite(horizontalPipeTexture);
        pipeTile.width = tileSize;
        pipeTile.height = tileSize;
        pipeTile.x = (x - 1) * tileSize; // Offset x by one tile to account for the corner
        pipeTile.y = y * tileSize;
        app.stage.addChild(pipeTile);
        y += (y < endY) ? 1 : -1;
    }
}


// Example farm coordinates
const farms = [
    { start: [0, 0], end: [2, 2] },
    // Add more farms as needed
];

const waterReservoir = {
    start: [5, 5], // Starting coordinate (x, y)
    width: 3,      // Width in tiles
    height: 2      // Height in tiles
};

function isFarmTile(x, y) {
    for (let farm of farms) {
        if (x >= farm.start[0] && x <= farm.end[0] && y >= farm.start[1] && y <= farm.end[1]) {
            return true;
        }
    }
    return false;
}

function isWaterTile(x, y) {
    return x >= waterReservoir.start[0] && x < waterReservoir.start[0] + waterReservoir.width &&
           y >= waterReservoir.start[1] && y < waterReservoir.start[1] + waterReservoir.height;
}

for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
        let tile;
        if (isFarmTile(x, y)) {
            // Farm tile
            tile = new PIXI.Graphics();
            tile.beginFill(0x663d14); // Regular tile color
            tile.drawRect(0, 0, tileSize, tileSize);
            tile.endFill();
        } else if (isWaterTile(x, y)) {
            // Water reservoir tile
            tile = new PIXI.Sprite(waterTexture);
        } else {
            // Regular tile
            tile = new PIXI.Sprite(farmTexture);
        }
        tile.width = tileSize;
        tile.height = tileSize;
        tile.x = x * tileSize;
        tile.y = y * tileSize;
        app.stage.addChild(tile);
    }
}

// Example usage
farms.forEach(farm => {
    // Simplified connection logic
    let farmCenterX = farm.start[0] + Math.floor((farm.end[0] - farm.start[0]) / 2);
    let farmCenterY = farm.start[1] + Math.floor((farm.end[1] - farm.start[1]) / 2);
    let reservoirCenterX = waterReservoir.start[0] + Math.floor(waterReservoir.width / 2);
    let reservoirCenterY = waterReservoir.start[1] + Math.floor(waterReservoir.height / 2);

    layPipes(farmCenterX, farmCenterY, reservoirCenterX, reservoirCenterY);
});

app.stage.addChild(character);

// Handle arrow key movements
window.addEventListener("keydown", (e) => {
    let moved = false; // Flag to check if movement occurred

    switch(e.key) {
        case "ArrowUp": 
            characterTileY = Math.max(0, characterTileY - 1);
            character.rotation = 0; // Facing north (up), no rotation
            moved = true;
            break;
        case "ArrowDown": 
            characterTileY = Math.min(gridHeight - 1, characterTileY + 1);
            character.rotation = Math.PI; // Facing south (down), 180 degrees
            moved = true;
            break;
        case "ArrowLeft": 
            characterTileX = Math.max(0, characterTileX - 1);
            character.rotation = -Math.PI / 2; // Facing west (left), -90 degrees
            moved = true;
            break;
        case "ArrowRight": 
            characterTileX = Math.min(gridWidth - 1, characterTileX + 1);
            character.rotation = Math.PI / 2; // Facing east (right), 90 degrees
            moved = true;
            break;
    }

    if (moved) {
        // Update character position
        character.x = characterTileX * tileSize + tileSize / 2;
        character.y = characterTileY * tileSize + tileSize / 2;
    }
});
