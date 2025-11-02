// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameRunning = false;
let gamePaused = false;
let score = 0;
let highScore = localStorage.getItem('spaceInvadersHighScore') || 0;
let lives = 3;
let level = 1;

// Player
let player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    width: 50,
    height: 40,
    speed: 5,
    color: '#00ff00'
};

// Bullets
let bullets = [];
const bulletSpeed = 7;
const bulletWidth = 4;
const bulletHeight = 15;

// Invaders
let invaders = [];
let invaderSpeed = 1;
let invaderDirection = 1;
let invaderDropDistance = 20;

// Enemy bullets
let enemyBullets = [];
const enemyBulletSpeed = 3;
const enemyShootChance = 0.001;

// Shields
let shields = [];

// Input
let keys = {};

// DOM elements
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const livesElement = document.getElementById('lives');
const levelElement = document.getElementById('level');
const messageBox = document.getElementById('message');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const backBtn = document.getElementById('backBtn');
const gameOverModal = document.getElementById('gameOverModal');
const finalScore = document.getElementById('finalScore');
const finalLevel = document.getElementById('finalLevel');
const finalHighScore = document.getElementById('finalHighScore');
const playAgainBtn = document.getElementById('playAgainBtn');

// Initialize game
function initGame() {
    score = 0;
    lives = 3;
    level = 1;
    invaderSpeed = 1;
    
    player.x = canvas.width / 2 - 25;
    bullets = [];
    enemyBullets = [];
    
    createInvaders();
    createShields();
    updateDisplay();
    showMessage('Defend Earth! Destroy all invaders!');
}

// Create invaders
function createInvaders() {
    invaders = [];
    const rows = 5;
    const cols = 11;
    const invaderWidth = 40;
    const invaderHeight = 30;
    const padding = 10;
    const offsetX = 80;
    const offsetY = 50;
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            invaders.push({
                x: offsetX + col * (invaderWidth + padding),
                y: offsetY + row * (invaderHeight + padding),
                width: invaderWidth,
                height: invaderHeight,
                alive: true,
                type: row < 1 ? 3 : row < 3 ? 2 : 1, // Different types for different rows
                points: row < 1 ? 30 : row < 3 ? 20 : 10
            });
        }
    }
}

// Create shields
function createShields() {
    shields = [];
    const shieldWidth = 80;
    const shieldHeight = 60;
    const shieldY = canvas.height - 150;
    const spacing = (canvas.width - 4 * shieldWidth) / 5;
    
    for (let i = 0; i < 4; i++) {
        const shieldX = spacing + i * (shieldWidth + spacing);
        
        // Create shield blocks
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 4; col++) {
                shields.push({
                    x: shieldX + col * 20,
                    y: shieldY + row * 20,
                    width: 20,
                    height: 20,
                    health: 3
                });
            }
        }
    }
}

// Update display
function updateDisplay() {
    scoreElement.textContent = score;
    highScoreElement.textContent = highScore;
    livesElement.textContent = lives;
    levelElement.textContent = level;
}

// Show message
function showMessage(msg) {
    messageBox.textContent = msg;
}

// Start game
function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        gamePaused = false;
        initGame();
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        gameLoop();
    }
}

// Pause game
function pauseGame() {
    gamePaused = !gamePaused;
    pauseBtn.textContent = gamePaused ? 'Resume' : 'Pause';
    showMessage(gamePaused ? 'Game Paused' : 'Game Resumed');
}

// Game loop
function gameLoop() {
    if (!gameRunning) return;
    
    if (!gamePaused) {
        update();
        draw();
    }
    
    requestAnimationFrame(gameLoop);
}

