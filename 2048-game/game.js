const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let tiles = []; // Array of {id, currentX, currentY, finalX, finalY, value, scale, isPulsing}
let score = 0;
let best = localStorage.getItem('2048-best') || 0;
let animating = false;
let tileIdCounter = 0;
document.getElementById('best').textContent = best;

const GRID_SIZE = 4;
const CELL_SIZE = 100;
const CELL_GAP = 10;
const PADDING = 10;
const SLIDE_SPEED = 0.3; // How much to move per frame (0-1)
const PULSE_SPEED = 0.08; // How much to pulse per frame

function getTileColor(value) {
    const colors = {
        2: ['#ff1493', '#ff4500'],
        4: ['#ff0080', '#ff6347'],
        8: ['#ff1493', '#ffa500'],
        16: ['#ff00ff', '#ff4500'],
        32: ['#ff1493', '#ff8c00'],
        64: ['#ff0066', '#ff6600'],
        128: ['#ff1493', '#ffd700'],
        256: ['#ff00cc', '#ffaa00'],
        512: ['#ff1493', '#ffcc00'],
        1024: ['#ff0099', '#ffdd00'],
        2048: ['#ff1493', '#ffd700']
    };
    return colors[value] || ['#ff1493', '#ff4500'];
}

function drawCell(x, y) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.strokeStyle = 'rgba(255, 20, 147, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, CELL_SIZE, CELL_SIZE, 10);
    ctx.fill();
    ctx.stroke();
}

