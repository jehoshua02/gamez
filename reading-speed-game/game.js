// Game State
let currentDifficulty = 'easy';
let currentStoryIndex = 0;
let currentStory = null; // Store the generated story
let startTime = null;
let readingTime = 0;
let timerInterval = null;
let currentQuestionIndex = 0;
let correctAnswers = 0;
let wordCount = 0;

// DOM Elements
const storySelector = document.getElementById('storySelector');
const readingArea = document.getElementById('readingArea');
const quizArea = document.getElementById('quizArea');
const resultsModal = document.getElementById('resultsModal');
const storyContent = document.getElementById('storyContent');
const timerEl = document.getElementById('timer');
const backBtn = document.getElementById('backBtn');
const finishReadingBtn = document.getElementById('finishReadingBtn');
const questionText = document.getElementById('questionText');
const answerOptions = document.getElementById('answerOptions');
const feedbackEl = document.getElementById('feedback');
const quizProgress = document.getElementById('quizProgress');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const readAgainBtn = document.getElementById('readAgainBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');

// Difficulty buttons
const difficultyBtns = document.querySelectorAll('.difficulty-btn');
difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        difficultyBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentDifficulty = btn.dataset.difficulty;
    });
});

// Story buttons
const storyBtns = document.querySelectorAll('.story-btn');
storyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        currentStoryIndex = parseInt(btn.dataset.story);
        startReading();
    });
});

// Back button
backBtn.addEventListener('click', () => {
    stopTimer();
    readingArea.style.display = 'none';
    storySelector.style.display = 'block';
    resetGame();
});

// Finish reading button
finishReadingBtn.addEventListener('click', () => {
    stopTimer();
    readingArea.style.display = 'none';
    startQuiz();
});

// Next question button
nextQuestionBtn.addEventListener('click', () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < getCurrentStory().questions.length) {
        showQuestion();
    } else {
        showResults();
    }
});

// Read again button
readAgainBtn.addEventListener('click', () => {
    resultsModal.style.display = 'none';
    storySelector.style.display = 'block';
    resetGame();
});

// Back to menu button
backToMenuBtn.addEventListener('click', () => {
    resultsModal.style.display = 'none';
    storySelector.style.display = 'block';
    resetGame();
});

// Start reading
function startReading() {
    resetGame();

    // Generate and store the story once
    currentStory = generateStory(currentStoryIndex, currentDifficulty);

    storySelector.style.display = 'none';
    readingArea.style.display = 'block';

    // Display story
    storyContent.innerHTML = `
        <h3>${currentStory.title}</h3>
        ${currentStory.content}
    `;

    // Count words
    wordCount = currentStory.content.split(/\s+/).length;

    // Start timer
    startTimer();
}

// Start quiz
function startQuiz() {
    quizArea.style.display = 'block';
    currentQuestionIndex = 0;
    correctAnswers = 0;
    showQuestion();
}

// Show question
function showQuestion() {
    const story = getCurrentStory();
    const question = story.questions[currentQuestionIndex];
    
    questionText.textContent = question.question;
    quizProgress.textContent = `Question ${currentQuestionIndex + 1} of ${story.questions.length}`;
    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback';
    nextQuestionBtn.style.display = 'none';
    
    // Create answer buttons
    answerOptions.innerHTML = '';
    question.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = option;
        btn.addEventListener('click', () => checkAnswer(index, question.correct));
        answerOptions.appendChild(btn);
    });
}

// Check answer
function checkAnswer(selectedIndex, correctIndex) {
    const buttons = document.querySelectorAll('.answer-btn');
    
    // Disable all buttons
    buttons.forEach(btn => btn.style.pointerEvents = 'none');
    
    if (selectedIndex === correctIndex) {
        correctAnswers++;
        buttons[selectedIndex].classList.add('correct');
        feedbackEl.textContent = '✓ Correct!';
        feedbackEl.className = 'feedback correct';
    } else {
        buttons[selectedIndex].classList.add('incorrect');
        buttons[correctIndex].classList.add('correct');
        feedbackEl.textContent = '✗ Incorrect. The correct answer is highlighted.';
        feedbackEl.className = 'feedback incorrect';
    }
    
    nextQuestionBtn.style.display = 'block';
}

