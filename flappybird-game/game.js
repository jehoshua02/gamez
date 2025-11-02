// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const GRAVITY = 0.3;
const FLAP_STRENGTH = -6;
const PIPE_WIDTH = 60;
const PIPE_GAP = 220;
const PIPE_SPEED = 1.5;
const PIPE_SPACING = 150; // Frames between new pipes
const BIRD_SIZE = 30;

// Game state
let bird = {
    x: 80,
    y: canvas.height / 2,
    velocity: 0,
    radius: BIRD_SIZE / 2
};

let pipes = [];
let score = 0;
let highScore = 0;
let gameActive = false;
let gameLoop = null;
let frameCount = 0;

// DOM elements
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const finalScoreElement = document.getElementById('finalScore');
const bestScoreElement = document.getElementById('bestScore');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const backBtn = document.getElementById('backBtn');

// Load high score
function loadHighScore() {
    highScore = parseInt(localStorage.getItem('flappyBirdHighScore')) || 0;
    highScoreElement.textContent = highScore;
}

// Save high score
function saveHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyBirdHighScore', highScore);
        highScoreElement.textContent = highScore;
    }
}

// Initialize game
function initGame() {
    bird = {
        x: 80,
        y: canvas.height / 2,
        velocity: 0,
        radius: BIRD_SIZE / 2
    };
    pipes = [];
    score = 0;
    frameCount = 0;
    scoreElement.textContent = score;
    gameActive = false;
    
    // Add initial pipes
    addPipe();
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

// Add pipe
function addPipe() {
    const minHeight = 50;
    const maxHeight = canvas.height - PIPE_GAP - minHeight;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    
    pipes.push({
        x: canvas.width,
        topHeight: topHeight,
        bottomY: topHeight + PIPE_GAP,
        scored: false
    });
}

// Flap
function flap() {
    if (gameActive) {
        bird.velocity = FLAP_STRENGTH;
    }
}

// Update game
function update() {
    if (!gameActive) return;
    
    frameCount++;
    
    // Update bird
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;
    
    // Add new pipes
    if (frameCount % PIPE_SPACING === 0) {
        addPipe();
    }
    
    // Update pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= PIPE_SPEED;
        
        // Remove off-screen pipes
        if (pipes[i].x + PIPE_WIDTH < 0) {
            pipes.splice(i, 1);
            continue;
        }
        
        // Check for score
        if (!pipes[i].scored && pipes[i].x + PIPE_WIDTH < bird.x) {
            pipes[i].scored = true;
            score++;
            scoreElement.textContent = score;
        }
        
        // Check collision
        if (checkCollision(pipes[i])) {
            endGame();
            return;
        }
    }
    
    // Check boundaries
    if (bird.y - bird.radius < 0 || bird.y + bird.radius > canvas.height) {
        endGame();
        return;
    }
    
    // Draw everything
    draw();
    
    gameLoop = requestAnimationFrame(update);
}

// Check collision with pipe
function checkCollision(pipe) {
    // Check if bird is in pipe's x range
    if (bird.x + bird.radius > pipe.x && bird.x - bird.radius < pipe.x + PIPE_WIDTH) {
        // Check if bird hits top or bottom pipe
        if (bird.y - bird.radius < pipe.topHeight || bird.y + bird.radius > pipe.bottomY) {
            return true;
        }
    }
    return false;
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(1, '#e0f6ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw pipes
    pipes.forEach(pipe => {
        // Top pipe
        ctx.fillStyle = '#5cb85c';
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        ctx.strokeStyle = '#4a934a';
        ctx.lineWidth = 3;
        ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        
        // Pipe cap (top)
        ctx.fillStyle = '#6cc76c';
        ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, PIPE_WIDTH + 10, 20);
        ctx.strokeRect(pipe.x - 5, pipe.topHeight - 20, PIPE_WIDTH + 10, 20);
        
        // Bottom pipe
        ctx.fillStyle = '#5cb85c';
        ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, canvas.height - pipe.bottomY);
        ctx.strokeRect(pipe.x, pipe.bottomY, PIPE_WIDTH, canvas.height - pipe.bottomY);
        
        // Pipe cap (bottom)
        ctx.fillStyle = '#6cc76c';
        ctx.fillRect(pipe.x - 5, pipe.bottomY, PIPE_WIDTH + 10, 20);
        ctx.strokeRect(pipe.x - 5, pipe.bottomY, PIPE_WIDTH + 10, 20);
    });
    
    // Draw bird
    ctx.save();
    ctx.translate(bird.x, bird.y);
    
    // Rotate bird based on velocity
    const rotation = Math.min(Math.max(bird.velocity * 0.05, -0.5), 0.5);
    ctx.rotate(rotation);
    
    // Bird body
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ff8c00';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Bird eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(8, -5, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(10, -5, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Bird beak
    ctx.fillStyle = '#ff6347';
    ctx.beginPath();
    ctx.moveTo(bird.radius - 5, 0);
    ctx.lineTo(bird.radius + 8, -3);
    ctx.lineTo(bird.radius + 8, 3);
    ctx.closePath();
    ctx.fill();
    
    // Bird wing
    ctx.fillStyle = '#ffed4e';
    ctx.beginPath();
    ctx.ellipse(-5, 5, 8, 12, Math.PI * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ff8c00';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.restore();
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
    if (e.code === 'Space') {
        e.preventDefault();
        if (!gameActive && !startScreen.classList.contains('hidden')) {
            startGame();
        } else {
            flap();
        }
    }
});

// Mouse/touch controls
canvas.addEventListener('click', flap);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    flap();
});

// Initialize on load
loadHighScore();
initGame();
draw();

