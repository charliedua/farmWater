// Alias for Matter.js namespaces
const Engine = Matter.Engine,
      Render = Matter.Render,
      World = Matter.World,
      Bodies = Matter.Bodies,
      Mouse = Matter.Mouse,
      MouseConstraint = Matter.MouseConstraint;

// Create an engine
const engine = Engine.create();

// Create a renderer
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: 800,
        height: 600,
        wireframes: false // Set to false for filled shapes
    }
});

// Add a ground (static rectangle)
const ground = Bodies.rectangle(400, 600, 810, 60, { isStatic: true });
World.add(engine.world, [ground]);

// Function to create a trapezoid shape
function createTrapezoid(x, y, bottomWidth, topWidth, height, options) {
    let path = [
        { x: x - bottomWidth / 2, y: y + height / 2 },
        { x: x + bottomWidth / 2, y: y + height / 2 },
        { x: x + topWidth / 2, y: y - height / 2 },
        { x: x - topWidth / 2, y: y - height / 2 }
    ];
    return Bodies.fromVertices(x, y, path, options);
}

function createOpenTopTrapezoid(x, y, bottomWidth, topWidth, height, options) {
    let path = [
        { x: x - bottomWidth / 2, y: y + height / 2 }, // Bottom left corner
        { x: x + bottomWidth / 2, y: y + height / 2 }, // Bottom right corner
        { x: x + topWidth / 2, y: y - height / 2 },    // Top right corner
        { x: x - topWidth / 2, y: y - height / 2 },    // Top left corner
        { x: x - bottomWidth / 2, y: y + height / 2 }  // Back to bottom left corner
    ];
    return Bodies.fromVertices(x, y, path, options, true); // The 'true' flag indicates the body is open (not closed)
}


// Add a trapezoid
const trapezoid = createOpenTopTrapezoid(400, 300, 300, 200, 100, { isStatic: true });
World.add(engine.world, [trapezoid]);

// Function to add water particles
function addWater(x, y, count) {
    for (let i = 0; i < count; i++) {
        let particle = Bodies.circle(x + Math.random() * 10 - 5, y + Math.random() * 10 - 5, 5, { restitution: 0.8, density: 0.001, friction: 0.01 });
        World.add(engine.world, particle);
    }
}

function createLiquid() {
    const x = 105;
    const y = 105;
    const radius = randomNumBetween(4, 5); // Smaller radius for finer particles
    const body = Bodies.circle(x, y, radius, {
        friction: 0.01, // Reduced friction
        density: 0.0005, // Reduced density
        frictionAir: 0.01, // Some air friction to slow down particles
        restitution: 0.5, // Adjusted restitution for a bit of bounce
        render: { fillStyle: '#03A9F4' } // Liquid color
    });

    // Apply a random force to simulate pouring
    Body.applyForce(body, body.position, {
        x: randomNumBetween(-0.005, 0.005), // Random horizontal force
        y: randomNumBetween(-0.002, 0.002) // Random vertical force
    });

    Composite.add(engine.world, body);
    circles.push(body);
}

// Add a mouse-controlled constraint
const mouse = Mouse.create(render.canvas),
      mouseConstraint = MouseConstraint.create(engine, {
          mouse: mouse,
          constraint: {
              stiffness: 0.2,
              render: { visible: false }
          }
      });
World.add(engine.world, mouseConstraint);

// Handle canvas clicks
render.canvas.addEventListener('mousedown', (event) => {
    const mouseX = event.clientX - render.canvas.offsetLeft;
    const mouseY = event.clientY - render.canvas.offsetTop;
    addWater(mouseX, mouseY, 20); // Add 20 particles at a time
});



// Run the engine and renderer
Matter.Runner.run(engine);
Render.run(render);
