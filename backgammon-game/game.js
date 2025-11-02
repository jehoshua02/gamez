// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const POINT_WIDTH = 60;
const POINT_HEIGHT = 200;
const CHECKER_RADIUS = 20;
const BOARD_PADDING = 30;
const BAR_WIDTH = 40;
const CHECKER_START_OFFSET = 45; // Offset from edge to start checkers (leaves room for numbers)

// Colors
const COLORS = {
    white: '#FFFFFF',
    black: '#000000',
    point1: '#8B4513',
    point2: '#D2691E',
    board: '#CD853F',
    bar: '#8B4513',
    highlight: 'rgba(255, 215, 0, 0.5)'
};

// Game state
let board = [];
let currentPlayer = 'white';
let dice = [0, 0];
let availableMoves = [];
let selectedPoint = null;
let whiteBar = 0;
let blackBar = 0;
let whiteOff = 0;
let blackOff = 0;

// DOM elements
const die1Element = document.getElementById('die1');
const die2Element = document.getElementById('die2');
const rollBtn = document.getElementById('rollBtn');
const endTurnBtn = document.getElementById('endTurnBtn');
const currentPlayerElement = document.getElementById('currentPlayer');
const messageBox = document.getElementById('messageBox');
const newGameBtn = document.getElementById('newGameBtn');
const backBtn = document.getElementById('backBtn');
const winModal = document.getElementById('winModal');
const winnerText = document.getElementById('winnerText');
const playAgainBtn = document.getElementById('playAgainBtn');
const p1Info = document.getElementById('player1Info');
const p2Info = document.getElementById('player2Info');

// Initialize board
function initBoard() {
    // Create 24 points (0-23)
    board = Array(24).fill(null).map(() => ({ color: null, count: 0 }));
    
    // Standard backgammon starting position
    // White moves from 23 to 0, Black moves from 0 to 23
    board[0] = { color: 'black', count: 2 };
    board[5] = { color: 'white', count: 5 };
    board[7] = { color: 'white', count: 3 };
    board[11] = { color: 'black', count: 5 };
    board[12] = { color: 'white', count: 5 };
    board[16] = { color: 'black', count: 3 };
    board[18] = { color: 'black', count: 5 };
    board[23] = { color: 'white', count: 2 };
    
    currentPlayer = 'white';
    dice = [0, 0];
    availableMoves = [];
    selectedPoint = null;
    whiteBar = 0;
    blackBar = 0;
    whiteOff = 0;
    blackOff = 0;
    
    updateDisplay();
    drawBoard();
}

// Roll dice
function rollDice() {
    dice = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
    ];
    
    // If doubles, player gets 4 moves
    if (dice[0] === dice[1]) {
        availableMoves = [dice[0], dice[0], dice[0], dice[0]];
    } else {
        availableMoves = [...dice];
    }
    
    die1Element.textContent = dice[0];
    die2Element.textContent = dice[1];
    die1Element.classList.remove('used');
    die2Element.classList.remove('used');
    
    rollBtn.style.display = 'none';
    endTurnBtn.style.display = 'inline-block';
    
    showMessage(`Rolled ${dice[0]} and ${dice[1]}`);
    
    // Check if player has any valid moves
    if (!hasValidMoves()) {
        showMessage('No valid moves available!');
        setTimeout(endTurn, 2000);
    }
    
    drawBoard();
}

// Check if player has valid moves
function hasValidMoves() {
    // Check if player has checkers on the bar
    const onBar = currentPlayer === 'white' ? whiteBar : blackBar;
    
    if (onBar > 0) {
        // Must enter from bar first
        for (let move of availableMoves) {
            if (canEnterFromBar(move)) {
                return true;
            }
        }
        return false;
    }
    
    // Check all points for valid moves
    for (let i = 0; i < 24; i++) {
        if (board[i].color === currentPlayer && board[i].count > 0) {
            for (let move of availableMoves) {
                if (isValidMove(i, move)) {
                    return true;
                }
            }
        }
    }
    
    // Check if can bear off
    if (canBearOff()) {
        for (let i = 0; i < 24; i++) {
            if (board[i].color === currentPlayer && board[i].count > 0) {
                for (let move of availableMoves) {
                    if (isValidBearOff(i, move)) {
                        return true;
                    }
                }
            }
        }
    }
    
    return false;
}