function drawTile(x, y, value, scale = 1) {
    const [color1, color2] = getTileColor(value);

    ctx.save();
    ctx.translate(x + CELL_SIZE / 2, y + CELL_SIZE / 2);
    ctx.scale(scale, scale);
    ctx.translate(-CELL_SIZE / 2, -CELL_SIZE / 2);

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, CELL_SIZE, CELL_SIZE);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);

    ctx.fillStyle = gradient;
    ctx.strokeStyle = 'rgba(255, 20, 147, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(0, 0, CELL_SIZE, CELL_SIZE, 10);
    ctx.fill();
    ctx.stroke();

    // Draw text
    ctx.fillStyle = 'white';
    ctx.font = `bold ${value >= 1000 ? 32 : value >= 128 ? 36 : 42}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(value, CELL_SIZE / 2, CELL_SIZE / 2);

    ctx.restore();
}

function getCellPixelPosition(gridX, gridY) {
    return {
        x: PADDING + gridX * (CELL_SIZE + CELL_GAP),
        y: PADDING + gridY * (CELL_SIZE + CELL_GAP)
    };
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background cells
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const pos = getCellPixelPosition(x, y);
            drawCell(pos.x, pos.y);
        }
    }

    // Sort tiles by value (lowest first) so highest values render on top
    const sortedTiles = [...tiles].sort((a, b) => a.value - b.value);

    // Draw tiles at their current positions
    sortedTiles.forEach(tile => {
        const pos = getCellPixelPosition(tile.currentX, tile.currentY);
        const scale = tile.scale || 1;
        drawTile(pos.x, pos.y, tile.value, scale);
    });
}

function initBoard() {
    tiles = [];
    score = 0;
    updateScore();

    addRandomTile();
    addRandomTile();

    startGameLoop();
}

function getEmptyCells() {
    const occupied = new Set(tiles.map(t => `${t.finalX},${t.finalY}`));
    const empty = [];
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (!occupied.has(`${x},${y}`)) {
                empty.push({x, y});
            }
        }
    }
    return empty;
}

function addRandomTile() {
    const emptyCells = getEmptyCells();
    if (emptyCells.length > 0) {
        const {x, y} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const value = Math.random() < 0.9 ? 2 : 4;

        const newTile = {
            id: tileIdCounter++,
            currentX: x,
            currentY: y,
            finalX: x,
            finalY: y,
            value: value,
            scale: 0,
            isNew: true
        };
        tiles.push(newTile);
    }
}

function startGameLoop() {
    function gameLoop() {
        update();
        render();
        requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop);
}

function update() {
    let allAtFinal = true;

    // Update tile positions
    tiles.forEach(tile => {
        // Handle new tile pop-in animation
        if (tile.isNew) {
            if (tile.scale < 1) {
                tile.scale = Math.min(tile.scale + 0.15, 1);
                allAtFinal = false;
            } else {
                delete tile.isNew;
            }
        }

        // Handle pulsing merged tiles
        if (tile.isPulsing !== undefined) {
            tile.isPulsing += PULSE_SPEED;
            if (tile.isPulsing >= 1) {
                tile.scale = 1;
                delete tile.isPulsing;
            } else {
                // Pulse: 0.8 -> 1.1 -> 1.0
                if (tile.isPulsing < 0.5) {
                    tile.scale = 0.8 + (1.1 - 0.8) * (tile.isPulsing / 0.5);
                } else {
                    tile.scale = 1.1 - (1.1 - 1.0) * ((tile.isPulsing - 0.5) / 0.5);
                }
                allAtFinal = false;
            }
        }

        // Slide tiles toward final position
        if (tile.currentX !== tile.finalX || tile.currentY !== tile.finalY) {
            const dx = tile.finalX - tile.currentX;
            const dy = tile.finalY - tile.currentY;

            tile.currentX += dx * SLIDE_SPEED;
            tile.currentY += dy * SLIDE_SPEED;

            // Snap to final if very close
            if (Math.abs(tile.finalX - tile.currentX) < 0.01) tile.currentX = tile.finalX;
            if (Math.abs(tile.finalY - tile.currentY) < 0.01) tile.currentY = tile.finalY;

            allAtFinal = false;
        }
    });

    // When all tiles reach final position, handle merges
    if (allAtFinal && animating) {
        handleMerges();
        animating = false;

        setTimeout(() => {
            addRandomTile();

            if (checkWin()) {
                showGameOver('You Win! 🎉', 'You reached 2048!');
            } else if (checkGameOver()) {
                showGameOver('Game Over!', 'No more moves available!');
            }
        }, 100);
    }
}

function updateScore() {
    document.getElementById('score').textContent = score;
    if (score > best) {
        best = score;
        localStorage.setItem('2048-best', best);
        document.getElementById('best').textContent = best;
    }
}

function move(direction) {
    if (animating) return;

    const dx = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
    const dy = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;

    const isHorizontal = dx !== 0;

    // Group tiles by row or column
    const lines = isHorizontal ?
        Array.from({length: GRID_SIZE}, (_, y) =>
            tiles.filter(t => t.finalY === y).sort((a, b) => dx > 0 ? b.finalX - a.finalX : a.finalX - b.finalX)
        ) :
        Array.from({length: GRID_SIZE}, (_, x) =>
            tiles.filter(t => t.finalX === x).sort((a, b) => dy > 0 ? b.finalY - a.finalY : a.finalY - b.finalY)
        );

    let hasMoved = false;
    const mergeTargets = []; // Track which tiles will merge: {x, y, tile1, tile2}

    lines.forEach(line => {
        let targetPos = dx > 0 ? GRID_SIZE - 1 : dy > 0 ? GRID_SIZE - 1 : 0;
        let i = 0;

        while (i < line.length) {
            const tile = line[i];

            // Check if next tile can merge
            if (i + 1 < line.length && tile.value === line[i + 1].value) {
                // These two tiles will merge
                const finalX = isHorizontal ? targetPos : tile.finalX;
                const finalY = isHorizontal ? tile.finalY : targetPos;

                tile.finalX = finalX;
                tile.finalY = finalY;
                line[i + 1].finalX = finalX;
                line[i + 1].finalY = finalY;

                mergeTargets.push({x: finalX, y: finalY, tile1: tile, tile2: line[i + 1]});

                if (tile.currentX !== finalX || tile.currentY !== finalY ||
                    line[i + 1].currentX !== finalX || line[i + 1].currentY !== finalY) {
                    hasMoved = true;
                }

                targetPos += (dx !== 0 ? -dx : -dy);
                i += 2; // Skip both tiles
            } else {
                // Single tile, just slide
                const finalX = isHorizontal ? targetPos : tile.finalX;
                const finalY = isHorizontal ? tile.finalY : targetPos;

                if (tile.currentX !== finalX || tile.currentY !== finalY) {
                    hasMoved = true;
                }

                tile.finalX = finalX;
                tile.finalY = finalY;

                targetPos += (dx !== 0 ? -dx : -dy);
                i++;
            }
        }
    });

    if (!hasMoved) return;

    animating = true;

    // Store merge info for later
    tiles.forEach(tile => {
        const merge = mergeTargets.find(m => m.tile1 === tile || m.tile2 === tile);
        if (merge) {
            tile.willMerge = merge;
        }
    });

    updateScore();
}

function handleMerges() {
    const toRemove = [];
    const toAdd = [];

    // Find tiles that have willMerge flag
    const mergeGroups = new Map(); // key: "x,y", value: [tile1, tile2]

    tiles.forEach(tile => {
        if (tile.willMerge) {
            const key = `${tile.finalX},${tile.finalY}`;
            if (!mergeGroups.has(key)) {
                mergeGroups.set(key, []);
            }
            mergeGroups.get(key).push(tile);
        }
    });

    // Create merged tiles
    mergeGroups.forEach((group, key) => {
        if (group.length === 2) {
            const [x, y] = key.split(',').map(Number);

            // Mark originals for removal
            toRemove.push(group[0].id, group[1].id);

            // Create merged tile at same position
            toAdd.push({
                id: tileIdCounter++,
                currentX: x,
                currentY: y,
                finalX: x,
                finalY: y,
                value: group[0].value * 2,
                scale: 0.8,
                isPulsing: 0
            });

            score += group[0].value * 2;
        }
    });

    // Remove old tiles and add merged tiles
    tiles = tiles.filter(t => !toRemove.includes(t.id));
    toAdd.forEach(t => tiles.push(t));

    updateScore();
}



function checkWin() {
    return tiles.some(t => t.value === 2048);
}

function checkGameOver() {
    // Check if board is full
    if (tiles.length < GRID_SIZE * GRID_SIZE) return false;

    // Check for possible merges
    for (let tile of tiles) {
        // Check right neighbor
        const rightNeighbor = tiles.find(t => t.x === tile.x + 1 && t.y === tile.y);
        if (rightNeighbor && rightNeighbor.value === tile.value) return false;

        // Check down neighbor
        const downNeighbor = tiles.find(t => t.x === tile.x && t.y === tile.y + 1);
        if (downNeighbor && downNeighbor.value === tile.value) return false;
    }

    return true;
}

function showGameOver(title, message) {
    document.getElementById('gameOverTitle').textContent = title;
    document.getElementById('gameOverMessage').innerHTML = message + '<br>Your score: <span id="finalScore">' + score + '</span>';
    document.getElementById('gameOver').classList.add('show');
}

function newGame() {
    document.getElementById('gameOver').classList.remove('show');
    initBoard();
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        move('up');
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        move('down');
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        move('left');
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        move('right');
    }
});

// Touch support for mobile
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 30) move('right');
        else if (dx < -30) move('left');
    } else {
        if (dy > 30) move('down');
        else if (dy < -30) move('up');
    }
});

initBoard();

