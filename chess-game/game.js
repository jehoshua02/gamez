// Chess pieces using Unicode symbols
// Using solid symbols for both, with W/B prefix to identify color
const PIECES = {
    white: {
        king: 'W♚',
        queen: 'W♛',
        rook: 'W♜',
        bishop: 'W♝',
        knight: 'W♞',
        pawn: 'W♟'
    },
    black: {
        king: 'B♚',
        queen: 'B♛',
        rook: 'B♜',
        bishop: 'B♝',
        knight: 'B♞',
        pawn: 'B♟'
    }
};

// Game state
let board = [];
let currentPlayer = 'white';
let selectedSquare = null;
let validMoves = [];
let moveHistory = [];
let gameOver = false;
let whiteKingPos = null;
let blackKingPos = null;

// UI elements
const chessboard = document.getElementById('chessboard');
const turnIndicator = document.getElementById('turnIndicator');
const gameStatus = document.getElementById('gameStatus');
const moveList = document.getElementById('moveList');
const newGameBtn = document.getElementById('newGameBtn');
const undoBtn = document.getElementById('undoBtn');
const promotionModal = document.getElementById('promotionModal');
const gameOverModal = document.getElementById('gameOverModal');

// Initialize game
function initGame() {
    console.log('Initializing chess game...');
    board = [
        ['B♜', 'B♞', 'B♝', 'B♛', 'B♚', 'B♝', 'B♞', 'B♜'],  // Black pieces (top)
        ['B♟', 'B♟', 'B♟', 'B♟', 'B♟', 'B♟', 'B♟', 'B♟'],  // Black pawns
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        ['W♟', 'W♟', 'W♟', 'W♟', 'W♟', 'W♟', 'W♟', 'W♟'],  // White pawns
        ['W♜', 'W♞', 'W♝', 'W♛', 'W♚', 'W♝', 'W♞', 'W♜']   // White pieces (bottom)
    ];

    currentPlayer = 'white';
    selectedSquare = null;
    validMoves = [];
    moveHistory = [];
    gameOver = false;
    whiteKingPos = { row: 7, col: 4 };
    blackKingPos = { row: 0, col: 4 };

    gameStatus.textContent = '';
    moveList.innerHTML = '';
    gameOverModal.classList.add('hidden');

    renderBoard();
    updateTurnIndicator();
    console.log('Chess game initialized. Current player:', currentPlayer);
}

// Render the chess board
function renderBoard() {
    chessboard.innerHTML = '';
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = 'square';
            square.className += (row + col) % 2 === 0 ? ' light' : ' dark';
            square.dataset.row = row;
            square.dataset.col = col;
            
            const piece = board[row][col];
            if (piece) {
                square.textContent = getPieceSymbol(piece);
                const pieceColor = getPieceColor(piece);
                square.classList.add(pieceColor + '-piece');
            }
            
            // Highlight selected square
            if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
                square.classList.add('selected');
            }
            
            // Highlight valid moves
            if (validMoves.some(move => move.row === row && move.col === col)) {
                square.classList.add('valid-move');
                if (board[row][col]) {
                    square.classList.add('valid-capture');
                }
            }
            
            // Highlight king in check
            try {
                if (isKingInCheck(currentPlayer)) {
                    const kingPos = currentPlayer === 'white' ? whiteKingPos : blackKingPos;
                    if (row === kingPos.row && col === kingPos.col) {
                        square.classList.add('in-check');
                    }
                }
            } catch (error) {
                console.error('Error checking for check:', error);
            }

            square.addEventListener('click', () => handleSquareClick(row, col));
            chessboard.appendChild(square);
        }
    }
}

