// Game state
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let timer = 0;
let timerInterval = null;
let canFlip = true;
let difficulty = 'easy';

// Card symbols (emojis)
const symbols = [
    '🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎬', '🎤',
    '🎸', '🎹', '🎺', '🎻', '🎼', '🎵', '🎶', '🎧',
    '🏀', '⚽', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱',
    '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒',
    '🌟', '⭐', '✨', '💫'
];

// Difficulty settings
const difficultySettings = {
    easy: { rows: 4, cols: 4, pairs: 8 },
    medium: { rows: 5, cols: 4, pairs: 10 },
    hard: { rows: 6, cols: 6, pairs: 18 }
};

// DOM elements
const gameBoard = document.getElementById('gameBoard');
const movesDisplay = document.getElementById('moves');
const matchesDisplay = document.getElementById('matches');
const timerDisplay = document.getElementById('timer');
const newGameBtn = document.getElementById('newGameBtn');
const backBtn = document.getElementById('backBtn');
const difficultyBtns = document.querySelectorAll('.difficulty-btn');
const winModal = document.getElementById('winModal');
const playAgainBtn = document.getElementById('playAgainBtn');
const finalMovesDisplay = document.getElementById('finalMoves');
const finalTimeDisplay = document.getElementById('finalTime');

// Initialize game
function initGame() {
    // Reset state
    cards = [];
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    canFlip = true;
    
    // Clear timer
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timer = 0;
    
    // Update displays
    movesDisplay.textContent = moves;
    matchesDisplay.textContent = matchedPairs;
    timerDisplay.textContent = '0:00';
    
    // Generate cards
    generateCards();
    renderBoard();
}

// Generate cards based on difficulty
function generateCards() {
    const settings = difficultySettings[difficulty];
    const numPairs = settings.pairs;
    
    // Select random symbols
    const selectedSymbols = symbols.slice(0, numPairs);
    
    // Create pairs
    const cardSymbols = [...selectedSymbols, ...selectedSymbols];
    
    // Shuffle
    cardSymbols.sort(() => Math.random() - 0.5);
    
    // Create card objects
    cards = cardSymbols.map((symbol, index) => ({
        id: index,
        symbol: symbol,
        flipped: false,
        matched: false
    }));
}

// Render board
function renderBoard() {
    gameBoard.innerHTML = '';
    gameBoard.className = `game-board ${difficulty}`;
    
    cards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.id = card.id;
        
        const cardBack = document.createElement('div');
        cardBack.className = 'card-back';
        cardBack.textContent = '?';
        
        const cardFront = document.createElement('div');
        cardFront.className = 'card-front';
        cardFront.textContent = card.symbol;
        
        cardElement.appendChild(cardBack);
        cardElement.appendChild(cardFront);
        
        cardElement.addEventListener('click', () => handleCardClick(card.id));
        
        gameBoard.appendChild(cardElement);
    });
}

// Start timer
function startTimer() {
    if (!timerInterval) {
        timerInterval = setInterval(() => {
            timer++;
            const minutes = Math.floor(timer / 60);
            const seconds = timer % 60;
            timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }
}

// Handle card click
function handleCardClick(cardId) {
    if (!canFlip) return;

    const card = cards[cardId];
    const cardElement = document.querySelector(`[data-id="${cardId}"]`);

    // Can't flip if already flipped or matched
    if (card.flipped || card.matched) return;

    // Can't flip more than 2 cards
    if (flippedCards.length >= 2) return;

    // Start timer on first card flip
    if (moves === 0 && flippedCards.length === 0) {
        startTimer();
    }

    // Flip card
    card.flipped = true;
    cardElement.classList.add('flipped');
    flippedCards.push(card);

    // Check for match when 2 cards are flipped
    if (flippedCards.length === 2) {
        moves++;
        movesDisplay.textContent = moves;
        checkMatch();
    }
}

// Check if cards match
function checkMatch() {
    canFlip = false;
    
    const [card1, card2] = flippedCards;
    
    if (card1.symbol === card2.symbol) {
        // Match!
        setTimeout(() => {
            card1.matched = true;
            card2.matched = true;
            
            const card1Element = document.querySelector(`[data-id="${card1.id}"]`);
            const card2Element = document.querySelector(`[data-id="${card2.id}"]`);
            
            card1Element.classList.add('matched');
            card2Element.classList.add('matched');
            
            matchedPairs++;
            matchesDisplay.textContent = matchedPairs;
            
            flippedCards = [];
            canFlip = true;
            
            // Check if game is won
            const totalPairs = difficultySettings[difficulty].pairs;
            if (matchedPairs === totalPairs) {
                setTimeout(() => winGame(), 500);
            }
        }, 500);
    } else {
        // No match
        setTimeout(() => {
            card1.flipped = false;
            card2.flipped = false;
            
            const card1Element = document.querySelector(`[data-id="${card1.id}"]`);
            const card2Element = document.querySelector(`[data-id="${card2.id}"]`);
            
            card1Element.classList.remove('flipped');
            card2Element.classList.remove('flipped');
            
            flippedCards = [];
            canFlip = true;
        }, 1000);
    }
}

// Win game
function winGame() {
    clearInterval(timerInterval);
    
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    finalMovesDisplay.textContent = moves;
    finalTimeDisplay.textContent = timeString;
    
    winModal.classList.remove('hidden');
}

// Change difficulty
function changeDifficulty(newDifficulty) {
    difficulty = newDifficulty;
    
    // Update button states
    difficultyBtns.forEach(btn => {
        if (btn.dataset.level === difficulty) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    initGame();
}

// Event listeners
newGameBtn.addEventListener('click', initGame);
playAgainBtn.addEventListener('click', () => {
    winModal.classList.add('hidden');
    initGame();
});
backBtn.addEventListener('click', () => window.location.href = '../index.html');

difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        changeDifficulty(btn.dataset.level);
    });
});

// Initialize on load
initGame();

