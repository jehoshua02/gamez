// Game state
let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;
let gameMode = 'pvp'; // 'pvp' or 'pvc' (player vs computer)
let scores = {
    X: 0,
    O: 0,
    draw: 0
};

// Winning combinations
const winningCombinations = [
    [0, 1, 2], // Top row
    [3, 4, 5], // Middle row
    [6, 7, 8], // Bottom row
    [0, 3, 6], // Left column
    [1, 4, 7], // Middle column
    [2, 5, 8], // Right column
    [0, 4, 8], // Diagonal top-left to bottom-right
    [2, 4, 6]  // Diagonal top-right to bottom-left
];

// DOM elements
const cells = document.querySelectorAll('.cell');
const playerTurnDisplay = document.getElementById('playerTurn');
const resetBtn = document.getElementById('resetBtn');
const resetScoreBtn = document.getElementById('resetScoreBtn');
const backBtn = document.getElementById('backBtn');
const gameOverModal = document.getElementById('gameOverModal');
const playAgainBtn = document.getElementById('playAgainBtn');
const pvpBtn = document.getElementById('pvpBtn');
const pvcBtn = document.getElementById('pvcBtn');
const scoreXDisplay = document.getElementById('scoreX');
const scoreODisplay = document.getElementById('scoreO');
const scoreDrawDisplay = document.getElementById('scoreDraw');

// Initialize game
function initGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameActive = true;
    
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('taken', 'x', 'o', 'winner');
    });
    
    updateTurnDisplay();
    loadScores();
}

// Update turn display
function updateTurnDisplay() {
    if (gameMode === 'pvc' && currentPlayer === 'O') {
        playerTurnDisplay.textContent = "Computer's Turn";
    } else {
        playerTurnDisplay.textContent = `Player ${currentPlayer}'s Turn`;
    }
}

// Handle cell click
function handleCellClick(e) {
    const cell = e.target;
    const index = parseInt(cell.dataset.index);
    
    if (board[index] !== '' || !gameActive) return;
    if (gameMode === 'pvc' && currentPlayer === 'O') return; // Prevent clicking during computer turn
    
    makeMove(index, currentPlayer);
}

// Make a move
function makeMove(index, player) {
    board[index] = player;
    const cell = cells[index];
    cell.textContent = player;
    cell.classList.add('taken', player.toLowerCase());
    
    if (checkWin()) {
        endGame(`Player ${player} Wins!`);
        highlightWinningCells();
        scores[player]++;
        saveScores();
        updateScoreDisplay();
    } else if (checkDraw()) {
        endGame("It's a Draw!");
        scores.draw++;
        saveScores();
        updateScoreDisplay();
    } else {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        updateTurnDisplay();
        
        // Computer's turn
        if (gameMode === 'pvc' && currentPlayer === 'O' && gameActive) {
            setTimeout(computerMove, 500);
        }
    }
}

// Check for win
function checkWin() {
    return winningCombinations.some(combination => {
        const [a, b, c] = combination;
        return board[a] !== '' && 
               board[a] === board[b] && 
               board[a] === board[c];
    });
}

// Check for draw
function checkDraw() {
    return board.every(cell => cell !== '');
}

// Highlight winning cells
function highlightWinningCells() {
    winningCombinations.forEach(combination => {
        const [a, b, c] = combination;
        if (board[a] !== '' && board[a] === board[b] && board[a] === board[c]) {
            cells[a].classList.add('winner');
            cells[b].classList.add('winner');
            cells[c].classList.add('winner');
        }
    });
}

// Computer move (AI)
function computerMove() {
    if (!gameActive) return;
    
    // Try to win
    let move = findBestMove('O');
    if (move !== -1) {
        makeMove(move, 'O');
        return;
    }
    
    // Block player from winning
    move = findBestMove('X');
    if (move !== -1) {
        makeMove(move, 'O');
        return;
    }
    
    // Take center if available
    if (board[4] === '') {
        makeMove(4, 'O');
        return;
    }
    
    // Take a corner
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => board[i] === '');
    if (availableCorners.length > 0) {
        const randomCorner = availableCorners[Math.floor(Math.random() * availableCorners.length)];
        makeMove(randomCorner, 'O');
        return;
    }
    
    // Take any available space
    const availableCells = board.map((cell, index) => cell === '' ? index : null).filter(i => i !== null);
    if (availableCells.length > 0) {
        const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)];
        makeMove(randomCell, 'O');
    }
}

// Find best move for a player
function findBestMove(player) {
    for (let combination of winningCombinations) {
        const [a, b, c] = combination;
        const cells = [board[a], board[b], board[c]];
        
        // Check if two cells have the player's mark and one is empty
        if (cells.filter(cell => cell === player).length === 2 && 
            cells.filter(cell => cell === '').length === 1) {
            if (board[a] === '') return a;
            if (board[b] === '') return b;
            if (board[c] === '') return c;
        }
    }
    return -1;
}

// End game
function endGame(message) {
    gameActive = false;
    document.getElementById('gameOverTitle').textContent = 'Game Over';
    document.getElementById('gameOverMessage').textContent = message;
    gameOverModal.classList.remove('hidden');
}

// Reset game
function resetGame() {
    gameOverModal.classList.add('hidden');
    initGame();
}

// Save scores to localStorage
function saveScores() {
    localStorage.setItem('tictactoe_scores', JSON.stringify(scores));
}

// Load scores from localStorage
function loadScores() {
    const savedScores = localStorage.getItem('tictactoe_scores');
    if (savedScores) {
        scores = JSON.parse(savedScores);
    }
    updateScoreDisplay();
}

// Update score display
function updateScoreDisplay() {
    scoreXDisplay.textContent = scores.X;
    scoreODisplay.textContent = scores.O;
    scoreDrawDisplay.textContent = scores.draw;
}

// Reset scores
function resetScores() {
    scores = { X: 0, O: 0, draw: 0 };
    saveScores();
    updateScoreDisplay();
}

// Change game mode
function setGameMode(mode) {
    gameMode = mode;
    
    if (mode === 'pvp') {
        pvpBtn.classList.add('active');
        pvcBtn.classList.remove('active');
    } else {
        pvcBtn.classList.add('active');
        pvpBtn.classList.remove('active');
    }
    
    resetGame();
}

// Event listeners
cells.forEach(cell => cell.addEventListener('click', handleCellClick));
resetBtn.addEventListener('click', resetGame);
resetScoreBtn.addEventListener('click', resetScores);
playAgainBtn.addEventListener('click', resetGame);
pvpBtn.addEventListener('click', () => setGameMode('pvp'));
pvcBtn.addEventListener('click', () => setGameMode('pvc'));
backBtn.addEventListener('click', () => window.location.href = '../index.html');

// Initialize on load
initGame();