// Handle square click
function handleSquareClick(row, col) {
    console.log('Square clicked:', row, col, 'Piece:', board[row][col]);
    if (gameOver) return;

    const piece = board[row][col];
    console.log('Current player:', currentPlayer, 'Piece color:', piece ? getPieceColor(piece) : 'none');

    // If a square is already selected
    if (selectedSquare) {
        // Check if clicked square is a valid move
        const isValidMove = validMoves.some(move => move.row === row && move.col === col);

        if (isValidMove) {
            makeMove(selectedSquare, { row, col });
            selectedSquare = null;
            validMoves = [];
        } else if (piece && getPieceColor(piece) === currentPlayer) {
            // Select a different piece of the same color
            selectedSquare = { row, col };
            validMoves = getValidMoves(row, col);
            console.log('Valid moves:', validMoves);
        } else {
            // Deselect
            selectedSquare = null;
            validMoves = [];
        }
    } else {
        // Select a piece
        if (piece && getPieceColor(piece) === currentPlayer) {
            selectedSquare = { row, col };
            validMoves = getValidMoves(row, col);
            console.log('Selected piece, valid moves:', validMoves);
        }
    }

    renderBoard();
}

// Make a move
function makeMove(from, to) {
    const piece = board[from.row][from.col];
    const capturedPiece = board[to.row][to.col];
    
    // Save move for history
    moveHistory.push({
        from: { ...from },
        to: { ...to },
        piece: piece,
        captured: capturedPiece,
        player: currentPlayer
    });
    
    // Move the piece
    board[to.row][to.col] = piece;
    board[from.row][from.col] = null;
    
    // Update king position
    if (piece === 'W♚') whiteKingPos = to;
    if (piece === 'B♚') blackKingPos = to;
    
    // Check for pawn promotion
    if ((piece === 'W♟' && to.row === 0) || (piece === 'B♟' && to.row === 7)) {
        showPromotionModal(to);
        return;
    }
    
    // Add move to history display
    addMoveToHistory(from, to, piece, capturedPiece);
    
    // Switch player
    switchPlayer();
}

// Get piece color
function getPieceColor(piece) {
    if (!piece) return null;
    return piece.startsWith('W') ? 'white' : 'black';
}

// Get piece symbol without color prefix
function getPieceSymbol(piece) {
    if (!piece) return '';
    return piece.substring(1);
}

// Check if square is valid
function isValidSquare(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
}

// Get valid moves for a piece
function getValidMoves(row, col) {
    const piece = board[row][col];
    if (!piece) return [];

    const color = getPieceColor(piece);
    const symbol = getPieceSymbol(piece);
    let moves = [];

    if (symbol === '♟') {
        moves = getPawnMoves(row, col, color);
    } else if (symbol === '♜') {
        moves = getRookMoves(row, col, color);
    } else if (symbol === '♞') {
        moves = getKnightMoves(row, col, color);
    } else if (symbol === '♝') {
        moves = getBishopMoves(row, col, color);
    } else if (symbol === '♛') {
        moves = getQueenMoves(row, col, color);
    } else if (symbol === '♚') {
        moves = getKingMoves(row, col, color);
    }

    // Filter out moves that would put own king in check
    return moves.filter(move => !wouldBeInCheck(color, { row, col }, move));
}

// Pawn moves
function getPawnMoves(row, col, color) {
    const moves = [];
    const direction = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;
    
    // Forward move
    if (isValidSquare(row + direction, col) && !board[row + direction][col]) {
        moves.push({ row: row + direction, col });
        
        // Double move from start
        if (row === startRow && !board[row + 2 * direction][col]) {
            moves.push({ row: row + 2 * direction, col });
        }
    }
    
    // Captures
    for (const dcol of [-1, 1]) {
        const newRow = row + direction;
        const newCol = col + dcol;
        if (isValidSquare(newRow, newCol) && board[newRow][newCol] && 
            getPieceColor(board[newRow][newCol]) !== color) {
            moves.push({ row: newRow, col: newCol });
        }
    }
    
    return moves;
}

// Rook moves
function getRookMoves(row, col, color) {
    return getSlidingMoves(row, col, color, [[0, 1], [0, -1], [1, 0], [-1, 0]]);
}

// Bishop moves
function getBishopMoves(row, col, color) {
    return getSlidingMoves(row, col, color, [[1, 1], [1, -1], [-1, 1], [-1, -1]]);
}

// Queen moves
function getQueenMoves(row, col, color) {
    return getSlidingMoves(row, col, color, [
        [0, 1], [0, -1], [1, 0], [-1, 0],
        [1, 1], [1, -1], [-1, 1], [-1, -1]
    ]);
}