// Show results
function showResults() {
    quizArea.style.display = 'none';
    resultsModal.style.display = 'flex';
    
    const story = getCurrentStory();
    const minutes = Math.floor(readingTime / 60);
    const seconds = readingTime % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    const wpm = Math.round(wordCount / (readingTime / 60));
    const accuracy = Math.round((correctAnswers / story.questions.length) * 100);
    
    // Calculate performance rating
    let performance = 'Needs Practice';
    if (accuracy >= 80 && wpm >= 200) {
        performance = 'Excellent! 🌟';
    } else if (accuracy >= 60 && wpm >= 150) {
        performance = 'Good! 👍';
    } else if (accuracy >= 40) {
        performance = 'Fair 📖';
    }
    
    document.getElementById('finalTime').textContent = timeStr;
    document.getElementById('readingSpeed').textContent = `${wpm} WPM`;
    document.getElementById('comprehension').textContent = `${correctAnswers}/${story.questions.length}`;
    document.getElementById('accuracy').textContent = `${accuracy}%`;
    document.getElementById('performance').textContent = performance;
}

// Timer functions
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        readingTime = Math.floor((Date.now() - startTime) / 1000);
    }
}

function updateTimer() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Reset game
function resetGame() {
    currentQuestionIndex = 0;
    correctAnswers = 0;
    readingTime = 0;
    wordCount = 0;
}

// Get current story based on difficulty
function getCurrentStory() {
    // Return the stored story, don't regenerate!
    return currentStory;
}

// Story generation system
function generateStory(storyType, difficulty) {
    const generators = [
        generateAdventureStory,
        generateMysteryStory,
        generateSciFiStory,
        generateFantasyStory,
        generateHistoricalStory,
        generateNatureStory
    ];

    return generators[storyType](difficulty);
}

// Random selection helper
function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Shuffle array with correct answer at index 0, returns object with shuffled options and new correct index
function shuffleWithCorrect(options) {
    const correctAnswer = options[0];
    const shuffled = [...options].sort(() => Math.random() - 0.5);
    const correctIndex = shuffled.indexOf(correctAnswer);
    return { options: shuffled, correct: correctIndex };
}

// Story generation data
const names = {
    male: ["Alex", "Ben", "Carlos", "David", "Ethan", "Felix", "Gabriel", "Henry", "Isaac", "James", "Kevin", "Leo", "Marcus", "Nathan", "Oliver", "Peter", "Quinn", "Ryan", "Samuel", "Thomas"],
    female: ["Aria", "Bella", "Clara", "Diana", "Emma", "Fiona", "Grace", "Hannah", "Iris", "Julia", "Kate", "Luna", "Maya", "Nina", "Olivia", "Penny", "Quinn", "Rosa", "Sarah", "Tara"],
    neutral: ["Jordan", "Riley", "Casey", "Morgan", "Avery", "Parker", "Sage", "River", "Sky", "Phoenix"]
};

const locations = {
    nature: ["dense forest", "mountain valley", "tropical island", "desert oasis", "frozen tundra", "bamboo grove", "coral reef", "savanna plains"],
    urban: ["bustling city", "small town", "ancient village", "space station", "underground city", "floating city", "coastal port", "mountain monastery"],
    fantasy: ["enchanted kingdom", "mystical realm", "hidden dimension", "magical academy", "crystal cavern", "sky castle", "underwater palace", "ancient temple"]
};

const objects = ["ancient map", "mysterious crystal", "golden compass", "silver key", "glowing orb", "enchanted book", "strange device", "magical amulet", "hidden scroll", "rare artifact"];

const creatures = ["dragon", "phoenix", "unicorn", "griffin", "sea serpent", "giant eagle", "wise owl", "talking fox", "magical deer", "ancient turtle"];

const professions = ["explorer", "scientist", "archaeologist", "inventor", "detective", "artist", "musician", "teacher", "doctor", "engineer"];

