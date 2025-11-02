// Game state
let deck = [];
let stock = [];
let waste = [];
let foundations = [[], [], [], []];
let tableau = [[], [], [], [], [], [], []];
let score = 0;
let moves = 0;
let time = 0;
let timerInterval = null;
let selectedCard = null;
let selectedPile = null;
let moveHistory = [];

// Card suits and ranks
const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const suitSymbols = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };

// DOM elements
const scoreElement = document.getElementById('score');
const movesElement = document.getElementById('moves');
const timeElement = document.getElementById('time');
const messageBox = document.getElementById('message');
const newGameBtn = document.getElementById('newGameBtn');
const undoBtn = document.getElementById('undoBtn');
const hintBtn = document.getElementById('hintBtn');
const backBtn = document.getElementById('backBtn');
const winModal = document.getElementById('winModal');
const finalScore = document.getElementById('finalScore');
const finalMoves = document.getElementById('finalMoves');
const finalTime = document.getElementById('finalTime');
const playAgainBtn = document.getElementById('playAgainBtn');

// Initialize game
function initGame() {
    // Reset state
    deck = [];
    stock = [];
    waste = [];
    foundations = [[], [], [], []];
    tableau = [[], [], [], [], [], [], []];
    score = 0;
    moves = 0;
    time = 0;
    selectedCard = null;
    selectedPile = null;
    moveHistory = [];
    
    // Stop timer
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // Create deck
    for (let suit of suits) {
        for (let rank of ranks) {
            deck.push({
                suit,
                rank,
                color: (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black',
                faceUp: false
            });
        }
    }
    
    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    // Deal to tableau
    for (let i = 0; i < 7; i++) {
        for (let j = i; j < 7; j++) {
            const card = deck.pop();
            if (i === j) {
                card.faceUp = true;
            }
            tableau[j].push(card);
        }
    }
    
    // Remaining cards go to stock
    stock = deck;
    
    // Start timer
    timerInterval = setInterval(() => {
        time++;
        updateDisplay();
    }, 1000);
    
    updateDisplay();
    render();
    showMessage('Click cards to select, then click destination. Double-click to auto-move to foundation!');
}

// Update display
function updateDisplay() {
    scoreElement.textContent = score;
    movesElement.textContent = moves;
    
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    timeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    undoBtn.disabled = moveHistory.length === 0;
}

// Show message
function showMessage(msg) {
    messageBox.textContent = msg;
    if (msg) {
        setTimeout(() => {
            messageBox.textContent = '';
        }, 3000);
    }
}

// Render game
function render() {
    // Render stock
    const stockElement = document.getElementById('stock');
    const stockPlaceholder = stockElement.querySelector('.card-placeholder');

    // Remove existing cards
    const existingStockCards = stockElement.querySelectorAll('.card');
    existingStockCards.forEach(card => card.remove());

    if (stock.length === 0) {
        // Show reset icon if waste has cards
        if (waste.length > 0) {
            if (stockPlaceholder) {
                stockPlaceholder.style.display = 'flex';
                stockPlaceholder.textContent = '↻';
                stockPlaceholder.style.cursor = 'pointer';
                stockPlaceholder.onclick = drawFromStock;
            }
        } else {
            if (stockPlaceholder) {
                stockPlaceholder.style.display = 'flex';
                stockPlaceholder.textContent = 'Stock';
                stockPlaceholder.style.cursor = 'default';
                stockPlaceholder.onclick = null;
            }
        }
    } else {
        if (stockPlaceholder) stockPlaceholder.style.display = 'none';
        const cardElement = document.createElement('div');
        cardElement.className = 'card face-down';
        cardElement.style.cursor = 'pointer';
        cardElement.addEventListener('click', drawFromStock);
        stockElement.appendChild(cardElement);
    }

    // Render waste
    renderPile('waste', waste, true);

    // Render foundations
    for (let i = 0; i < 4; i++) {
        renderPile(`foundation-${i}`, foundations[i], true);
    }

    // Render tableau
    for (let i = 0; i < 7; i++) {
        renderTableauPile(i);
    }
}

// Render a pile (waste and foundations)
function renderPile(pileId, cards, showTop) {
    const pileElement = document.getElementById(pileId);
    const placeholder = pileElement.querySelector('.card-placeholder');

    // Remove existing cards
    const existingCards = pileElement.querySelectorAll('.card');
    existingCards.forEach(card => card.remove());

    if (cards.length === 0) {
        if (placeholder) placeholder.style.display = 'flex';
        return;
    }

    if (placeholder) placeholder.style.display = 'none';

    // For waste pile, show last 3 cards with offset
    if (pileId === 'waste') {
        const startIndex = Math.max(0, cards.length - 3);
        for (let i = startIndex; i < cards.length; i++) {
            const card = cards[i];
            const cardElement = createCardElement(card, pileId, i);
            cardElement.style.left = `${(i - startIndex) * 30}px`;
            cardElement.style.zIndex = i;
            pileElement.appendChild(cardElement);
        }
    } else {
        // Only show top card for foundations
        const card = cards[cards.length - 1];
        const cardElement = createCardElement(card, pileId, cards.length - 1);
        pileElement.appendChild(cardElement);
    }
}

// Render tableau pile
function renderTableauPile(pileIndex) {
    const pileElement = document.getElementById(`tableau-${pileIndex}`);

    // Remove existing cards
    const existingCards = pileElement.querySelectorAll('.card');
    existingCards.forEach(card => card.remove());

    const cards = tableau[pileIndex];

    // Add click handler for empty tableau
    if (cards.length === 0) {
        pileElement.style.cursor = 'pointer';
        pileElement.onclick = () => {
            if (selectedCard && selectedPile) {
                attemptMove(selectedPile, `tableau-${pileIndex}`, 0);
            }
        };
    } else {
        pileElement.style.cursor = 'default';
        pileElement.onclick = null;
    }

    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const cardElement = createCardElement(card, `tableau-${pileIndex}`, i);
        cardElement.style.top = `${i * 25}px`;
        pileElement.appendChild(cardElement);
    }
}