// Sliding moves (for rook, bishop, queen)
function getSlidingMoves(row, col, color, directions) {
    const moves = [];
    
    for (const [drow, dcol] of directions) {
        let newRow = row + drow;
        let newCol = col + dcol;
        
        while (isValidSquare(newRow, newCol)) {
            if (!board[newRow][newCol]) {
                moves.push({ row: newRow, col: newCol });
            } else {
                if (getPieceColor(board[newRow][newCol]) !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
                break;
            }
            newRow += drow;
            newCol += dcol;
        }
    }
    
    return moves;
}

// Knight moves
function getKnightMoves(row, col, color) {
    const moves = [];
    const offsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    
    for (const [drow, dcol] of offsets) {
        const newRow = row + drow;
        const newCol = col + dcol;
        
        if (isValidSquare(newRow, newCol)) {
            if (!board[newRow][newCol] || getPieceColor(board[newRow][newCol]) !== color) {
                moves.push({ row: newRow, col: newCol });
            }
        }
    }
    
    return moves;
}

// King moves
function getKingMoves(row, col, color) {
    const moves = [];
    const offsets = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];
    
    for (const [drow, dcol] of offsets) {
        const newRow = row + drow;
        const newCol = col + dcol;
        
        if (isValidSquare(newRow, newCol)) {
            if (!board[newRow][newCol] || getPieceColor(board[newRow][newCol]) !== color) {
                moves.push({ row: newRow, col: newCol });
            }
        }
    }
    
    return moves;
}

// Check if king is in check
function isKingInCheck(color) {
    const kingPos = color === 'white' ? whiteKingPos : blackKingPos;
    const opponentColor = color === 'white' ? 'black' : 'white';

    // Check if any opponent piece can attack the king
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && getPieceColor(piece) === opponentColor) {
                const moves = getValidMovesWithoutCheckTest(row, col);
                if (moves.some(move => move.row === kingPos.row && move.col === kingPos.col)) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Get valid moves without checking for check (to avoid infinite recursion)
function getValidMovesWithoutCheckTest(row, col) {
    const piece = board[row][col];
    if (!piece) return [];

    const color = getPieceColor(piece);
    const symbol = getPieceSymbol(piece);

    if (symbol === '♟') {
        return getPawnMoves(row, col, color);
    } else if (symbol === '♜') {
        return getRookMoves(row, col, color);
    } else if (symbol === '♞') {
        return getKnightMoves(row, col, color);
    } else if (symbol === '♝') {
        return getBishopMoves(row, col, color);
    } else if (symbol === '♛') {
        return getQueenMoves(row, col, color);
    } else if (symbol === '♚') {
        return getKingMoves(row, col, color);
    }

    return [];
}

// Check if move would put own king in check
function wouldBeInCheck(color, from, to) {
    // Simulate the move
    const originalPiece = board[to.row][to.col];
    board[to.row][to.col] = board[from.row][from.col];
    board[from.row][from.col] = null;

    // Update king position temporarily if moving king
    const piece = board[to.row][to.col];
    let originalKingPos = null;
    if (piece === 'W♚') {
        originalKingPos = { ...whiteKingPos };
        whiteKingPos = to;
    } else if (piece === 'B♚') {
        originalKingPos = { ...blackKingPos };
        blackKingPos = to;
    }

    const inCheck = isKingInCheck(color);

    // Restore board
    board[from.row][from.col] = board[to.row][to.col];
    board[to.row][to.col] = originalPiece;

    // Restore king position
    if (originalKingPos) {
        if (piece === 'W♚') whiteKingPos = originalKingPos;
        if (piece === 'B♚') blackKingPos = originalKingPos;
    }

    return inCheck;
}

// Check for checkmate or stalemate
function isCheckmate(color) {
    if (!isKingInCheck(color)) return false;
    return !hasValidMoves(color);
}

function isStalemate(color) {
    if (isKingInCheck(color)) return false;
    return !hasValidMoves(color);
}

function hasValidMoves(color) {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && getPieceColor(piece) === color) {
                const moves = getValidMoves(row, col);
                if (moves.length > 0) return true;
            }
        }
    }
    return false;
}