// Can enter from bar
function canEnterFromBar(move) {
    const targetPoint = currentPlayer === 'white' ? 24 - move : move - 1;
    const target = board[targetPoint];
    
    return !target || target.color === currentPlayer || target.count <= 1;
}

// Check if move is valid
function isValidMove(fromPoint, move) {
    const direction = currentPlayer === 'white' ? -1 : 1;
    const toPoint = fromPoint + (move * direction);
    
    // Out of bounds
    if (toPoint < 0 || toPoint >= 24) {
        return false;
    }
    
    const target = board[toPoint];
    
    // Can't move to point with 2+ opponent checkers
    if (target.color && target.color !== currentPlayer && target.count >= 2) {
        return false;
    }
    
    return true;
}

// Can bear off
function canBearOff() {
    const homeStart = currentPlayer === 'white' ? 0 : 18;
    const homeEnd = currentPlayer === 'white' ? 6 : 24;
    
    // Check if all checkers are in home board
    for (let i = 0; i < 24; i++) {
        if (board[i].color === currentPlayer && board[i].count > 0) {
            if (currentPlayer === 'white' && i >= 6) return false;
            if (currentPlayer === 'black' && i < 18) return false;
        }
    }
    
    // Check if any on bar
    const onBar = currentPlayer === 'white' ? whiteBar : blackBar;
    if (onBar > 0) return false;
    
    return true;
}

// Check if valid bear off
function isValidBearOff(fromPoint, move) {
    if (!canBearOff()) return false;
    
    const direction = currentPlayer === 'white' ? -1 : 1;
    const toPoint = fromPoint + (move * direction);
    
    // Exact bear off
    if (currentPlayer === 'white' && toPoint < 0) {
        // Check if this is the furthest checker or exact
        const distance = fromPoint + 1;
        if (distance === move) return true;
        
        // If die is higher, can bear off if no checkers further back
        if (move > distance) {
            for (let i = fromPoint + 1; i < 6; i++) {
                if (board[i].color === 'white' && board[i].count > 0) {
                    return false;
                }
            }
            return true;
        }
    }
    
    if (currentPlayer === 'black' && toPoint >= 24) {
        const distance = 24 - fromPoint;
        if (distance === move) return true;
        
        if (move > distance) {
            for (let i = fromPoint - 1; i >= 18; i--) {
                if (board[i].color === 'black' && board[i].count > 0) {
                    return false;
                }
            }
            return true;
        }
    }
    
    return false;
}

// Make move
function makeMove(fromPoint, move) {
    const direction = currentPlayer === 'white' ? -1 : 1;
    const toPoint = fromPoint + (move * direction);
    
    // Remove from source
    board[fromPoint].count--;
    if (board[fromPoint].count === 0) {
        board[fromPoint].color = null;
    }
    
    // Handle bearing off
    if ((currentPlayer === 'white' && toPoint < 0) || (currentPlayer === 'black' && toPoint >= 24)) {
        if (currentPlayer === 'white') {
            whiteOff++;
        } else {
            blackOff++;
        }
    } else {
        // Handle hitting
        if (board[toPoint].color && board[toPoint].color !== currentPlayer && board[toPoint].count === 1) {
            board[toPoint].color = null;
            board[toPoint].count = 0;
            if (currentPlayer === 'white') {
                blackBar++;
            } else {
                whiteBar++;
            }
            showMessage(`${currentPlayer === 'white' ? 'Black' : 'White'} checker sent to bar!`);
        }
        
        // Place checker
        board[toPoint].color = currentPlayer;
        board[toPoint].count++;
    }
    
    // Remove used move
    const moveIndex = availableMoves.indexOf(move);
    if (moveIndex > -1) {
        availableMoves.splice(moveIndex, 1);
    }
    
    // Update dice display
    updateDiceDisplay();
    
    // Check for win
    if ((currentPlayer === 'white' && whiteOff === 15) || (currentPlayer === 'black' && blackOff === 15)) {
        endGame();
        return;
    }
    
    // End turn if no moves left
    if (availableMoves.length === 0 || !hasValidMoves()) {
        setTimeout(endTurn, 500);
    }
    
    updateDisplay();
    drawBoard();
}

