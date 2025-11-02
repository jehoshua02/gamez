// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const SHIP_SIZE = 15;
const SHIP_THRUST = 0.15;
const SHIP_TURN_SPEED = 0.05;
const FRICTION = 0.98;
const BULLET_SPEED = 5;
const BULLET_LIFETIME = 60;
const ASTEROID_SPEED = 1;
const ASTEROID_SIZES = {
    large: 40,
    medium: 25,
    small: 15
};
const ASTEROID_POINTS = {
    large: 20,
    medium: 50,
    small: 100
};

// Game state
let ship = null;
let bullets = [];
let asteroids = [];
let score = 0;
let highScore = 0;
let lives = 3;
let gameActive = false;
let gameLoop = null;
let keys = {};
let invulnerable = false;
let invulnerableTime = 0;

// DOM elements
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const livesElement = document.getElementById('lives');
const finalScoreElement = document.getElementById('finalScore');
const bestScoreElement = document.getElementById('bestScore');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const backBtn = document.getElementById('backBtn');

// Load high score
function loadHighScore() {
    highScore = parseInt(localStorage.getItem('asteroidsHighScore')) || 0;
    highScoreElement.textContent = highScore;
}

// Save high score
function saveHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('asteroidsHighScore', highScore);
        highScoreElement.textContent = highScore;
    }
}

// Initialize ship
function createShip() {
    return {
        x: canvas.width / 2,
        y: canvas.height / 2,
        angle: -Math.PI / 2,
        velocityX: 0,
        velocityY: 0
    };
}

// Create asteroid
function createAsteroid(x, y, size) {
    const angle = Math.random() * Math.PI * 2;
    const speed = ASTEROID_SPEED * (size === 'large' ? 0.5 : size === 'medium' ? 0.75 : 1);
    
    return {
        x: x !== undefined ? x : Math.random() * canvas.width,
        y: y !== undefined ? y : Math.random() * canvas.height,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        size: size || 'large',
        radius: ASTEROID_SIZES[size || 'large'],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05
    };
}

// Initialize game
function initGame() {
    ship = createShip();
    bullets = [];
    asteroids = [];
    score = 0;
    lives = 3;
    invulnerable = false;
    invulnerableTime = 0;
    
    scoreElement.textContent = score;
    livesElement.textContent = lives;
    
    // Create initial asteroids
    for (let i = 0; i < 4; i++) {
        asteroids.push(createAsteroid());
    }
    
    gameActive = false;
}

// Start game
function startGame() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    initGame();
    gameActive = true;
    
    if (gameLoop) {
        cancelAnimationFrame(gameLoop);
    }
    gameLoop = requestAnimationFrame(update);
}

// Shoot bullet
function shoot() {
    if (!gameActive) return;
    
    bullets.push({
        x: ship.x + Math.cos(ship.angle) * SHIP_SIZE,
        y: ship.y + Math.sin(ship.angle) * SHIP_SIZE,
        velocityX: Math.cos(ship.angle) * BULLET_SPEED + ship.velocityX,
        velocityY: Math.sin(ship.angle) * BULLET_SPEED + ship.velocityY,
        lifetime: BULLET_LIFETIME
    });
}

