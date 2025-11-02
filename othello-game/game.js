// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const BOARD_SIZE = 8;
const CELL_SIZE = canvas.width / BOARD_SIZE;
const DISC_RADIUS = CELL_SIZE * 0.4;

// Colors
const COLORS = {
    board: '#2d8659',
    grid: '#1a5c3d',
    black: '#000000',
    white: '#ffffff',
    validMove: 'rgba(255, 215, 0, 0.5)',
    lastMove: 'rgba(255, 100, 100, 0.3)'
};

// Game state
let board = [];
let currentPlayer = 'black';
let validMoves = [];
let gameOver = false;
let lastMove = null;

// DOM elements
const blackScoreElement = document.getElementById('blackScore');
const whiteScoreElement = document.getElementById('whiteScore');
const turnIndicator = document.getElementById('turnIndicator');
const blackInfo = document.getElementById('blackInfo');
const whiteInfo = document.getElementById('whiteInfo');
const messageBox = document.getElementById('message');
const newGameBtn = document.getElementById('newGameBtn');
const passBtn = document.getElementById('passBtn');
const backBtn = document.getElementById('backBtn');
const winModal = document.getElementById('winModal');
const winnerText = document.getElementById('winnerText');
const finalBlackScore = document.getElementById('finalBlackScore');
const finalWhiteScore = document.getElementById('finalWhiteScore');
const playAgainBtn = document.getElementById('playAgainBtn');

// Initialize board
function initBoard() {
    board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    
    // Set up initial position
    const mid = BOARD_SIZE / 2;
    board[mid - 1][mid - 1] = 'white';
    board[mid - 1][mid] = 'black';
    board[mid][mid - 1] = 'black';
    board[mid][mid] = 'white';
    
    currentPlayer = 'black';
    gameOver = false;
    lastMove = null;
    
    updateValidMoves();
    updateDisplay();
    drawBoard();
    
    showMessage('Black starts!');
}

// Update valid moves
function updateValidMoves() {
    validMoves = [];
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === null && hasValidDirection(row, col, currentPlayer)) {
                validMoves.push({ row, col });
            }
        }
    }
    
    // Show/hide pass button
    if (validMoves.length === 0) {
        passBtn.style.display = 'inline-block';
    } else {
        passBtn.style.display = 'none';
    }
}

// Check if a position has any valid direction
function hasValidDirection(row, col, player) {
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];
    
    for (let [dr, dc] of directions) {
        if (isValidDirection(row, col, dr, dc, player)) {
            return true;
        }
    }
    
    return false;
}

// Check if a specific direction is valid
function isValidDirection(row, col, dr, dc, player) {
    const opponent = player === 'black' ? 'white' : 'black';
    let r = row + dr;
    let c = col + dc;
    let foundOpponent = false;
    
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        if (board[r][c] === null) {
            return false;
        }
        if (board[r][c] === opponent) {
            foundOpponent = true;
        } else if (board[r][c] === player) {
            return foundOpponent;
        }
        r += dr;
        c += dc;
    }
    
    return false;
}

// Make a move
function makeMove(row, col) {
    if (gameOver) return;
    if (board[row][col] !== null) return;
    if (!validMoves.some(m => m.row === row && m.col === col)) return;
    
    board[row][col] = currentPlayer;
    lastMove = { row, col };
    
    // Flip discs in all valid directions
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];
    
    for (let [dr, dc] of directions) {
        if (isValidDirection(row, col, dr, dc, currentPlayer)) {
            flipDirection(row, col, dr, dc);
        }
    }
    
    updateDisplay();
    drawBoard();
    
    // Switch player
    setTimeout(() => {
        currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
        updateValidMoves();
        
        // Check if game is over
        if (validMoves.length === 0) {
            // Check if opponent can move
            currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
            updateValidMoves();
            
            if (validMoves.length === 0) {
                endGame();
                return;
            }
            
            showMessage(`${currentPlayer === 'black' ? 'Black' : 'White'} has no valid moves. Turn passed.`);
        } else {
            showMessage('');
        }
        
        updateDisplay();
        drawBoard();
    }, 300);
}