// Enter from bar
function enterFromBar(move) {
    const targetPoint = currentPlayer === 'white' ? 24 - move : move - 1;

    // Handle hitting
    if (board[targetPoint].color && board[targetPoint].color !== currentPlayer && board[targetPoint].count === 1) {
        board[targetPoint].color = null;
        board[targetPoint].count = 0;
        if (currentPlayer === 'white') {
            blackBar++;
        } else {
            whiteBar++;
        }
        showMessage(`${currentPlayer === 'white' ? 'Black' : 'White'} checker sent to bar!`);
    }

    // Place checker
    board[targetPoint].color = currentPlayer;
    board[targetPoint].count++;

    // Remove from bar
    if (currentPlayer === 'white') {
        whiteBar--;
    } else {
        blackBar--;
    }

    // Remove used move
    const moveIndex = availableMoves.indexOf(move);
    if (moveIndex > -1) {
        availableMoves.splice(moveIndex, 1);
    }

    updateDiceDisplay();

    if (availableMoves.length === 0 || !hasValidMoves()) {
        setTimeout(endTurn, 500);
    }

    updateDisplay();
    drawBoard();
}

// Update dice display
function updateDiceDisplay() {
    if (dice[0] === dice[1]) {
        // Doubles
        const remaining = availableMoves.length;
        die1Element.classList.toggle('used', remaining < 2);
        die2Element.classList.toggle('used', remaining === 0);
    } else {
        die1Element.classList.toggle('used', !availableMoves.includes(dice[0]));
        die2Element.classList.toggle('used', !availableMoves.includes(dice[1]));
    }
}

// End turn
function endTurn() {
    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
    dice = [0, 0];
    availableMoves = [];
    selectedPoint = null;

    die1Element.textContent = '?';
    die2Element.textContent = '?';
    die1Element.classList.remove('used');
    die2Element.classList.remove('used');

    rollBtn.style.display = 'inline-block';
    endTurnBtn.style.display = 'none';

    updateDisplay();
    drawBoard();
}

// End game
function endGame() {
    const winner = currentPlayer === 'white' ? 'White' : 'Black';
    winnerText.textContent = `${winner} Wins!`;
    winModal.classList.remove('hidden');
}

// Update display
function updateDisplay() {
    currentPlayerElement.textContent = `${currentPlayer === 'white' ? 'White' : 'Black'}'s Turn`;

    p1Info.classList.toggle('active', currentPlayer === 'white');
    p2Info.classList.toggle('active', currentPlayer === 'black');

    // Count checkers on board
    let whiteCount = whiteBar + whiteOff;
    let blackCount = blackBar + blackOff;

    for (let i = 0; i < 24; i++) {
        if (board[i].color === 'white') whiteCount += board[i].count;
        if (board[i].color === 'black') blackCount += board[i].count;
    }

    document.getElementById('p1Checkers').textContent = 15 - whiteOff;
    document.getElementById('p2Checkers').textContent = 15 - blackOff;
    document.getElementById('p1Off').textContent = whiteOff;
    document.getElementById('p2Off').textContent = blackOff;
}

// Show message
function showMessage(msg) {
    messageBox.textContent = msg;
}

// Draw board
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw board background
    ctx.fillStyle = COLORS.board;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw bar
    const barX = canvas.width / 2 - BAR_WIDTH / 2;
    ctx.fillStyle = COLORS.bar;
    ctx.fillRect(barX, 0, BAR_WIDTH, canvas.height);

    // Draw points
    for (let i = 0; i < 24; i++) {
        drawPoint(i);
    }

    // Draw checkers
    for (let i = 0; i < 24; i++) {
        if (board[i].count > 0) {
            drawCheckers(i, board[i].color, board[i].count);
        }
    }

    // Draw bar checkers
    if (whiteBar > 0) {
        drawBarCheckers('white', whiteBar);
    }
    if (blackBar > 0) {
        drawBarCheckers('black', blackBar);
    }

    // Draw off board areas
    drawOffBoard();

    // Highlight valid moves
    if (selectedPoint !== null && availableMoves.length > 0) {
        highlightValidMoves(selectedPoint);
    }
}