// Adventure Story Generator
function generateAdventureStory(difficulty) {
    const protagonist = random(names.female.concat(names.male));
    const profession = random(professions);
    const location = random(locations.nature);
    const object = random(objects);
    const companion = random(names.neutral);
    const obstacleOptions = ["raging river", "steep cliff", "dark cave", "dense fog", "wild storm", "treacherous path"];
    const obstacle = random(obstacleOptions);
    const discoveryOptions = ["hidden valley", "secret passage", "ancient ruins", "treasure chamber", "mystical garden"];
    const discovery = random(discoveryOptions);
    const findLocation = random(["an old library", "a museum", "a cave", "a market"]);

    const paragraphs = [
        `<p>${protagonist} was an experienced ${profession} who loved exploring remote places. One day, while searching through ${findLocation}, ${protagonist} found ${object}. The ${object} showed the location of ${discovery} deep in the ${location}.</p>`,
        `<p>Excited by this discovery, ${protagonist} packed supplies and set off on an expedition. ${companion}, a trusted friend, decided to join the adventure. Together, they traveled for ${randomInt(3, 10)} days through challenging terrain.</p>`,
        `<p>Their journey was not easy. They had to cross ${obstacle}, which tested their courage and determination. ${protagonist} used clever problem-solving skills to overcome each challenge. ${companion} provided valuable support and encouragement along the way.</p>`,
        difficulty !== 'easy' ? `<p>After many obstacles, they finally reached their destination. The ${discovery} was even more magnificent than they had imagined. Ancient structures stood tall, covered in mysterious symbols and carvings that told stories of a civilization long forgotten.</p>` : '',
        `<p>The ${discovery} contained incredible artifacts that would help historians understand ancient cultures better. ${protagonist} carefully documented everything, knowing this discovery would change history. The adventure taught them that persistence and teamwork can overcome any obstacle.</p>`
    ].filter(p => p).join('\n            ');

    // Generate unique wrong answers from the same pools
    const wrongProfessions = professions.filter(p => p !== profession).sort(() => Math.random() - 0.5).slice(0, 3);
    const wrongCompanions = names.neutral.filter(n => n !== companion).sort(() => Math.random() - 0.5).slice(0, 3);
    const wrongObstacles = obstacleOptions.filter(o => o !== obstacle).sort(() => Math.random() - 0.5).slice(0, 3);
    const wrongDiscoveries = discoveryOptions.filter(d => d !== discovery).sort(() => Math.random() - 0.5).slice(0, 3);
    const findLocationOptions = ["an old library", "a museum", "a cave", "a market"];
    const wrongFindLocations = findLocationOptions.filter(l => l !== findLocation).sort(() => Math.random() - 0.5).slice(0, 3);

    const q1 = shuffleWithCorrect([profession, ...wrongProfessions]);
    const q2 = shuffleWithCorrect([findLocation, ...wrongFindLocations]);
    const q3 = shuffleWithCorrect([companion, ...wrongCompanions]);
    const q4 = shuffleWithCorrect([obstacle, ...wrongObstacles]);
    const q5 = shuffleWithCorrect([discovery, ...wrongDiscoveries]);

    const questions = [
        {
            question: `What was ${protagonist}'s profession?`,
            options: q1.options,
            correct: q1.correct
        },
        {
            question: `Where did ${protagonist} find the ${object}?`,
            options: q2.options,
            correct: q2.correct
        },
        {
            question: `Who joined ${protagonist} on the adventure?`,
            options: q3.options,
            correct: q3.correct
        },
        {
            question: `What obstacle did they have to cross?`,
            options: q4.options,
            correct: q4.correct
        },
        {
            question: `What did they discover at the end?`,
            options: q5.options,
            correct: q5.correct
        }
    ];

    return {
        title: `The ${discovery.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`,
        content: paragraphs,
        questions: questions
    };
}