// Update game
function update() {
    if (!gameActive) return;
    
    // Handle input
    if (keys['ArrowUp']) {
        ship.velocityX += Math.cos(ship.angle) * SHIP_THRUST;
        ship.velocityY += Math.sin(ship.angle) * SHIP_THRUST;
    }
    if (keys['ArrowLeft']) {
        ship.angle -= SHIP_TURN_SPEED;
    }
    if (keys['ArrowRight']) {
        ship.angle += SHIP_TURN_SPEED;
    }
    
    // Apply friction
    ship.velocityX *= FRICTION;
    ship.velocityY *= FRICTION;
    
    // Update ship position
    ship.x += ship.velocityX;
    ship.y += ship.velocityY;
    
    // Wrap ship around screen
    if (ship.x < 0) ship.x = canvas.width;
    if (ship.x > canvas.width) ship.x = 0;
    if (ship.y < 0) ship.y = canvas.height;
    if (ship.y > canvas.height) ship.y = 0;
    
    // Update invulnerability
    if (invulnerable) {
        invulnerableTime--;
        if (invulnerableTime <= 0) {
            invulnerable = false;
        }
    }
    
    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].x += bullets[i].velocityX;
        bullets[i].y += bullets[i].velocityY;
        bullets[i].lifetime--;
        
        // Wrap bullets
        if (bullets[i].x < 0) bullets[i].x = canvas.width;
        if (bullets[i].x > canvas.width) bullets[i].x = 0;
        if (bullets[i].y < 0) bullets[i].y = canvas.height;
        if (bullets[i].y > canvas.height) bullets[i].y = 0;
        
        // Remove expired bullets
        if (bullets[i].lifetime <= 0) {
            bullets.splice(i, 1);
        }
    }
    
    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
        asteroids[i].x += asteroids[i].velocityX;
        asteroids[i].y += asteroids[i].velocityY;
        asteroids[i].rotation += asteroids[i].rotationSpeed;
        
        // Wrap asteroids
        if (asteroids[i].x < 0) asteroids[i].x = canvas.width;
        if (asteroids[i].x > canvas.width) asteroids[i].x = 0;
        if (asteroids[i].y < 0) asteroids[i].y = canvas.height;
        if (asteroids[i].y > canvas.height) asteroids[i].y = 0;
    }
    
    // Check bullet-asteroid collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = asteroids.length - 1; j >= 0; j--) {
            const dx = bullets[i].x - asteroids[j].x;
            const dy = bullets[i].y - asteroids[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < asteroids[j].radius) {
                // Hit!
                score += ASTEROID_POINTS[asteroids[j].size];
                scoreElement.textContent = score;
                
                // Split asteroid
                const asteroid = asteroids[j];
                asteroids.splice(j, 1);
                
                if (asteroid.size === 'large') {
                    asteroids.push(createAsteroid(asteroid.x, asteroid.y, 'medium'));
                    asteroids.push(createAsteroid(asteroid.x, asteroid.y, 'medium'));
                } else if (asteroid.size === 'medium') {
                    asteroids.push(createAsteroid(asteroid.x, asteroid.y, 'small'));
                    asteroids.push(createAsteroid(asteroid.x, asteroid.y, 'small'));
                }
                
                bullets.splice(i, 1);
                break;
            }
        }
    }
    
    // Check ship-asteroid collisions
    if (!invulnerable) {
        for (let i = asteroids.length - 1; i >= 0; i--) {
            const dx = ship.x - asteroids[i].x;
            const dy = ship.y - asteroids[i].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < asteroids[i].radius + SHIP_SIZE) {
                // Hit!
                lives--;
                livesElement.textContent = lives;
                
                if (lives <= 0) {
                    endGame();
                    return;
                } else {
                    // Respawn ship
                    ship = createShip();
                    invulnerable = true;
                    invulnerableTime = 120; // 2 seconds at 60fps
                }
                break;
            }
        }
    }
    
    // Add more asteroids if all destroyed
    if (asteroids.length === 0) {
        for (let i = 0; i < 4; i++) {
            asteroids.push(createAsteroid());
        }
    }
    
    // Draw everything
    draw();
    
    gameLoop = requestAnimationFrame(update);
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars (simple background)
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 50; i++) {
        const x = (i * 137.5) % canvas.width;
        const y = (i * 217.3) % canvas.height;
        ctx.fillRect(x, y, 1, 1);
    }
    
    // Draw ship
    if (!invulnerable || Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.save();
        ctx.translate(ship.x, ship.y);
        ctx.rotate(ship.angle);
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(SHIP_SIZE, 0);
        ctx.lineTo(-SHIP_SIZE, -SHIP_SIZE / 2);
        ctx.lineTo(-SHIP_SIZE / 2, 0);
        ctx.lineTo(-SHIP_SIZE, SHIP_SIZE / 2);
        ctx.closePath();
        ctx.stroke();
        
        // Draw thrust
        if (keys['ArrowUp']) {
            ctx.strokeStyle = '#ff6600';
            ctx.beginPath();
            ctx.moveTo(-SHIP_SIZE / 2, -SHIP_SIZE / 4);
            ctx.lineTo(-SHIP_SIZE * 1.5, 0);
            ctx.lineTo(-SHIP_SIZE / 2, SHIP_SIZE / 4);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    // Draw bullets
    ctx.fillStyle = '#fff';
    bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw asteroids
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    asteroids.forEach(asteroid => {
        ctx.save();
        ctx.translate(asteroid.x, asteroid.y);
        ctx.rotate(asteroid.rotation);
        
        ctx.beginPath();
        const points = 8;
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const radius = asteroid.radius * (0.8 + Math.random() * 0.4);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.stroke();
        
        ctx.restore();
    });
}

// End game
function endGame() {
    gameActive = false;
    cancelAnimationFrame(gameLoop);
    saveHighScore();
    
    finalScoreElement.textContent = score;
    bestScoreElement.textContent = highScore;
    gameOverScreen.classList.remove('hidden');
}

// Event listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
backBtn.addEventListener('click', () => window.location.href = '../index.html');

// Keyboard controls
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        shoot();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Initialize on load
loadHighScore();
initGame();
draw();