// Draw point
function drawPoint(index) {
    const isTop = index >= 12;
    const position = index < 12 ? index : 23 - index;
    const side = position < 6 ? 'right' : 'left';
    const posInSide = side === 'right' ? position : position - 6;

    let x;
    if (side === 'right') {
        x = canvas.width - BOARD_PADDING - (posInSide + 1) * POINT_WIDTH;
    } else {
        // Reverse the left side (points 6-11 and 18-23)
        x = BOARD_PADDING + (5 - posInSide) * POINT_WIDTH;
    }

    const y = isTop ? 0 : canvas.height - POINT_HEIGHT;

    // Alternate colors
    const colorIndex = (index % 2 === 0) ? 1 : 2;
    ctx.fillStyle = COLORS[`point${colorIndex}`];

    // Draw triangle
    ctx.beginPath();
    if (isTop) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + POINT_WIDTH, y);
        ctx.lineTo(x + POINT_WIDTH / 2, y + POINT_HEIGHT);
    } else {
        ctx.moveTo(x, y + POINT_HEIGHT);
        ctx.lineTo(x + POINT_WIDTH, y + POINT_HEIGHT);
        ctx.lineTo(x + POINT_WIDTH / 2, y);
    }
    ctx.closePath();
    ctx.fill();

    // Draw point number
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(index + 1, x + POINT_WIDTH / 2, isTop ? 20 : canvas.height - 10);
}

// Draw checkers
function drawCheckers(pointIndex, color, count) {
    const isTop = pointIndex >= 12;
    const position = pointIndex < 12 ? pointIndex : 23 - pointIndex;
    const side = position < 6 ? 'right' : 'left';
    const posInSide = side === 'right' ? position : position - 6;

    let x;
    if (side === 'right') {
        x = canvas.width - BOARD_PADDING - (posInSide + 1) * POINT_WIDTH + POINT_WIDTH / 2;
    } else {
        // Reverse the left side (points 6-11 and 18-23)
        x = BOARD_PADDING + (5 - posInSide) * POINT_WIDTH + POINT_WIDTH / 2;
    }

    for (let i = 0; i < Math.min(count, 5); i++) {
        const y = isTop ?
            CHECKER_START_OFFSET + i * (CHECKER_RADIUS * 2 + 2) :
            canvas.height - CHECKER_START_OFFSET - i * (CHECKER_RADIUS * 2 + 2);

        drawChecker(x, y, color);
    }

    // If more than 5, show count
    if (count > 5) {
        const y = isTop ?
            CHECKER_START_OFFSET + 4 * (CHECKER_RADIUS * 2 + 2) :
            canvas.height - CHECKER_START_OFFSET - 4 * (CHECKER_RADIUS * 2 + 2);

        ctx.fillStyle = color === 'white' ? '#000' : '#FFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(count, x, y);
    }
}

// Draw checker
function drawChecker(x, y, color) {
    ctx.beginPath();
    ctx.arc(x, y, CHECKER_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = COLORS[color];
    ctx.fill();
    ctx.strokeStyle = color === 'white' ? '#000' : '#FFF';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Draw bar checkers
function drawBarCheckers(color, count) {
    const barX = canvas.width / 2;
    const startY = color === 'white' ? canvas.height - 100 : 100;

    for (let i = 0; i < Math.min(count, 3); i++) {
        const y = color === 'white' ?
            startY - i * (CHECKER_RADIUS * 2 - 5) :
            startY + i * (CHECKER_RADIUS * 2 - 5);

        drawChecker(barX, y, color);
    }

    if (count > 3) {
        const y = color === 'white' ?
            startY - 2 * (CHECKER_RADIUS * 2 - 5) :
            startY + 2 * (CHECKER_RADIUS * 2 - 5);

        ctx.fillStyle = color === 'white' ? '#000' : '#FFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(count, barX, y);
    }
}

// Draw off board
function drawOffBoard() {
    // White off (bottom right)
    if (whiteOff > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(canvas.width - 80, canvas.height - 80, 60, 60);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(whiteOff, canvas.width - 50, canvas.height - 50);
    }

    // Black off (top right)
    if (blackOff > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(canvas.width - 80, 20, 60, 60);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(blackOff, canvas.width - 50, 50);
    }
}

// Highlight valid moves
function highlightValidMoves(fromPoint) {
    for (let move of availableMoves) {
        const direction = currentPlayer === 'white' ? -1 : 1;
        const toPoint = fromPoint + (move * direction);

        if (isValidMove(fromPoint, move) || isValidBearOff(fromPoint, move)) {
            if (toPoint >= 0 && toPoint < 24) {
                highlightPoint(toPoint);
            }
        }
    }
}

// Highlight point
function highlightPoint(index) {
    const isTop = index >= 12;
    const position = index < 12 ? index : 23 - index;
    const side = position < 6 ? 'right' : 'left';
    const posInSide = side === 'right' ? position : position - 6;

    let x;
    if (side === 'right') {
        x = canvas.width - BOARD_PADDING - (posInSide + 1) * POINT_WIDTH;
    } else {
        // Reverse the left side (points 6-11 and 18-23)
        x = BOARD_PADDING + (5 - posInSide) * POINT_WIDTH;
    }

    const y = isTop ? 0 : canvas.height - POINT_HEIGHT;

    ctx.fillStyle = COLORS.highlight;
    ctx.beginPath();
    if (isTop) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + POINT_WIDTH, y);
        ctx.lineTo(x + POINT_WIDTH / 2, y + POINT_HEIGHT);
    } else {
        ctx.moveTo(x, y + POINT_HEIGHT);
        ctx.lineTo(x + POINT_WIDTH, y + POINT_HEIGHT);
        ctx.lineTo(x + POINT_WIDTH / 2, y);
    }
    ctx.closePath();
    ctx.fill();
}