// Mystery Story Generator
function generateMysteryStory(difficulty) {
    const detective = random(names.male.concat(names.female));
    const location = random(locations.urban);
    const mystery = random(["missing artifact", "stolen painting", "disappearing residents", "strange signals", "hidden treasure"]);
    const clue = random(["footprints", "coded message", "old photograph", "mysterious symbol", "torn letter"]);
    const culprit = random(names.male.concat(names.female));

    const paragraphs = [
        `<p>Detective ${detective} received an urgent call about ${mystery} in the ${location}. This case was unlike anything ${detective} had encountered before. The mystery had baffled local authorities for weeks.</p>`,
        `<p>${detective} began investigating immediately, interviewing witnesses and examining the scene carefully. During the investigation, ${detective} discovered ${clue} that seemed insignificant at first but proved to be crucial.</p>`,
        `<p>Following the trail of clues, ${detective} uncovered a pattern that others had missed. Each piece of evidence pointed to a surprising connection between seemingly unrelated events. The case was more complex than anyone had imagined.</p>`,
        difficulty !== 'easy' ? `<p>After ${randomInt(5, 15)} days of intensive investigation, ${detective} finally pieced together what had happened. The solution involved careful analysis of timing, motives, and opportunities. Every detail mattered in solving this puzzle.</p>` : '',
        `<p>In a dramatic revelation, ${detective} exposed ${culprit} as the person behind the mystery. The case was solved through brilliant deductive reasoning and attention to detail. ${detective}'s reputation as a master detective was well-deserved.</p>`
    ].filter(p => p).join('\n            ');

    const wrongMysteries = ["lost documents", "broken window", "loud noises", "power outage", "missing keys", "strange smell"].filter(m => m !== mystery).sort(() => Math.random() - 0.5).slice(0, 3);
    const wrongClues = ["witness statement", "security footage", "fingerprints", "DNA sample", "phone records", "receipts"].filter(c => c !== clue).sort(() => Math.random() - 0.5).slice(0, 3);
    const wrongLocations = locations.urban.filter(l => l !== location).sort(() => Math.random() - 0.5).slice(0, 3);
    const wrongCulprits = names.male.concat(names.female).filter(n => n !== culprit).sort(() => Math.random() - 0.5).slice(0, 3);

    const q1 = shuffleWithCorrect(["Detective", "Police officer", "Lawyer", "Reporter"]);
    const q2 = shuffleWithCorrect([mystery, ...wrongMysteries]);
    const q3 = shuffleWithCorrect([clue, ...wrongClues]);
    const q4 = shuffleWithCorrect([location, ...wrongLocations]);
    const q5 = shuffleWithCorrect([culprit, ...wrongCulprits]);

    const questions = [
        {
            question: `What was ${detective}'s profession?`,
            options: q1.options,
            correct: q1.correct
        },
        {
            question: `What was the mystery about?`,
            options: q2.options,
            correct: q2.correct
        },
        {
            question: `What important clue did ${detective} find?`,
            options: q3.options,
            correct: q3.correct
        },
        {
            question: `Where did the mystery take place?`,
            options: q4.options,
            correct: q4.correct
        },
        {
            question: `Who was behind the mystery?`,
            options: q5.options,
            correct: q5.correct
        }
    ];

    return {
        title: `The Case of the ${mystery.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`,
        content: paragraphs,
        questions: questions
    };
}

// Sci-Fi Story Generator
function generateSciFiStory(difficulty) {
    const captain = random(names.female.concat(names.male));
    const shipName = random(["Star Explorer", "Cosmic Voyager", "Nebula Runner", "Quantum Leap", "Stellar Phoenix"]);
    const planet = `${random(["Zephyr", "Nova", "Kepler", "Proxima", "Aurora"])}-${randomInt(1, 99)}`;
    const alienFeature = random(["floating jellyfish", "crystalline beings", "energy entities", "plant-like creatures", "shapeshifters"]);
    const commMethod = random(["light patterns", "telepathy", "sound frequencies", "chemical signals"]);
    const discovery = random(["ancient technology", "new element", "alien civilization", "energy source", "portal"]);

    const paragraphs = [
        `<p>Captain ${captain} commanded the ${shipName}, a state-of-the-art exploration vessel on a mission to study ${planet}. The crew had been traveling through deep space for ${randomInt(2, 6)} months, and excitement filled the ship as they approached their destination.</p>`,
        `<p>As they entered orbit, the crew made an astonishing observation. The planet had ${randomInt(2, 5)} moons and an atmosphere that shimmered with unusual colors. Initial scans revealed conditions that could support life, making this a potentially groundbreaking discovery.</p>`,
        `<p>Upon landing, Captain ${captain} led an exploration team to investigate. They encountered alien life forms that resembled ${alienFeature}. These beings communicated through ${commMethod}, which the crew's translator slowly began to decode.</p>`,
        difficulty !== 'easy' ? `<p>Over the next ${randomInt(7, 21)} days, the crew established peaceful contact with the aliens. They learned about the planet's history and discovered ${discovery} that could revolutionize human understanding of the universe. The aliens shared their knowledge willingly, hoping for friendship between their species.</p>` : '',
        `<p>When it was time to depart, the aliens gave Captain ${captain} a gift as a symbol of their new alliance. The ${shipName} returned to Earth with data that would change humanity's place in the cosmos forever. This mission proved that we are not alone in the universe.</p>`
    ].filter(p => p).join('\n            ');

    const wrongShips = ["Galaxy Quest", "Space Ranger", "Millennium Star", "Enterprise", "Discovery One", "Serenity"].filter(s => s !== shipName).sort(() => Math.random() - 0.5).slice(0, 3);
    const wrongPlanets = [`Alpha-${randomInt(1, 99)}`, `Beta-${randomInt(1, 99)}`, `Gamma-${randomInt(1, 99)}`];
    const wrongAliens = ["giant insects", "flying birds", "walking trees", "swimming fish", "glowing orbs", "metal robots"].filter(a => a !== alienFeature).sort(() => Math.random() - 0.5).slice(0, 3);
    const wrongComm = ["spoken language", "writing", "gestures", "dance", "art", "music"].filter(c => c !== commMethod).sort(() => Math.random() - 0.5).slice(0, 3);
    const wrongDiscoveries = ["water source", "mineral deposits", "ancient fossils", "alien ruins", "advanced weapons", "hidden treasure"].filter(d => d !== discovery).sort(() => Math.random() - 0.5).slice(0, 3);

    const q1 = shuffleWithCorrect([shipName, ...wrongShips]);
    const q2 = shuffleWithCorrect([planet, ...wrongPlanets]);
    const q3 = shuffleWithCorrect([alienFeature, ...wrongAliens]);
    const q4 = shuffleWithCorrect([commMethod, ...wrongComm]);
    const q5 = shuffleWithCorrect([discovery, ...wrongDiscoveries]);

    const questions = [
        {
            question: `What was the name of the spaceship?`,
            options: q1.options,
            correct: q1.correct
        },
        {
            question: `What planet did they explore?`,
            options: q2.options,
            correct: q2.correct
        },
        {
            question: `What did the alien life forms look like?`,
            options: q3.options,
            correct: q3.correct
        },
        {
            question: `How did the aliens communicate?`,
            options: q4.options,
            correct: q4.correct
        },
        {
            question: `What did the crew discover?`,
            options: q5.options,
            correct: q5.correct
        }
    ];

    return {
        title: `Mission to ${planet}`,
        content: paragraphs,
        questions: questions
    };
}