// Create card element
function createCardElement(card, pileId, cardIndex) {
    const cardElement = document.createElement('div');
    cardElement.className = `card ${card.color}`;
    cardElement.dataset.pile = pileId;
    cardElement.dataset.index = cardIndex;
    
    if (!card.faceUp) {
        cardElement.classList.add('face-down');
        return cardElement;
    }
    
    // Top rank and suit
    const topRank = document.createElement('div');
    topRank.className = 'card-rank';
    topRank.textContent = card.rank;
    
    const topSuit = document.createElement('div');
    topSuit.className = 'card-suit';
    topSuit.textContent = suitSymbols[card.suit];
    
    // Center suit
    const centerSuit = document.createElement('div');
    centerSuit.className = 'card-center';
    centerSuit.textContent = suitSymbols[card.suit];
    
    cardElement.appendChild(topRank);
    cardElement.appendChild(topSuit);
    cardElement.appendChild(centerSuit);
    
    // Add click handler
    cardElement.addEventListener('click', () => handleCardClick(pileId, cardIndex));

    // Add double-click handler for auto-move to foundation
    cardElement.addEventListener('dblclick', () => handleCardDoubleClick(pileId, cardIndex));

    return cardElement;
}

// Handle card click
function handleCardClick(pileId, cardIndex) {
    // Handle stock click
    if (pileId === 'stock') {
        drawFromStock();
        return;
    }

    // Get the card
    let card, pile;

    if (pileId === 'waste') {
        pile = waste;
        card = pile[cardIndex];
    } else if (pileId.startsWith('foundation')) {
        const foundationIndex = parseInt(pileId.split('-')[1]);
        pile = foundations[foundationIndex];
        card = pile[cardIndex];
    } else if (pileId.startsWith('tableau')) {
        const tableauIndex = parseInt(pileId.split('-')[1]);
        pile = tableau[tableauIndex];
        card = pile[cardIndex];
    }

    if (!card || !card.faceUp) return;

    // If no card selected, select this card
    if (!selectedCard) {
        selectedCard = card;
        selectedPile = pileId;
        document.querySelector(`[data-pile="${pileId}"][data-index="${cardIndex}"]`)?.classList.add('selected');
        showMessage('Card selected. Click destination or double-click to auto-move.');
        return;
    }

    // If same card clicked, deselect
    if (selectedCard === card) {
        document.querySelector('.card.selected')?.classList.remove('selected');
        selectedCard = null;
        selectedPile = null;
        showMessage('');
        return;
    }

    // Try to move selected card to this pile
    attemptMove(selectedPile, pileId, cardIndex);
}