// Update game state
function update() {
    // Move player
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
    
    // Move bullets
    bullets = bullets.filter(bullet => {
        bullet.y -= bulletSpeed;
        return bullet.y > 0;
    });
    
    // Move enemy bullets
    enemyBullets = enemyBullets.filter(bullet => {
        bullet.y += enemyBulletSpeed;
        return bullet.y < canvas.height;
    });
    
    // Move invaders
    let hitEdge = false;
    invaders.forEach(invader => {
        if (!invader.alive) return;
        
        invader.x += invaderSpeed * invaderDirection;
        
        if (invader.x <= 0 || invader.x + invader.width >= canvas.width) {
            hitEdge = true;
        }
    });
    
    if (hitEdge) {
        invaderDirection *= -1;
        invaders.forEach(invader => {
            invader.y += invaderDropDistance;
        });
    }
    
    // Enemy shooting
    invaders.forEach(invader => {
        if (invader.alive && Math.random() < enemyShootChance) {
            enemyBullets.push({
                x: invader.x + invader.width / 2,
                y: invader.y + invader.height,
                width: bulletWidth,
                height: bulletHeight
            });
        }
    });
    
    // Check bullet collisions with invaders
    bullets.forEach((bullet, bulletIndex) => {
        invaders.forEach(invader => {
            if (invader.alive && 
                bullet.x < invader.x + invader.width &&
                bullet.x + bullet.width > invader.x &&
                bullet.y < invader.y + invader.height &&
                bullet.y + bullet.height > invader.y) {
                
                invader.alive = false;
                bullets.splice(bulletIndex, 1);
                score += invader.points;
                
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('spaceInvadersHighScore', highScore);
                }
                
                updateDisplay();
            }
        });
    });
    
    // Check bullet collisions with shields
    [...bullets, ...enemyBullets].forEach((bullet, bulletIndex, bulletArray) => {
        shields.forEach((shield, shieldIndex) => {
            if (shield.health > 0 &&
                bullet.x < shield.x + shield.width &&
                bullet.x + bullet.width > shield.x &&
                bullet.y < shield.y + shield.height &&
                bullet.y + bullet.height > shield.y) {
                
                shield.health--;
                bulletArray.splice(bulletIndex, 1);
            }
        });
    });
    
    // Check enemy bullet collisions with player
    enemyBullets.forEach((bullet, bulletIndex) => {
        if (bullet.x < player.x + player.width &&
            bullet.x + bullet.width > player.x &&
            bullet.y < player.y + player.height &&
            bullet.y + bullet.height > player.y) {
            
            enemyBullets.splice(bulletIndex, 1);
            lives--;
            updateDisplay();
            
            if (lives <= 0) {
                endGame();
            } else {
                showMessage(`Hit! ${lives} lives remaining`);
            }
        }
    });
    
    // Check if invaders reached bottom
    invaders.forEach(invader => {
        if (invader.alive && invader.y + invader.height >= player.y) {
            lives = 0;
            endGame();
        }
    });
    
    // Check if all invaders destroyed
    const aliveInvaders = invaders.filter(inv => inv.alive);
    if (aliveInvaders.length === 0) {
        nextLevel();
    }
}

// Draw game
function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars background
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 50; i++) {
        const x = (i * 137) % canvas.width;
        const y = (i * 197) % canvas.height;
        ctx.fillRect(x, y, 2, 2);
    }

    // Draw player
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();

    // Draw player cannon
    ctx.fillRect(player.x + player.width / 2 - 3, player.y + 10, 6, 20);

    // Draw bullets
    ctx.fillStyle = '#00ff00';
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // Draw enemy bullets
    ctx.fillStyle = '#ff0000';
    enemyBullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // Draw invaders
    invaders.forEach(invader => {
        if (!invader.alive) return;

        // Different colors for different types
        if (invader.type === 3) {
            ctx.fillStyle = '#ff00ff';
        } else if (invader.type === 2) {
            ctx.fillStyle = '#00ffff';
        } else {
            ctx.fillStyle = '#ffff00';
        }

        // Draw invader body
        ctx.fillRect(invader.x + 5, invader.y, invader.width - 10, invader.height - 10);
        ctx.fillRect(invader.x, invader.y + 10, invader.width, invader.height - 20);

        // Draw invader eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(invader.x + 10, invader.y + 5, 8, 8);
        ctx.fillRect(invader.x + invader.width - 18, invader.y + 5, 8, 8);

        // Draw invader legs
        ctx.fillStyle = invader.type === 3 ? '#ff00ff' : invader.type === 2 ? '#00ffff' : '#ffff00';
        ctx.fillRect(invader.x + 5, invader.y + invader.height - 10, 8, 10);
        ctx.fillRect(invader.x + invader.width - 13, invader.y + invader.height - 10, 8, 10);
    });

    // Draw shields
    shields.forEach(shield => {
        if (shield.health > 0) {
            ctx.fillStyle = shield.health === 3 ? '#00ff00' : shield.health === 2 ? '#ffff00' : '#ff0000';
            ctx.fillRect(shield.x, shield.y, shield.width, shield.height);
        }
    });
}

// Next level
function nextLevel() {
    level++;
    invaderSpeed += 0.5;
    updateDisplay();
    createInvaders();
    bullets = [];
    enemyBullets = [];
    showMessage(`Level ${level}! Invaders are faster!`);
}

// End game
function endGame() {
    gameRunning = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;

    finalScore.textContent = score;
    finalLevel.textContent = level;
    finalHighScore.textContent = highScore;

    gameOverModal.classList.remove('hidden');
}

// Shoot bullet
function shoot() {
    if (gameRunning && !gamePaused) {
        bullets.push({
            x: player.x + player.width / 2 - bulletWidth / 2,
            y: player.y,
            width: bulletWidth,
            height: bulletHeight
        });
    }
}

// Event listeners
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', pauseGame);
playAgainBtn.addEventListener('click', () => {
    gameOverModal.classList.add('hidden');
    startGame();
});
backBtn.addEventListener('click', () => window.location.href = '../index.html');

// Keyboard controls
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    if (e.key === ' ') {
        e.preventDefault();
        shoot();
    }

    if (e.key === 'p' || e.key === 'P') {
        if (gameRunning) {
            pauseGame();
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Initialize display
highScoreElement.textContent = highScore;
showMessage('Press Start Game to begin!');