// Fantasy Story Generator
function generateFantasyStory(difficulty) {
    const hero = random(names.male.concat(names.female));
    const location = random(locations.fantasy);
    const creature = random(creatures);
    const magicItem = random(objects);
    const quest = random(["save the kingdom", "find the lost artifact", "defeat the dark force", "restore balance", "break the curse"]);

    const paragraphs = [
        `<p>In the ${location}, a young ${random(["warrior", "mage", "ranger", "scholar"])} named ${hero} lived a peaceful life. Everything changed when ${hero} discovered ${magicItem} hidden in ${random(["an ancient library", "a forgotten cave", "the royal treasury", "a mystical grove"])}.</p>`,
        `<p>The ${magicItem} revealed a prophecy: only ${hero} could ${quest}. Though frightened, ${hero} accepted this destiny and began preparing for the journey ahead. The fate of the realm depended on ${hero}'s courage and determination.</p>`,
        `<p>During the quest, ${hero} encountered a magnificent ${creature}. At first, the ${creature} seemed dangerous, but ${hero} showed kindness and respect. The ${creature} became a loyal companion, offering wisdom and protection throughout the journey.</p>`,
        difficulty !== 'easy' ? `<p>The path was filled with challenges that tested ${hero}'s strength, intelligence, and heart. ${hero} solved ancient riddles, crossed treacherous landscapes, and faced fears that seemed insurmountable. Each trial made ${hero} stronger and more confident.</p>` : '',
        `<p>Finally, ${hero} completed the quest and ${quest}. The ${location} celebrated ${hero} as a true hero. ${hero} learned that courage isn't the absence of fear, but the willingness to act despite it. The ${magicItem} was placed in a place of honor, and peace returned to the land.</p>`
    ].filter(p => p).join('\n            ');

    const wrongLocations = locations.fantasy.filter(l => l !== location).sort(() => Math.random() - 0.5).slice(0, 3);
    const wrongItems = objects.filter(o => o !== magicItem).sort(() => Math.random() - 0.5).slice(0, 3);
    const wrongQuests = ["explore new lands", "become wealthy", "learn magic", "build a castle", "find friends", "write a book"].filter(q => q !== quest).sort(() => Math.random() - 0.5).slice(0, 3);
    const wrongCreatures = creatures.filter(c => c !== creature).sort(() => Math.random() - 0.5).slice(0, 3);

    const q1 = shuffleWithCorrect([location, ...wrongLocations]);
    const q2 = shuffleWithCorrect([magicItem, ...wrongItems]);
    const q3 = shuffleWithCorrect([quest, ...wrongQuests]);
    const q4 = shuffleWithCorrect([creature, ...wrongCreatures]);
    const q5 = shuffleWithCorrect(["Courage is acting despite fear", "Magic is everything", "Strength is most important", "Quests are easy"]);

    const questions = [
        {
            question: `Where did ${hero} live?`,
            options: q1.options,
            correct: q1.correct
        },
        {
            question: `What did ${hero} discover?`,
            options: q2.options,
            correct: q2.correct
        },
        {
            question: `What was ${hero}'s quest?`,
            options: q3.options,
            correct: q3.correct
        },
        {
            question: `What creature did ${hero} meet?`,
            options: q4.options,
            correct: q4.correct
        },
        {
            question: `What did ${hero} learn?`,
            options: q5.options,
            correct: q5.correct
        }
    ];

    return {
        title: `${hero} and the ${creature.charAt(0).toUpperCase() + creature.slice(1)}`,
        content: paragraphs,
        questions: questions
    };
}