// Handle card double-click (auto-move to foundation)
function handleCardDoubleClick(pileId, cardIndex) {
    // Get the card
    let card;

    if (pileId === 'waste') {
        card = waste[cardIndex];
    } else if (pileId.startsWith('tableau')) {
        const tableauIndex = parseInt(pileId.split('-')[1]);
        card = tableau[tableauIndex][cardIndex];
    } else {
        return;
    }

    if (!card || !card.faceUp) return;

    // Try to move to any foundation
    for (let i = 0; i < 4; i++) {
        if (canMoveToFoundation(card, foundations[i])) {
            selectedCard = card;
            selectedPile = pileId;
            if (moveToFoundation(pileId, i)) {
                moves++;
                score += 5; // Bonus for double-click
                updateDisplay();
                render();
                checkWin();
                showMessage('Auto-moved to foundation!');
                selectedCard = null;
                selectedPile = null;
                return;
            }
        }
    }

    showMessage('Cannot move to foundation');
}

// Draw from stock
function drawFromStock() {
    if (stock.length === 0) {
        // Reset stock from waste
        if (waste.length === 0) return;
        
        stock = waste.reverse();
        stock.forEach(card => card.faceUp = false);
        waste = [];
        
        moves++;
        updateDisplay();
        render();
        return;
    }
    
    const card = stock.pop();
    card.faceUp = true;
    waste.push(card);
    
    moves++;
    updateDisplay();
    render();
}

// Attempt move
function attemptMove(fromPileId, toPileId, toCardIndex) {
    // Clear selection
    document.querySelector('.card.selected')?.classList.remove('selected');

    let moved = false;

    // Move to foundation
    if (toPileId.startsWith('foundation')) {
        const foundationIndex = parseInt(toPileId.split('-')[1]);
        moved = moveToFoundation(fromPileId, foundationIndex);
    }
    // Move to tableau
    else if (toPileId.startsWith('tableau')) {
        const tableauIndex = parseInt(toPileId.split('-')[1]);
        moved = moveToTableau(fromPileId, tableauIndex);
    }

    if (moved) {
        moves++;
        updateDisplay();
        render();
        checkWin();
    }

    selectedCard = null;
    selectedPile = null;
}

// Move to foundation
function moveToFoundation(fromPileId, foundationIndex) {
    let card, fromPile, fromIndex;

    if (fromPileId === 'waste') {
        fromPile = waste;
        fromIndex = waste.length - 1;
        card = waste[fromIndex];
    } else if (fromPileId.startsWith('tableau')) {
        const tableauIndex = parseInt(fromPileId.split('-')[1]);
        fromPile = tableau[tableauIndex];
        fromIndex = fromPile.length - 1;
        card = fromPile[fromIndex];
    } else {
        return false;
    }

    if (!card) return false;

    const foundation = foundations[foundationIndex];

    // Check if move is valid
    if (foundation.length === 0) {
        // Must be an Ace
        if (card.rank !== 'A') return false;
    } else {
        const topCard = foundation[foundation.length - 1];
        // Must be same suit and next rank
        if (card.suit !== topCard.suit) return false;
        if (ranks.indexOf(card.rank) !== ranks.indexOf(topCard.rank) + 1) return false;
    }

    // Move card
    fromPile.splice(fromIndex, 1);
    foundation.push(card);

    // Flip top card in tableau if needed
    if (fromPileId.startsWith('tableau')) {
        const tableauIndex = parseInt(fromPileId.split('-')[1]);
        const pile = tableau[tableauIndex];
        if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
            pile[pile.length - 1].faceUp = true;
        }
    }

    score += 10;
    showMessage('Moved to foundation!');
    return true;
}

