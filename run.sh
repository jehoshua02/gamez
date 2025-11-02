#!/bin/bash

# Snake Game Server Runner
# This script starts a local HTTP server to run the games

PORT=8000

echo "🎮 Starting Game Server..."
echo "📂 Serving games from: $(pwd)"
echo "🌐 Server will be available at: http://localhost:$PORT"
echo ""
echo "Available games:"
echo "  - Snake Game: http://localhost:$PORT/snake-game/"
echo "  - Chess Game: http://localhost:$PORT/chess-game/"
echo "  - Tic-Tac-Toe: http://localhost:$PORT/tictactoe-game/"
echo "  - Flappy Bird: http://localhost:$PORT/flappybird-game/"
echo "  - Memory Match: http://localhost:$PORT/memory-game/"
echo "  - Asteroids: http://localhost:$PORT/asteroids-game/"
echo "  - Backgammon: http://localhost:$PORT/backgammon-game/"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    python -m http.server $PORT
else
    echo "❌ Error: Python is not installed or not in PATH"
    echo "Please install Python to run the server"
    exit 1
fi