// Flip discs in a direction
function flipDirection(row, col, dr, dc) {
    const opponent = currentPlayer === 'black' ? 'white' : 'black';
    let r = row + dr;
    let c = col + dc;
    const toFlip = [];
    
    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        if (board[r][c] === opponent) {
            toFlip.push({ r, c });
        } else if (board[r][c] === currentPlayer) {
            // Flip all collected discs
            for (let pos of toFlip) {
                board[pos.r][pos.c] = currentPlayer;
            }
            return;
        } else {
            return;
        }
        r += dr;
        c += dc;
    }
}

// Pass turn
function passTurn() {
    currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
    updateValidMoves();
    
    if (validMoves.length === 0) {
        endGame();
        return;
    }
    
    showMessage(`${currentPlayer === 'black' ? 'White' : 'Black'} passed. ${currentPlayer === 'black' ? 'Black' : 'White'}'s turn.`);
    updateDisplay();
    drawBoard();
}

// End game
function endGame() {
    gameOver = true;
    const scores = countDiscs();
    
    let winner;
    if (scores.black > scores.white) {
        winner = 'Black Wins!';
    } else if (scores.white > scores.black) {
        winner = 'White Wins!';
    } else {
        winner = "It's a Tie!";
    }
    
    winnerText.textContent = winner;
    finalBlackScore.textContent = scores.black;
    finalWhiteScore.textContent = scores.white;
    winModal.classList.remove('hidden');
}

// Count discs
function countDiscs() {
    let black = 0;
    let white = 0;
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === 'black') black++;
            if (board[row][col] === 'white') white++;
        }
    }
    
    return { black, white };
}

// Update display
function updateDisplay() {
    const scores = countDiscs();
    blackScoreElement.textContent = scores.black;
    whiteScoreElement.textContent = scores.white;
    
    turnIndicator.textContent = `${currentPlayer === 'black' ? 'Black' : 'White'}'s Turn`;
    
    blackInfo.classList.toggle('active', currentPlayer === 'black');
    whiteInfo.classList.toggle('active', currentPlayer === 'white');
}

// Show message
function showMessage(msg) {
    messageBox.textContent = msg;
}

// Draw board
function drawBoard() {
    // Clear canvas
    ctx.fillStyle = COLORS.board;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 2;
    
    for (let i = 0; i <= BOARD_SIZE; i++) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();
        
        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
    }
    
    // Draw last move highlight
    if (lastMove) {
        ctx.fillStyle = COLORS.lastMove;
        ctx.fillRect(lastMove.col * CELL_SIZE, lastMove.row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
    
    // Draw valid moves
    if (!gameOver) {
        ctx.fillStyle = COLORS.validMove;
        for (let move of validMoves) {
            ctx.beginPath();
            ctx.arc(
                move.col * CELL_SIZE + CELL_SIZE / 2,
                move.row * CELL_SIZE + CELL_SIZE / 2,
                DISC_RADIUS * 0.3,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }
    
    // Draw discs
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col]) {
                drawDisc(row, col, board[row][col]);
            }
        }
    }
}

// Draw disc
function drawDisc(row, col, color) {
    const x = col * CELL_SIZE + CELL_SIZE / 2;
    const y = row * CELL_SIZE + CELL_SIZE / 2;

    // Draw disc with gradient
    const gradient = ctx.createRadialGradient(
        x - DISC_RADIUS * 0.3,
        y - DISC_RADIUS * 0.3,
        DISC_RADIUS * 0.1,
        x,
        y,
        DISC_RADIUS
    );

    if (color === 'black') {
        gradient.addColorStop(0, '#4a4a4a');
        gradient.addColorStop(1, '#000000');
    } else {
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#d0d0d0');
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, DISC_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Draw border
    ctx.strokeStyle = color === 'black' ? '#000000' : '#999999';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Get cell from click
function getCellFromClick(x, y) {
    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);

    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
        return { row, col };
    }

    return null;
}

// Canvas click handler
canvas.addEventListener('click', (e) => {
    if (gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cell = getCellFromClick(x, y);

    if (cell) {
        makeMove(cell.row, cell.col);
    }
});

// Event listeners
newGameBtn.addEventListener('click', initBoard);
passBtn.addEventListener('click', passTurn);
playAgainBtn.addEventListener('click', () => {
    winModal.classList.add('hidden');
    initBoard();
});
backBtn.addEventListener('click', () => window.location.href = '../index.html');

// Initialize
initBoard();


