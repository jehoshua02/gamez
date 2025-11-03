// Game State
let currentLevel = 0;
let startTime = null;
let timerInterval = null;
let totalChars = 0;
let correctChars = 0;
let errors = 0;
let currentCharIndex = 0;
let currentText = '';
let isTyping = false;

// DOM Elements
const levelSelector = document.getElementById('levelSelector');
const typingArea = document.getElementById('typingArea');
const resultsScreen = document.getElementById('resultsScreen');
const startBtn = document.getElementById('startBtn');
const backBtn = document.getElementById('backBtn');
const retryBtn = document.getElementById('retryBtn');
const nextBtn = document.getElementById('nextBtn');
const menuBtn = document.getElementById('menuBtn');
const prevLevelBtn = document.getElementById('prevLevelBtn');
const nextLevelBtn = document.getElementById('nextLevelBtn');
const typingInput = document.getElementById('typingInput');
const textToType = document.getElementById('textToType');
const progressFill = document.getElementById('progressFill');

// Progressive Level System - Each level introduces new letter combinations
const levels = [
    { name: "Home Row", keys: "asdfghjkl", description: "Master the home row keys" },
    { name: "Home Row Words", keys: "asdfghjkl", description: "Type common home row words" },
    { name: "Top Row - Left", keys: "asdfghjklqwert", description: "Add Q W E R T" },
    { name: "Top Row - Right", keys: "asdfghjklqwertyuiop", description: "Add Y U I O P" },
    { name: "Top Row Words", keys: "asdfghjklqwertyuiop", description: "Practice top row combinations" },
    { name: "Bottom Row - Left", keys: "asdfghjklqwertyuiopzxcv", description: "Add Z X C V" },
    { name: "Bottom Row - Right", keys: "asdfghjklqwertyuiopzxcvbnm", description: "Add B N M" },
    { name: "All Letters", keys: "abcdefghijklmnopqrstuvwxyz", description: "Practice all letters" },
    { name: "Common Words", keys: "abcdefghijklmnopqrstuvwxyz ", description: "Type common English words" },
    { name: "Capital Letters", keys: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ", description: "Add capital letters" },
    { name: "Numbers - Left", keys: "abcdefghijklmnopqrstuvwxyz 12345", description: "Add numbers 1-5" },
    { name: "Numbers - Right", keys: "abcdefghijklmnopqrstuvwxyz 1234567890", description: "Add numbers 6-0" },
    { name: "Numbers Practice", keys: "abcdefghijklmnopqrstuvwxyz 1234567890", description: "Practice numbers and letters" },
    { name: "Punctuation - Basic", keys: "abcdefghijklmnopqrstuvwxyz 1234567890.,", description: "Add period and comma" },
    { name: "Punctuation - More", keys: "abcdefghijklmnopqrstuvwxyz 1234567890.,!?", description: "Add ! and ?" },
    { name: "Quotes", keys: "abcdefghijklmnopqrstuvwxyz 1234567890.,!?'\"", description: "Add quotes" },
    { name: "Sentences", keys: "abcdefghijklmnopqrstuvwxyz 1234567890.,!?'\"", description: "Type complete sentences" },
    { name: "Parentheses", keys: "abcdefghijklmnopqrstuvwxyz 1234567890.,!?'\"()", description: "Add parentheses" },
    { name: "Brackets", keys: "abcdefghijklmnopqrstuvwxyz 1234567890.,!?'\"()[]", description: "Add square brackets" },
    { name: "Braces", keys: "abcdefghijklmnopqrstuvwxyz 1234567890.,!?'\"()[]{}",  description: "Add curly braces" },
    { name: "Math Symbols", keys: "abcdefghijklmnopqrstuvwxyz 1234567890.,!?'\"()[]{}+-*/=", description: "Add math operators" },
    { name: "Special Chars 1", keys: "abcdefghijklmnopqrstuvwxyz 1234567890.,!?'\"()[]{}+-*/=@#", description: "Add @ and #" },
    { name: "Special Chars 2", keys: "abcdefghijklmnopqrstuvwxyz 1234567890.,!?'\"()[]{}+-*/=@#$%", description: "Add $ and %" },
    { name: "Special Chars 3", keys: "abcdefghijklmnopqrstuvwxyz 1234567890.,!?'\"()[]{}+-*/=@#$%^&", description: "Add ^ and &" },
    { name: "Underscores", keys: "abcdefghijklmnopqrstuvwxyz 1234567890.,!?'\"()[]{}+-*/=@#$%^&_", description: "Add underscore" },
    { name: "Pipes & Backslash", keys: "abcdefghijklmnopqrstuvwxyz 1234567890.,!?'\"()[]{}+-*/=@#$%^&_|\\", description: "Add | and \\" },
    { name: "Angles & Tilde", keys: "abcdefghijklmnopqrstuvwxyz 1234567890.,!?'\"()[]{}+-*/=@#$%^&_|\\<>~", description: "Add <, >, ~" },
    { name: "Backticks", keys: "abcdefghijklmnopqrstuvwxyz 1234567890.,!?'\"()[]{}+-*/=@#$%^&_|\\<>~`", description: "Add backtick" },
    { name: "Colon & Semicolon", keys: "abcdefghijklmnopqrstuvwxyz 1234567890.,!?'\"()[]{}+-*/=@#$%^&_|\\<>~`:;", description: "Add : and ;" },
    { name: "Master Level", keys: "abcdefghijklmnopqrstuvwxyz 1234567890.,!?'\"()[]{}+-*/=@#$%^&_|\\<>~`:;", description: "All characters - Master typing!" }
];

// Load saved progress
let progress = JSON.parse(localStorage.getItem('typingGameProgress')) || {
    completedLevels: [],
    bestScores: {}
};

// Event Listeners
startBtn.addEventListener('click', startLevel);
backBtn.addEventListener('click', backToMenu);
retryBtn.addEventListener('click', () => {
    resultsScreen.style.display = 'none';
    startLevel();
});
nextBtn.addEventListener('click', () => {
    if (currentLevel < levels.length - 1) {
        currentLevel++;
        resultsScreen.style.display = 'none';
        updateLevelDisplay();
        levelSelector.style.display = 'block';
    }
});
menuBtn.addEventListener('click', () => {
    resultsScreen.style.display = 'none';
    updateLevelDisplay();
    levelSelector.style.display = 'block';
});
prevLevelBtn.addEventListener('click', () => {
    if (currentLevel > 0) {
        currentLevel--;
        updateLevelDisplay();
    }
});
nextLevelBtn.addEventListener('click', () => {
    if (currentLevel < levels.length - 1) {
        currentLevel++;
        updateLevelDisplay();
    }
});

typingInput.addEventListener('input', handleTyping);

// Initialize
updateLevelDisplay();

function updateLevelDisplay() {
    const level = levels[currentLevel];
    document.getElementById('currentLevelNum').textContent = currentLevel + 1;
    document.getElementById('levelDescription').textContent = level.description;
    document.getElementById('totalLevels').textContent = levels.length;
    document.getElementById('completedLevels').textContent = progress.completedLevels.length;
    
    // Update best scores
    const bestScore = progress.bestScores[currentLevel];
    if (bestScore) {
        document.getElementById('bestWPM').textContent = bestScore.wpm || 0;
        document.getElementById('bestAccuracy').textContent = bestScore.accuracy || 0;
    } else {
        document.getElementById('bestWPM').textContent = 0;
        document.getElementById('bestAccuracy').textContent = 0;
    }
    
    // Update navigation buttons
    prevLevelBtn.disabled = currentLevel === 0;
    nextLevelBtn.disabled = currentLevel === levels.length - 1;
}

function startLevel() {
    // Reset state
    currentCharIndex = 0;
    correctChars = 0;
    errors = 0;
    totalChars = 0;
    isTyping = false;
    startTime = null;
    
    // Generate text for this level
    currentText = generateTextForLevel(currentLevel);
    totalChars = currentText.length;
    
    // Display text
    displayText();
    
    // Show typing area
    levelSelector.style.display = 'none';
    typingArea.style.display = 'block';
    
    // Update level display
    document.getElementById('currentLevel').textContent = currentLevel + 1;
    document.getElementById('wpm').textContent = '0';
    document.getElementById('accuracy').textContent = '100';
    document.getElementById('timer').textContent = '0:00';
    progressFill.style.width = '0%';
    
    // Focus input
    typingInput.value = '';
    typingInput.focus();
}

function generateTextForLevel(levelIndex) {
    const level = levels[levelIndex];
    const keys = level.keys.split('');
    
    // Generate appropriate text based on level
    if (levelIndex === 0) {
        // Home row - simple combinations
        return generateRandomCombinations(keys, 50);
    } else if (levelIndex === 1) {
        // Home row words
        const words = ['sad', 'dad', 'lad', 'lass', 'glass', 'flask', 'ask', 'fall', 'hall', 'shall', 'all', 'gall'];
        return generateFromWordList(words, 40);
    } else if (levelIndex <= 7) {
        // Letter practice
        return generateRandomCombinations(keys, 60);
    } else if (levelIndex === 8) {
        // Common words
        const words = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'];
        return generateFromWordList(words, 50);
    } else if (levelIndex === 9) {
        // Capital letters
        const words = ['The', 'And', 'For', 'Are', 'But', 'Not', 'You', 'All', 'Can', 'Her', 'Was', 'One', 'Our', 'Out'];
        return generateFromWordList(words, 40);
    } else if (levelIndex <= 12) {
        // Numbers
        return generateWithNumbers(keys, 50);
    } else if (levelIndex <= 16) {
        // Punctuation
        return generateWithPunctuation(keys, 45);
    } else if (levelIndex === 17) {
        // Sentences
        const sentences = ['The quick brown fox jumps.', 'She sells seashells.', 'How are you today?', 'What time is it?', 'I love to code!'];
        return sentences[Math.floor(Math.random() * sentences.length)];
    } else {
        // Advanced levels with all characters
        return generateAdvancedText(keys, 50);
    }
}

function generateRandomCombinations(keys, length) {
    let text = '';
    for (let i = 0; i < length; i++) {
        text += keys[Math.floor(Math.random() * keys.length)];
        if (i % 5 === 4 && i < length - 1) text += ' ';
    }
    return text.trim();
}

function generateFromWordList(words, count) {
    let text = '';
    for (let i = 0; i < count; i++) {
        text += words[Math.floor(Math.random() * words.length)] + ' ';
    }
    return text.trim();
}

function generateWithNumbers(keys, length) {
    let text = '';
    const letters = keys.filter(k => /[a-z]/i.test(k));
    const numbers = keys.filter(k => /[0-9]/.test(k));
    
    for (let i = 0; i < length; i++) {
        if (Math.random() < 0.3 && numbers.length > 0) {
            text += numbers[Math.floor(Math.random() * numbers.length)];
        } else {
            text += letters[Math.floor(Math.random() * letters.length)];
        }
        if (i % 6 === 5 && i < length - 1) text += ' ';
    }
    return text.trim();
}

function generateWithPunctuation(keys, length) {
    const words = ['hello', 'world', 'test', 'code', 'type', 'fast', 'good', 'nice', 'cool', 'great'];
    let text = '';
    for (let i = 0; i < length / 6; i++) {
        text += words[Math.floor(Math.random() * words.length)];
        if (Math.random() < 0.3) {
            const puncts = keys.filter(k => /[.,!?]/.test(k));
            if (puncts.length > 0) {
                text += puncts[Math.floor(Math.random() * puncts.length)];
            }
        }
        text += ' ';
    }
    return text.trim();
}

function generateAdvancedText(keys, length) {
    let text = '';
    for (let i = 0; i < length; i++) {
        text += keys[Math.floor(Math.random() * keys.length)];
        if (i % 7 === 6 && i < length - 1) text += ' ';
    }
    return text.trim();
}

function displayText() {
    textToType.innerHTML = '';
    for (let i = 0; i < currentText.length; i++) {
        const span = document.createElement('span');
        span.className = 'char';
        // Make spaces visible
        if (currentText[i] === ' ') {
            span.textContent = '␣'; // Use visible space character
            span.style.opacity = '0.5';
        } else {
            span.textContent = currentText[i];
        }
        if (i === 0) span.classList.add('current');
        textToType.appendChild(span);
    }
}

function handleTyping(e) {
    if (!isTyping) {
        isTyping = true;
        startTime = Date.now();
        startTimer();
    }

    const typed = e.target.value;

    // If input is empty, ignore (happens after we clear it)
    if (typed.length === 0) return;

    const expectedChar = currentText[currentCharIndex];
    const typedChar = typed[0]; // Always check first character since we clear after each

    if (typedChar === expectedChar) {
        // Correct character
        const chars = textToType.querySelectorAll('.char');
        chars[currentCharIndex].classList.remove('current');
        chars[currentCharIndex].classList.add('correct');
        correctChars++;
        currentCharIndex++;

        if (currentCharIndex < currentText.length) {
            chars[currentCharIndex].classList.add('current');
        } else {
            // Level complete
            completeLevel();
            return;
        }
    } else {
        // Incorrect character
        errors++;
        const chars = textToType.querySelectorAll('.char');
        chars[currentCharIndex].classList.add('incorrect');
        setTimeout(() => {
            chars[currentCharIndex].classList.remove('incorrect');
        }, 200);
    }

    // Clear input after processing
    typingInput.value = '';

    // Update stats
    updateStats();
}

function updateStats() {
    const elapsed = (Date.now() - startTime) / 1000 / 60; // minutes
    const wpm = Math.round((correctChars / 5) / elapsed) || 0;
    const accuracy = Math.round((correctChars / (correctChars + errors)) * 100) || 100;
    const progress = (currentCharIndex / totalChars) * 100;
    
    document.getElementById('wpm').textContent = wpm;
    document.getElementById('accuracy').textContent = accuracy;
    progressFill.style.width = progress + '%';
}

function startTimer() {
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function completeLevel() {
    stopTimer();
    typingArea.style.display = 'none';
    
    const elapsed = (Date.now() - startTime) / 1000;
    const minutes = Math.floor(elapsed / 60);
    const seconds = Math.floor(elapsed % 60);
    const wpm = Math.round((correctChars / 5) / (elapsed / 60));
    const accuracy = Math.round((correctChars / (correctChars + errors)) * 100);
    
    // Update results
    document.getElementById('finalWPM').textContent = wpm;
    document.getElementById('finalAccuracy').textContent = accuracy;
    document.getElementById('finalTime').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('finalErrors').textContent = errors;
    
    // Save progress
    if (!progress.completedLevels.includes(currentLevel)) {
        progress.completedLevels.push(currentLevel);
    }
    
    if (!progress.bestScores[currentLevel] || wpm > progress.bestScores[currentLevel].wpm) {
        progress.bestScores[currentLevel] = { wpm, accuracy };
    }
    
    localStorage.setItem('typingGameProgress', JSON.stringify(progress));
    
    // Show message
    let message = '';
    if (accuracy >= 95 && wpm >= 60) {
        message = '🌟 Outstanding! You\'re a typing master!';
    } else if (accuracy >= 90 && wpm >= 40) {
        message = '🎉 Excellent work! Keep it up!';
    } else if (accuracy >= 80) {
        message = '👍 Good job! Practice makes perfect!';
    } else {
        message = '📖 Keep practicing! You\'re improving!';
    }
    document.getElementById('resultsMessage').textContent = message;
    
    // Show/hide next button
    nextBtn.style.display = currentLevel < levels.length - 1 ? 'block' : 'none';
    
    resultsScreen.style.display = 'block';
}

function backToMenu() {
    stopTimer();
    typingArea.style.display = 'none';
    updateLevelDisplay();
    levelSelector.style.display = 'block';
}