// Historical Story Generator
function generateHistoricalStory(difficulty) {
    const archaeologist = `Dr. ${random(names.male.concat(names.female))} ${random(["Chen", "Rodriguez", "Smith", "Patel", "Johnson", "Kim", "Garcia"])}`;
    const location = random(["mountains", "desert", "jungle", "valley", "island"]);
    const civilization = random(["ancient kingdom", "lost city", "forgotten empire", "mysterious civilization", "legendary society"]);
    const artifact = random(["library", "temple", "palace", "marketplace", "observatory"]);
    const knowledge = random(["medicine", "astronomy", "mathematics", "engineering", "agriculture"]);

    const paragraphs = [
        `<p>${archaeologist}, a renowned archaeologist, spent years searching for evidence of ${civilization} that had vanished ${randomInt(500, 3000)} years ago. Ancient texts mentioned this civilization's advanced ${knowledge}, but many scholars doubted its existence.</p>`,
        `<p>One day, while examining old maps in a dusty archive, ${archaeologist} found a clue that had been overlooked for centuries. The map showed a location deep in the ${location} where no modern expedition had ever ventured.</p>`,
        `<p>${archaeologist} assembled a team of experts and embarked on an expedition. After ${randomInt(2, 8)} weeks of difficult travel, they discovered ruins hidden beneath centuries of vegetation. The ${civilization} was real, and it was magnificent.</p>`,
        difficulty !== 'easy' ? `<p>The team spent months carefully excavating and documenting their findings. They discovered ${artifact} filled with artifacts and inscriptions. The civilization's knowledge of ${knowledge} was far more advanced than historians had believed possible for that time period.</p>` : '',
        `<p>The discovery revolutionized understanding of ancient history. ${archaeologist}'s findings showed that human innovation and intelligence have always been remarkable. The artifacts were preserved in museums, allowing people worldwide to learn from this ${civilization}.</p>`
    ].filter(p => p).join('\n            ');

    const wrongCivilizations = ["buried treasure", "lost ship", "ancient weapon", "hidden cave", "secret passage", "underground river"].filter(c => c !== civilization).sort(() => Math.random() - 0.5).slice(0, 3);
    const wrongKnowledge = ["warfare", "trade", "art", "music", "sports", "games"].filter(k => k !== knowledge).sort(() => Math.random() - 0.5).slice(0, 3);
    const wrongArtifacts = ["gold coins", "weapons", "pottery", "jewelry", "tools", "clothing"].filter(a => a !== artifact).sort(() => Math.random() - 0.5).slice(0, 3);

    const q1 = shuffleWithCorrect(["Archaeologist", "Historian", "Geologist", "Anthropologist"]);
    const q2 = shuffleWithCorrect([civilization, ...wrongCivilizations]);
    const q3 = shuffleWithCorrect(["a dusty archive", "a museum", "a cave", "a temple"]);
    const q4 = shuffleWithCorrect([knowledge, ...wrongKnowledge]);
    const q5 = shuffleWithCorrect([artifact, ...wrongArtifacts]);

    const questions = [
        {
            question: `What was ${archaeologist.split(' ')[1]}'s profession?`,
            options: q1.options,
            correct: q1.correct
        },
        {
            question: `What was ${archaeologist.split(' ')[1]} searching for?`,
            options: q2.options,
            correct: q2.correct
        },
        {
            question: `Where did ${archaeologist.split(' ')[1]} find the clue?`,
            options: q3.options,
            correct: q3.correct
        },
        {
            question: `What did the civilization excel in?`,
            options: q4.options,
            correct: q4.correct
        },
        {
            question: `What did the team discover at the site?`,
            options: q5.options,
            correct: q5.correct
        }
    ];

    return {
        title: `Discovery of the ${civilization.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`,
        content: paragraphs,
        questions: questions
    };
}