// Move to tableau
function moveToTableau(fromPileId, toTableauIndex) {
    let cards, fromPile, fromIndex;

    if (fromPileId === 'waste') {
        fromPile = waste;
        fromIndex = waste.length - 1;
        cards = [waste[fromIndex]];
    } else if (fromPileId.startsWith('tableau')) {
        const fromTableauIndex = parseInt(fromPileId.split('-')[1]);
        fromPile = tableau[fromTableauIndex];

        // Find the first face-up card that was clicked
        fromIndex = -1;
        for (let i = 0; i < fromPile.length; i++) {
            if (fromPile[i] === selectedCard) {
                fromIndex = i;
                break;
            }
        }

        if (fromIndex === -1) return false;

        // Get all cards from this index to the end
        cards = fromPile.slice(fromIndex);
    } else if (fromPileId.startsWith('foundation')) {
        const foundationIndex = parseInt(fromPileId.split('-')[1]);
        fromPile = foundations[foundationIndex];
        fromIndex = fromPile.length - 1;
        cards = [fromPile[fromIndex]];
    } else {
        return false;
    }

    if (cards.length === 0) return false;

    const toPile = tableau[toTableauIndex];
    const movingCard = cards[0];

    // Check if move is valid
    if (toPile.length === 0) {
        // Only Kings can go on empty tableau
        if (movingCard.rank !== 'K') return false;
    } else {
        const topCard = toPile[toPile.length - 1];
        // Must be opposite color and one rank lower
        if (movingCard.color === topCard.color) return false;
        if (ranks.indexOf(movingCard.rank) !== ranks.indexOf(topCard.rank) - 1) return false;
    }

    // Move cards
    fromPile.splice(fromIndex, cards.length);
    toPile.push(...cards);

    // Flip top card in source tableau if needed
    if (fromPileId.startsWith('tableau')) {
        const fromTableauIndex = parseInt(fromPileId.split('-')[1]);
        const pile = tableau[fromTableauIndex];
        if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
            pile[pile.length - 1].faceUp = true;
        }
    }

    score += 5;
    return true;
}

// Check win
function checkWin() {
    const totalCards = foundations.reduce((sum, pile) => sum + pile.length, 0);

    if (totalCards === 52) {
        clearInterval(timerInterval);
        timerInterval = null;

        finalScore.textContent = score;
        finalMoves.textContent = moves;

        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        finalTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        winModal.classList.remove('hidden');
    }
}

// Auto-move to foundation (for hint/double-click)
function autoMoveToFoundation() {
    // Try to move from waste
    if (waste.length > 0) {
        for (let i = 0; i < 4; i++) {
            if (canMoveToFoundation(waste[waste.length - 1], foundations[i])) {
                selectedCard = waste[waste.length - 1];
                selectedPile = 'waste';
                if (moveToFoundation('waste', i)) {
                    moves++;
                    updateDisplay();
                    render();
                    return true;
                }
            }
        }
    }

    // Try to move from tableau
    for (let t = 0; t < 7; t++) {
        const pile = tableau[t];
        if (pile.length > 0) {
            const card = pile[pile.length - 1];
            if (card.faceUp) {
                for (let i = 0; i < 4; i++) {
                    if (canMoveToFoundation(card, foundations[i])) {
                        selectedCard = card;
                        selectedPile = `tableau-${t}`;
                        if (moveToFoundation(`tableau-${t}`, i)) {
                            moves++;
                            updateDisplay();
                            render();
                            return true;
                        }
                    }
                }
            }
        }
    }

    return false;
}

// Check if card can move to foundation
function canMoveToFoundation(card, foundation) {
    if (foundation.length === 0) {
        return card.rank === 'A';
    }

    const topCard = foundation[foundation.length - 1];
    return card.suit === topCard.suit &&
           ranks.indexOf(card.rank) === ranks.indexOf(topCard.rank) + 1;
}

// Event listeners
newGameBtn.addEventListener('click', initGame);
hintBtn.addEventListener('click', () => {
    if (autoMoveToFoundation()) {
        showMessage('Auto-moved to foundation!');
    } else {
        showMessage('No obvious moves available');
    }
});
playAgainBtn.addEventListener('click', () => {
    winModal.classList.add('hidden');
    initGame();
});
backBtn.addEventListener('click', () => window.location.href = '../index.html');

// Initialize
initGame();


