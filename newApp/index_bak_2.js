class PixiGame {
    constructor() {
        // Initialize PIXI Application
        this.app = new PIXI.Application({
            width: 800,
            height: 600,
            backgroundColor: 0x1099bb
        });
        document.body.appendChild(this.app.view);

        // Start the setup
        this.setup();
    }

    setup() {
        // Setup your game objects here
        this.createTrapezoid();
        this.createWaterParticles();
        // this.circle = new PIXI.Graphics();
        // this.circle.beginFill(0xFF0000);
        // this.circle.drawCircle(0, 0, 50);
        // this.circle.endFill();
        // this.circle.x = 100;
        // this.circle.y = 100;
        // this.app.stage.addChild(this.circle);

        // Start the game loop
        this.app.ticker.add(delta => this.gameLoop(delta));

        this.setupInteractions();
    }

    setupInteractions() {
        this.trapezoid.on('pointerdown', (event) => {
            const clickPosition = event.data.global;
            this.addWaterParticleAt(clickPosition.x, clickPosition.y);
            console.log(clickPosition)
        });
        // Set up interactive behaviors for your game objects here
        // this.circle.interactive = true;
        // this.circle.buttonMode = true;
        // this.circle.on('pointerdown', this.onCircleClick.bind(this));
    }

    addWaterParticleAt(x, y) {
        // Create and add a new water particle at the specified position
        let particle = new WaterParticle(x, y);
        this.waterParticles.push(particle);
        this.app.stage.addChild(particle.sprite);
    }

    onCircleClick() {
        // Define what happens when the circle is clicked
        this.circle.scale.x *= 1.25;
        this.circle.scale.y *= 1.25;
    }

    createTrapezoid() {
        // Create the trapezoid shape
        this.trapezoid = new PIXI.Graphics();
        this.trapezoid.beginFill(0x0);
        this.trapezoid.drawPolygon([
            150, 100, // Top left
            650, 100, // Top right
            550, 300, // Bottom right
            250, 300  // Bottom left
        ]);
        this.trapezoid.endFill();
        this.trapezoid.interactive = true;
        this.trapezoid.buttonMode = true;

        // Add trapezoid and water to the stage
        this.app.stage.addChild(this.trapezoid);
    }

    createWaterParticles() {
        this.waterParticles = [];
        const waterArea = { startX: 250, startY: 150, width: 300, height: 150 };
        const numberOfParticles = 100;

        for (let i = 0; i < numberOfParticles; i++) {
            let x = waterArea.startX + Math.random() * waterArea.width;
            let y = waterArea.startY + Math.random() * waterArea.height;
            let particle = new WaterParticle(x, y);
            this.waterParticles.push(particle);
            this.app.stage.addChild(particle.sprite);
        }
    }

    gameLoop(delta) {
        const trapezoidPoints = [150, 100, 650, 100, 550, 300, 250, 300];
        this.waterParticles.forEach(particle => {
            particle.update();
            particle.checkCollisionWithTrapezoid(trapezoidPoints);
            particle.checkCollisionWithOtherParticles(this.waterParticles);
        });
    }
}

class WaterParticle {
    constructor(x, y) {
        this.sprite = new PIXI.Graphics();
        this.sprite.beginFill(0x0000FF); // Blue color for water
        this.sprite.drawCircle(0, 0, 5); // Small circle representing a water particle
        this.sprite.endFill();
        this.sprite.x = x;
        this.sprite.y = y;

        // Physics properties
        this.velocity = { x: 0, y: 0 };
        this.gravity = 0.5; // Adjust this value to change the gravity strength
    }

    update() {
        // Apply gravity
        this.velocity.y += this.gravity;

        // Update position based on velocity
        this.sprite.x += this.velocity.x;
        this.sprite.y += this.velocity.y;

        // Optional: Add collision detection with container boundaries
    }

    checkCollisionWithTrapezoid(trapezoid) {
        // Trapezoid points (clockwise from top left)
        const p1 = { x: trapezoid[0], y: trapezoid[1] };
        const p2 = { x: trapezoid[2], y: trapezoid[3] };
        const p3 = { x: trapezoid[4], y: trapezoid[5] };
        const p4 = { x: trapezoid[6], y: trapezoid[7] };

        // Particle properties
        const radius = 5;
        const particleCenter = { x: this.sprite.x, y: this.sprite.y };

        // Check collision with each edge and respond
        this.collideWithEdge(particleCenter, radius, p1, p2);
        this.collideWithEdge(particleCenter, radius, p2, p3);
        this.collideWithEdge(particleCenter, radius, p3, p4);
        this.collideWithEdge(particleCenter, radius, p4, p1);
    }


    collideWithEdge(particleCenter, radius, edgeStart, edgeEnd) {
        // Calculate edge vector
        const edge = { x: edgeEnd.x - edgeStart.x, y: edgeEnd.y - edgeStart.y };

        // Calculate normal vector for the edge (perpendicular)
        const normal = { x: -edge.y, y: edge.x };
        const magnitude = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
        const unitNormal = { x: normal.x / magnitude, y: normal.y / magnitude };

        // Calculate vector from edge start to particle center
        const fromStartToCenter = { x: particleCenter.x - edgeStart.x, y: particleCenter.y - edgeStart.y };

        // Project this vector onto the normal to get the distance from edge to particle center
        const distance = fromStartToCenter.x * unitNormal.x + fromStartToCenter.y * unitNormal.y;

        // Check if there is a collision (distance is less than radius)
        if (Math.abs(distance) < radius) {
            // Reflect velocity vector off the edge
            const dotProduct = this.velocity.x * unitNormal.x + this.velocity.y * unitNormal.y;
            this.velocity.x -= 2 * dotProduct * unitNormal.x;
            this.velocity.y -= 2 * dotProduct * unitNormal.y;

            // Adjust position to prevent sticking to the edge
            this.sprite.x += unitNormal.x * (radius - Math.abs(distance));
            this.sprite.y += unitNormal.y * (radius - Math.abs(distance));
        }
    }

    checkCollisionWithOtherParticles(particles) {
        const radius = 5; // Radius of the particle
        for (let other of particles) {
            if (other === this) continue;

            const dx = this.sprite.x - other.sprite.x;
            const dy = this.sprite.y - other.sprite.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < radius * 2) {
                // Calculate response velocities
                const vxTotal = 0 //this.velocity.x - other.velocity.x;
                const vyTotal = 0 //this.velocity.y - other.velocity.y;

                this.velocity.x = ((this.velocity.x * (radius - 1)) + (other.velocity.x * 2)) / (radius + 1);
                this.velocity.y = ((this.velocity.y * (radius - 1)) + (other.velocity.y * 2)) / (radius + 1);

                other.velocity.x = vxTotal + this.velocity.x;
                other.velocity.y = vyTotal + this.velocity.y;

                // Adjust positions to prevent particles from sticking together
                const overlap = (radius * 2 - distance) / 2;
                this.sprite.x += overlap * (dx / distance);
                this.sprite.y += overlap * (dy / distance);
            }
        }
    }
}


// Start the game
new PixiGame();