// Nature/Science Story Generator
function generateNatureStory(difficulty) {
    const scientist = `Dr. ${random(names.male.concat(names.female))} ${random(["Martinez", "Lee", "Brown", "Wilson", "Taylor", "Anderson", "Thomas"])}`;
    const field = random(["marine biology", "ecology", "zoology", "botany", "environmental science"]);
    const location = random(locations.nature);
    const discovery = random(["new species", "unique ecosystem", "rare phenomenon", "symbiotic relationship", "adaptation mechanism"]);
    const feature = random(["bioluminescence", "camouflage", "communication method", "survival strategy", "reproductive cycle"]);

    const paragraphs = [
        `<p>${scientist}, a dedicated ${field} researcher, had been studying the ${location} for ${randomInt(3, 15)} years. ${scientist} was passionate about understanding how life thrives in extreme conditions and discovering nature's hidden secrets.</p>`,
        `<p>During a routine expedition, ${scientist} noticed something extraordinary. The local wildlife exhibited ${feature} that had never been documented before. This observation could lead to ${discovery} that would fascinate the scientific community.</p>`,
        `<p>${scientist} spent ${randomInt(6, 18)} months carefully observing and documenting this phenomenon. Using advanced equipment and patient observation, ${scientist} gathered compelling evidence. Every detail was meticulously recorded for peer review.</p>`,
        difficulty !== 'easy' ? `<p>The research revealed fascinating insights into how organisms adapt to their environment. ${scientist} discovered that this ${feature} served multiple purposes: survival, communication, and reproduction. Nature's ingenuity never ceased to amaze the research team.</p>` : '',
        `<p>${scientist} published the findings in a prestigious scientific journal. The discovery contributed to conservation efforts and helped protect the ${location}. ${scientist}'s work reminded everyone that Earth still holds countless mysteries waiting to be discovered.</p>`
    ].filter(p => p).join('\n            ');

    const wrongFields = ["physics", "chemistry", "astronomy", "geology", "psychology", "sociology"].filter(f => f !== field).sort(() => Math.random() - 0.5).slice(0, 3);
    const wrongLocations = locations.nature.filter(l => l !== location).sort(() => Math.random() - 0.5).slice(0, 3);
    const wrongFeatures = ["unusual size", "bright color", "incredible speed", "great strength", "unique diet", "rare habitat"].filter(f => f !== feature).sort(() => Math.random() - 0.5).slice(0, 3);

    const q1 = shuffleWithCorrect([field, ...wrongFields]);
    const q2 = shuffleWithCorrect([location, ...wrongLocations]);
    const q3 = shuffleWithCorrect([feature, ...wrongFeatures]);
    const q4 = shuffleWithCorrect(["Several months", "A few days", "One week", "A year"]);
    const q5 = shuffleWithCorrect(["It helped conservation efforts", "It made money", "It was ignored", "It caused problems"]);

    const questions = [
        {
            question: `What field did ${scientist.split(' ')[1]} work in?`,
            options: q1.options,
            correct: q1.correct
        },
        {
            question: `Where did ${scientist.split(' ')[1]} conduct research?`,
            options: q2.options,
            correct: q2.correct
        },
        {
            question: `What unusual feature did ${scientist.split(' ')[1]} observe?`,
            options: q3.options,
            correct: q3.correct
        },
        {
            question: `How long did ${scientist.split(' ')[1]} study the phenomenon?`,
            options: q4.options,
            correct: q4.correct
        },
        {
            question: `What was the impact of the discovery?`,
            options: q5.options,
            correct: q5.correct
        }
    ];

    return {
        title: `The ${location.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Discovery`,
        content: paragraphs,
        questions: questions
    };
}

