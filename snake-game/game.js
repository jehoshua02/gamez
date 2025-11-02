// Game constants
const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 5;

// Game state
let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = { x: 0, y: 0 };
let score = 0;
let highScore = 0;
let gameLoop = null;
let isPaused = false;
let isGameOver = false;
let gameSpeed = INITIAL_SPEED;

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI elements
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const finalScoreElement = document.getElementById('finalScore');
const gameOverElement = document.getElementById('gameOver');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const restartBtn = document.getElementById('restartBtn');
const backBtn = document.getElementById('backBtn');

// Load high score from localStorage
highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
highScoreElement.textContent = highScore;

// Initialize game
function initGame() {
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    gameSpeed = INITIAL_SPEED;
    isPaused = false;
    isGameOver = false;
    scoreElement.textContent = score;
    gameOverElement.classList.add('hidden');
    spawnFood();
    draw();
}

// Spawn food at random location
function spawnFood() {
    do {
        food = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
}

// Draw game
function draw() {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw grid
    ctx.strokeStyle = '#16213e';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
        ctx.stroke();
    }

    // Draw snake
    snake.forEach((segment, index) => {
        if (index === 0) {
            // Snake head
            ctx.fillStyle = '#4ecca3';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#4ecca3';
        } else {
            // Snake body
            ctx.fillStyle = '#45b393';
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#45b393';
        }
        ctx.fillRect(
            segment.x * CELL_SIZE + 1,
            segment.y * CELL_SIZE + 1,
            CELL_SIZE - 2,
            CELL_SIZE - 2
        );
        ctx.shadowBlur = 0;
    });

    // Draw food
    ctx.fillStyle = '#ff6b6b';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(
        food.x * CELL_SIZE + CELL_SIZE / 2,
        food.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;
}

// Update game state
function update() {
    if (isPaused || isGameOver) return;

    // Update direction
    direction = { ...nextDirection };

    // Calculate new head position
    const newHead = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };

    // Check wall collision
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || 
        newHead.y < 0 || newHead.y >= GRID_SIZE) {
        endGame();
        return;
    }

    // Check self collision
    if (snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        endGame();
        return;
    }

    // Add new head
    snake.unshift(newHead);

    // Check food collision
    if (newHead.x === food.x && newHead.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        
        // Update high score
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        
        // Increase speed slightly
        gameSpeed = Math.max(50, gameSpeed - SPEED_INCREMENT);
        
        spawnFood();
    } else {
        // Remove tail if no food eaten
        snake.pop();
    }

    draw();
}

// End game
function endGame() {
    isGameOver = true;
    clearInterval(gameLoop);
    finalScoreElement.textContent = score;
    gameOverElement.classList.remove('hidden');
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

// Start game
function startGame() {
    if (gameLoop) {
        clearInterval(gameLoop);
    }
    
    if (isGameOver) {
        initGame();
    }
    
    gameLoop = setInterval(update, gameSpeed);
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    isPaused = false;
    pauseBtn.textContent = 'Pause';
}

// Pause/Resume game
function togglePause() {
    if (isGameOver) return;
    
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
    
    if (!isPaused) {
        gameLoop = setInterval(update, gameSpeed);
    } else {
        clearInterval(gameLoop);
    }
}

// Reset game
function resetGame() {
    if (gameLoop) {
        clearInterval(gameLoop);
    }
    initGame();
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = 'Pause';
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp':
            if (direction.y === 0) {
                nextDirection = { x: 0, y: -1 };
            }
            e.preventDefault();
            break;
        case 'ArrowDown':
            if (direction.y === 0) {
                nextDirection = { x: 0, y: 1 };
            }
            e.preventDefault();
            break;
        case 'ArrowLeft':
            if (direction.x === 0) {
                nextDirection = { x: -1, y: 0 };
            }
            e.preventDefault();
            break;
        case 'ArrowRight':
            if (direction.x === 0) {
                nextDirection = { x: 1, y: 0 };
            }
            e.preventDefault();
            break;
        case ' ':
            if (!isGameOver) {
                togglePause();
            }
            e.preventDefault();
            break;
    }
});

// Button event listeners
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
resetBtn.addEventListener('click', resetGame);
restartBtn.addEventListener('click', () => {
    resetGame();
    startGame();
});
backBtn.addEventListener('click', () => window.location.href = '../index.html');

// Initialize on load
initGame();
pauseBtn.disabled = true;