// Switch player
function switchPlayer() {
    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
    updateTurnIndicator();

    // Check game end conditions
    if (isCheckmate(currentPlayer)) {
        const winner = currentPlayer === 'white' ? 'Black' : 'White';
        endGame(`Checkmate! ${winner} wins!`);
    } else if (isStalemate(currentPlayer)) {
        endGame('Stalemate! Game is a draw.');
    } else if (isKingInCheck(currentPlayer)) {
        gameStatus.textContent = 'Check!';
    } else {
        gameStatus.textContent = '';
    }

    renderBoard();
}

// Update turn indicator
function updateTurnIndicator() {
    turnIndicator.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s Turn`;

    document.querySelectorAll('.player').forEach(player => {
        player.classList.remove('active');
    });

    if (currentPlayer === 'white') {
        document.querySelector('.white-player').classList.add('active');
    } else {
        document.querySelector('.black-player').classList.add('active');
    }
}

// Add move to history
function addMoveToHistory(from, to, piece, captured) {
    const moveNumber = Math.floor(moveHistory.length / 2) + 1;
    const fromSquare = String.fromCharCode(97 + from.col) + (8 - from.row);
    const toSquare = String.fromCharCode(97 + to.col) + (8 - to.row);
    const captureSymbol = captured ? 'x' : '-';

    const moveItem = document.createElement('div');
    moveItem.className = 'move-item';
    moveItem.innerHTML = `
        <span>${moveNumber}. ${piece} ${fromSquare}${captureSymbol}${toSquare}</span>
        <span>${currentPlayer === 'white' ? '⚪' : '⚫'}</span>
    `;
    moveList.appendChild(moveItem);
    moveList.scrollTop = moveList.scrollHeight;
}

// Show promotion modal
function showPromotionModal(position) {
    const color = currentPlayer;
    const pieces = color === 'white' ?
        [PIECES.white.queen, PIECES.white.rook, PIECES.white.bishop, PIECES.white.knight] :
        [PIECES.black.queen, PIECES.black.rook, PIECES.black.bishop, PIECES.black.knight];

    const promotionChoices = document.getElementById('promotionChoices');
    promotionChoices.innerHTML = '';

    pieces.forEach(piece => {
        const choice = document.createElement('div');
        choice.className = 'promotion-piece ' + color + '-piece';
        choice.textContent = getPieceSymbol(piece);
        choice.addEventListener('click', () => {
            board[position.row][position.col] = piece;
            promotionModal.classList.add('hidden');

            // Clear selection and valid moves
            selectedSquare = null;
            validMoves = [];

            // Render board to show the promoted piece
            renderBoard();

            // Switch to other player
            switchPlayer();
        });
        promotionChoices.appendChild(choice);
    });

    promotionModal.classList.remove('hidden');
}

// End game
function endGame(message) {
    gameOver = true;
    document.getElementById('gameOverTitle').textContent = 'Game Over';
    document.getElementById('gameOverMessage').textContent = message;
    gameOverModal.classList.remove('hidden');
}

// Undo move
function undoMove() {
    if (moveHistory.length === 0) return;

    const lastMove = moveHistory.pop();
    board[lastMove.from.row][lastMove.from.col] = lastMove.piece;
    board[lastMove.to.row][lastMove.to.col] = lastMove.captured;

    // Restore king position
    if (lastMove.piece === 'W♚') whiteKingPos = lastMove.from;
    if (lastMove.piece === 'B♚') blackKingPos = lastMove.from;

    currentPlayer = lastMove.player;
    gameStatus.textContent = '';

    // Remove last move from display
    if (moveList.lastChild) {
        moveList.removeChild(moveList.lastChild);
    }

    updateTurnIndicator();
    renderBoard();
}

// Event listeners
newGameBtn.addEventListener('click', initGame);
undoBtn.addEventListener('click', undoMove);
document.getElementById('newGameFromModal').addEventListener('click', () => {
    gameOverModal.classList.add('hidden');
    initGame();
});

// Initialize game on load
initGame();