// Get point from click
function getPointFromClick(x, y) {
    // Check bar
    const barX = canvas.width / 2 - BAR_WIDTH / 2;
    if (x >= barX && x <= barX + BAR_WIDTH) {
        return -1; // Bar
    }

    // Determine side and position
    let side, posInSide;
    if (x > canvas.width / 2) {
        // Right side
        side = 'right';
        posInSide = Math.floor((canvas.width - BOARD_PADDING - x) / POINT_WIDTH);
    } else {
        // Left side (reversed)
        side = 'left';
        const rawPos = Math.floor((x - BOARD_PADDING) / POINT_WIDTH);
        posInSide = 5 - rawPos; // Reverse the position
    }

    if (posInSide < 0 || posInSide >= 6) return null;

    // Determine if top or bottom
    const isTop = y < canvas.height / 2;

    // Calculate point index
    let pointIndex;
    if (side === 'right') {
        pointIndex = isTop ? (23 - posInSide) : posInSide;
    } else {
        pointIndex = isTop ? (18 - posInSide) : (6 + posInSide);
    }

    return pointIndex;
}

// Canvas click handler
canvas.addEventListener('click', (e) => {
    if (availableMoves.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking bar
    const onBar = currentPlayer === 'white' ? whiteBar : blackBar;
    if (onBar > 0) {
        const barX = canvas.width / 2 - BAR_WIDTH / 2;
        if (x >= barX && x <= barX + BAR_WIDTH) {
            // Try to enter from bar
            for (let move of availableMoves) {
                if (canEnterFromBar(move)) {
                    enterFromBar(move);
                    return;
                }
            }
            showMessage('Cannot enter from bar with available dice!');
            return;
        }
        showMessage('Must enter from bar first!');
        return;
    }

    const clickedPoint = getPointFromClick(x, y);

    if (clickedPoint === null) return;

    // If no point selected, select this point
    if (selectedPoint === null) {
        if (board[clickedPoint].color === currentPlayer && board[clickedPoint].count > 0) {
            selectedPoint = clickedPoint;
            showMessage(`Selected point ${clickedPoint + 1}`);
            drawBoard();
        }
    } else {
        // Try to move to clicked point
        const direction = currentPlayer === 'white' ? -1 : 1;

        for (let move of availableMoves) {
            const targetPoint = selectedPoint + (move * direction);

            if (targetPoint === clickedPoint && isValidMove(selectedPoint, move)) {
                makeMove(selectedPoint, move);
                selectedPoint = null;
                return;
            }

            // Check bear off
            if (isValidBearOff(selectedPoint, move)) {
                if ((currentPlayer === 'white' && targetPoint < 0) ||
                    (currentPlayer === 'black' && targetPoint >= 24)) {
                    makeMove(selectedPoint, move);
                    selectedPoint = null;
                    return;
                }
            }
        }

        // If clicked same color, change selection
        if (board[clickedPoint].color === currentPlayer && board[clickedPoint].count > 0) {
            selectedPoint = clickedPoint;
            showMessage(`Selected point ${clickedPoint + 1}`);
            drawBoard();
        } else {
            showMessage('Invalid move!');
        }
    }
});

// Event listeners
rollBtn.addEventListener('click', rollDice);
endTurnBtn.addEventListener('click', endTurn);
newGameBtn.addEventListener('click', () => {
    winModal.classList.add('hidden');
    initBoard();
});
playAgainBtn.addEventListener('click', () => {
    winModal.classList.add('hidden');
    initBoard();
});
backBtn.addEventListener('click', () => window.location.href = '../index.html');

// Initialize
initBoard();


