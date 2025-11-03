// Game State
let currentMode = '';
let currentDifficulty = 'easy';
let score = 0;
let streak = 0;
let bestStreak = 0;
let questionsAnswered = 0;
let correctCount = 0;
let totalQuestions = 10;
let currentQuestion = {};
let startTime = null;
let timerInterval = null;

// Difficulty ranges
const difficultyRanges = {
    easy: { min: 1, max: 10 },
    medium: { min: 1, max: 20 },
    hard: { min: 1, max: 50 }
};

// DOM Elements
const modeSelector = document.getElementById('modeSelector');
const gameArea = document.getElementById('gameArea');
const resultsModal = document.getElementById('resultsModal');
const questionEl = document.getElementById('question');
const answerInput = document.getElementById('answerInput');
const submitBtn = document.getElementById('submitBtn');
const feedbackEl = document.getElementById('feedback');
const scoreEl = document.getElementById('score');
const streakEl = document.getElementById('streak');
const timerEl = document.getElementById('timer');
const questionsAnsweredEl = document.getElementById('questionsAnswered');
const progressFill = document.getElementById('progressFill');
const backBtn = document.getElementById('backBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const changeGameBtn = document.getElementById('changeGameBtn');

// Mode buttons
const modeBtns = document.querySelectorAll('.mode-btn');
modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        currentMode = btn.dataset.mode;
        startGame();
    });
});

// Difficulty buttons
const difficultyBtns = document.querySelectorAll('.difficulty-btn');
difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        difficultyBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentDifficulty = btn.dataset.difficulty;
    });
});

// Submit answer
submitBtn.addEventListener('click', submitAnswer);
answerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        submitAnswer();
    }
});

// Back button
backBtn.addEventListener('click', () => {
    stopTimer();
    gameArea.style.display = 'none';
    modeSelector.style.display = 'block';
    resetGame();
});

// Play again button
playAgainBtn.addEventListener('click', () => {
    resultsModal.style.display = 'none';
    resetGame();
    startGame();
});

// Change game button
changeGameBtn.addEventListener('click', () => {
    resultsModal.style.display = 'none';
    gameArea.style.display = 'none';
    modeSelector.style.display = 'block';
    resetGame();
});

// Start game
function startGame() {
    resetGame();
    modeSelector.style.display = 'none';
    gameArea.style.display = 'block';
    startTimer();
    generateQuestion();
    answerInput.focus();
}

// Reset game
function resetGame() {
    score = 0;
    streak = 0;
    bestStreak = 0;
    questionsAnswered = 0;
    correctCount = 0;
    updateUI();
}

// Generate question
function generateQuestion() {
    const range = difficultyRanges[currentDifficulty];
    let num1, num2, answer, operator, questionText;

    switch (currentMode) {
        case 'addition':
            num1 = randomInt(range.min, range.max);
            num2 = randomInt(range.min, range.max);
            answer = num1 + num2;
            operator = '+';
            questionText = `${num1} + ${num2} = ?`;
            break;

        case 'subtraction':
            num1 = randomInt(range.min, range.max);
            num2 = randomInt(range.min, num1); // Ensure positive result
            answer = num1 - num2;
            operator = '−';
            questionText = `${num1} − ${num2} = ?`;
            break;

        case 'multiplication':
            num1 = randomInt(range.min, Math.min(range.max, 12)); // Cap at 12 for multiplication
            num2 = randomInt(range.min, Math.min(range.max, 12));
            answer = num1 * num2;
            operator = '×';
            questionText = `${num1} × ${num2} = ?`;
            break;

        case 'division':
            // Generate division that results in whole numbers
            num2 = randomInt(range.min, Math.min(range.max, 12));
            answer = randomInt(range.min, Math.min(range.max, 12));
            num1 = num2 * answer; // Ensure whole number result
            operator = '÷';
            questionText = `${num1} ÷ ${num2} = ?`;
            break;
    }

    currentQuestion = { num1, num2, answer, operator, questionText };
    questionEl.textContent = questionText;
    answerInput.value = '';
    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback';
}

// Submit answer
function submitAnswer() {
    const userAnswer = parseInt(answerInput.value);
    
    if (isNaN(userAnswer)) {
        feedbackEl.textContent = 'Please enter a number!';
        feedbackEl.className = 'feedback incorrect';
        return;
    }

    questionsAnswered++;

    if (userAnswer === currentQuestion.answer) {
        // Correct answer
        correctCount++;
        streak++;
        bestStreak = Math.max(bestStreak, streak);
        
        // Calculate points based on streak
        const points = 10 + (streak - 1) * 5;
        score += points;
        
        feedbackEl.textContent = `✓ Correct! +${points} points`;
        feedbackEl.className = 'feedback correct';
    } else {
        // Incorrect answer
        streak = 0;
        feedbackEl.textContent = `✗ Wrong! The answer was ${currentQuestion.answer}`;
        feedbackEl.className = 'feedback incorrect';
    }

    updateUI();

    if (questionsAnswered >= totalQuestions) {
        setTimeout(showResults, 1500);
    } else {
        setTimeout(() => {
            generateQuestion();
            answerInput.focus();
        }, 1500);
    }
}

// Update UI
function updateUI() {
    scoreEl.textContent = score;
    streakEl.textContent = streak;
    questionsAnsweredEl.textContent = questionsAnswered;
    progressFill.style.width = `${(questionsAnswered / totalQuestions) * 100}%`;
}

// Timer
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimer() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Show results
function showResults() {
    stopTimer();
    gameArea.style.display = 'none';
    resultsModal.style.display = 'flex';

    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    const accuracy = Math.round((correctCount / totalQuestions) * 100);

    document.getElementById('finalScore').textContent = score;
    document.getElementById('correctAnswers').textContent = `${correctCount}/${totalQuestions}`;
    document.getElementById('bestStreak').textContent = bestStreak;
    document.getElementById('finalTime').textContent = timeStr;
    document.getElementById('accuracy').textContent = `${accuracy}%`;
}

// Utility function
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

