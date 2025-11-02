// Game state
let board = [];
let rows = 9;
let cols = 9;
let mineCount = 10;
let flagCount = 0;
let revealedCount = 0;
let gameOver = false;
let gameWon = false;
let time = 0;
let timerInterval = null;
let firstClick = true;
let currentDifficulty = 'easy';

// Difficulty settings
const difficulties = {
    easy: { rows: 9, cols: 9, mines: 10 },
    medium: { rows: 16, cols: 16, mines: 40 },
    hard: { rows: 16, cols: 30, mines: 99 }
};

// DOM elements
const gameBoard = document.getElementById('gameBoard');
const mineCountElement = document.getElementById('mineCount');
const flagCountElement = document.getElementById('flagCount');
const timeElement = document.getElementById('time');
const messageBox = document.getElementById('message');
const newGameBtn = document.getElementById('newGameBtn');
const backBtn = document.getElementById('backBtn');
const winModal = document.getElementById('winModal');
const gameOverModal = document.getElementById('gameOverModal');
const finalTime = document.getElementById('finalTime');
const finalDifficulty = document.getElementById('finalDifficulty');
const gameOverTime = document.getElementById('gameOverTime');
const playAgainBtn = document.getElementById('playAgainBtn');
const tryAgainBtn = document.getElementById('tryAgainBtn');
const difficultyBtns = document.querySelectorAll('.difficulty-btn');

// Initialize game
function initGame() {
    // Reset state
    board = [];
    flagCount = 0;
    revealedCount = 0;
    gameOver = false;
    gameWon = false;
    time = 0;
    firstClick = true;
    
    // Stop timer
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // Get difficulty settings
    const difficulty = difficulties[currentDifficulty];
    rows = difficulty.rows;
    cols = difficulty.cols;
    mineCount = difficulty.mines;
    
    // Create empty board
    for (let r = 0; r < rows; r++) {
        board[r] = [];
        for (let c = 0; c < cols; c++) {
            board[r][c] = {
                mine: false,
                revealed: false,
                flagged: false,
                adjacentMines: 0
            };
        }
    }
    
    updateDisplay();
    renderBoard();
    showMessage('Click any cell to start!');
}

// Place mines (after first click to ensure first click is safe)
function placeMines(firstRow, firstCol) {
    let minesPlaced = 0;
    
    while (minesPlaced < mineCount) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);
        
        // Don't place mine on first click or adjacent cells
        const isFirstClick = r === firstRow && c === firstCol;
        const isAdjacent = Math.abs(r - firstRow) <= 1 && Math.abs(c - firstCol) <= 1;
        
        if (!board[r][c].mine && !isFirstClick && !isAdjacent) {
            board[r][c].mine = true;
            minesPlaced++;
        }
    }
    
    // Calculate adjacent mine counts
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (!board[r][c].mine) {
                board[r][c].adjacentMines = countAdjacentMines(r, c);
            }
        }
    }
}

// Count adjacent mines
function countAdjacentMines(row, col) {
    let count = 0;
    
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            
            const r = row + dr;
            const c = col + dc;
            
            if (r >= 0 && r < rows && c >= 0 && c < cols && board[r][c].mine) {
                count++;
            }
        }
    }
    
    return count;
}

// Update display
function updateDisplay() {
    mineCountElement.textContent = mineCount;
    flagCountElement.textContent = flagCount;
    timeElement.textContent = time;
}

// Show message
function showMessage(msg) {
    messageBox.textContent = msg;
}

// Render board
function renderBoard() {
    gameBoard.innerHTML = '';
    gameBoard.style.gridTemplateColumns = `repeat(${cols}, 30px)`;
    gameBoard.style.gridTemplateRows = `repeat(${rows}, 30px)`;
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = r;
            cell.dataset.col = c;
            
            const cellData = board[r][c];
            
            if (cellData.revealed) {
                cell.classList.add('revealed');
                
                if (cellData.mine) {
                    cell.classList.add('mine');
                    cell.textContent = '💣';
                } else if (cellData.adjacentMines > 0) {
                    cell.textContent = cellData.adjacentMines;
                    cell.classList.add(`number-${cellData.adjacentMines}`);
                }
            } else if (cellData.flagged) {
                cell.classList.add('flagged');
                cell.textContent = '🚩';
            }
            
            // Add event listeners
            cell.addEventListener('click', () => handleCellClick(r, c));
            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                handleRightClick(r, c);
            });
            
            gameBoard.appendChild(cell);
        }
    }
}

// Handle cell click
function handleCellClick(row, col) {
    if (gameOver || gameWon) return;
    
    const cell = board[row][col];
    
    if (cell.revealed || cell.flagged) return;
    
    // First click - place mines
    if (firstClick) {
        placeMines(row, col);
        firstClick = false;
        
        // Start timer
        timerInterval = setInterval(() => {
            time++;
            updateDisplay();
        }, 1000);
    }
    
    // Reveal cell
    if (cell.mine) {
        // Game over
        revealCell(row, col);
        cell.revealed = true;
        gameOver = true;
        endGame(false);
    } else {
        revealCell(row, col);
        checkWin();
    }
    
    renderBoard();
}

// Handle right click (flag)
function handleRightClick(row, col) {
    if (gameOver || gameWon) return;
    
    const cell = board[row][col];
    
    if (cell.revealed) return;
    
    if (cell.flagged) {
        cell.flagged = false;
        flagCount--;
    } else {
        cell.flagged = true;
        flagCount++;
    }
    
    updateDisplay();
    renderBoard();
}

// Reveal cell
function revealCell(row, col) {
    const cell = board[row][col];
    
    if (cell.revealed || cell.flagged) return;
    
    cell.revealed = true;
    revealedCount++;
    
    // If no adjacent mines, reveal adjacent cells
    if (cell.adjacentMines === 0 && !cell.mine) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                
                const r = row + dr;
                const c = col + dc;
                
                if (r >= 0 && r < rows && c >= 0 && c < cols) {
                    revealCell(r, c);
                }
            }
        }
    }
}

// Check win
function checkWin() {
    const totalCells = rows * cols;
    const nonMineCells = totalCells - mineCount;
    
    if (revealedCount === nonMineCells) {
        gameWon = true;
        endGame(true);
    }
}

// End game
function endGame(won) {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    if (won) {
        finalTime.textContent = time;
        finalDifficulty.textContent = currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1);
        winModal.classList.remove('hidden');
        showMessage('Congratulations! You won!');
    } else {
        // Reveal all mines
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (board[r][c].mine) {
                    board[r][c].revealed = true;
                }
            }
        }
        renderBoard();
        
        gameOverTime.textContent = time;
        gameOverModal.classList.remove('hidden');
        showMessage('Game Over! Try again!');
    }
}

// Event listeners
newGameBtn.addEventListener('click', initGame);
playAgainBtn.addEventListener('click', () => {
    winModal.classList.add('hidden');
    initGame();
});
tryAgainBtn.addEventListener('click', () => {
    gameOverModal.classList.add('hidden');
    initGame();
});
backBtn.addEventListener('click', () => window.location.href = '../index.html');

// Difficulty selector
difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        difficultyBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentDifficulty = btn.dataset.difficulty;
        initGame();
    });
});

// Initialize
initGame();

