class MathGame {
    constructor() {
        this.currentQuestion = 0;
        this.totalQuestions = 10;
        this.score = 0;
        this.questions = [];
        this.currentAnswer = null;
        this.gameState = 'config'; // 'config', 'playing', 'results', 'history', 'test-detail'
        this.answerSubmitted = false;
        this.currentTestData = null; // Store current test data for saving
        
        this.initializeElements();
        this.bindEvents();
        this.initializeSounds();
    }

    initializeElements() {
        // Panels
        this.configPanel = document.getElementById('config-panel');
        this.gamePanel = document.getElementById('game-panel');
        this.resultsPanel = document.getElementById('results-panel');
        this.historyPanel = document.getElementById('history-panel');
        this.testDetailPanel = document.getElementById('test-detail-panel');
        
        // Config elements
        this.xMinInput = document.getElementById('x-min');
        this.xMaxInput = document.getElementById('x-max');
        this.yMinInput = document.getElementById('y-min');
        this.yMaxInput = document.getElementById('y-max');
        this.totalQuestionsInput = document.getElementById('total-questions');
        this.startGameBtn = document.getElementById('start-game');
        
        // Game elements
        this.questionElement = document.getElementById('question');
        this.userAnswerInput = document.getElementById('user-answer');
        this.submitAnswerBtn = document.getElementById('submit-answer');
        this.feedbackElement = document.getElementById('feedback');
        this.feedbackContent = document.getElementById('feedback-content');
        this.nextQuestionBtn = document.getElementById('next-question');
        this.currentScoreElement = document.getElementById('current-score');
        this.currentQuestionElement = document.getElementById('current-question');
        this.totalQuestionsDisplay = document.getElementById('total-questions-display');
        
        // Results elements
        this.resultsContent = document.getElementById('results-content');
        this.restartGameBtn = document.getElementById('restart-game');
        this.newGameBtn = document.getElementById('new-game');
        
        // History elements
        this.historyContent = document.getElementById('history-content');
        this.showHistoryBtn = document.getElementById('show-history');
        this.showGameBtn = document.getElementById('show-game');
        this.backToGameBtn = document.getElementById('back-to-game');
        
        // Test detail elements
        this.testDetailTitle = document.getElementById('test-detail-title');
        this.testDetailContent = document.getElementById('test-detail-content');
        this.backToHistoryBtn = document.getElementById('back-to-history');
    }

    bindEvents() {
        this.startGameBtn.addEventListener('click', () => this.startGame());
        this.submitAnswerBtn.addEventListener('click', () => this.submitAnswer());
        this.nextQuestionBtn.addEventListener('click', () => this.nextQuestion());
        this.restartGameBtn.addEventListener('click', () => this.restartGame());
        this.newGameBtn.addEventListener('click', () => this.newGame());
        
        // History navigation
        this.showHistoryBtn.addEventListener('click', () => this.showHistory());
        this.showGameBtn.addEventListener('click', () => this.showGame());
        this.backToGameBtn.addEventListener('click', () => this.showGame());
        this.backToHistoryBtn.addEventListener('click', () => this.showHistory());
        
        // Allow Enter key to submit answer
        this.userAnswerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.answerSubmitted) {
                this.submitAnswer();
            }
        });
    }

    initializeSounds() {
        // Create audio context for sound effects
        this.audioContext = null;
        this.initAudioContext();
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    playSound(frequency, duration, type = 'sine') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        // Create envelope for better sound
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playCorrectSound() {
        // Upbeat sound: ascending major chord
        this.playSound(523.25, 0.2, 'sine'); // C5
        setTimeout(() => this.playSound(659.25, 0.2, 'sine'), 100); // E5
        setTimeout(() => this.playSound(783.99, 0.3, 'sine'), 200); // G5
    }

    playIncorrectSound() {
        // Sad sound: descending minor chord
        this.playSound(440, 0.3, 'triangle'); // A4
        setTimeout(() => this.playSound(392, 0.3, 'triangle'), 150); // G4
        setTimeout(() => this.playSound(349.23, 0.4, 'triangle'), 300); // F4
    }

    // Local Storage Functions
    saveTestResult(testData) {
        const results = this.getTestResults();
        results.push(testData);
        
        // Keep only last 30 days of results to prevent storage bloat
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const filteredResults = results.filter(result => 
            new Date(result.datetime) >= thirtyDaysAgo
        );
        
        localStorage.setItem('mathGameResults', JSON.stringify(filteredResults));
    }

    getTestResults() {
        const results = localStorage.getItem('mathGameResults');
        return results ? JSON.parse(results) : [];
    }

    getLast7DaysResults() {
        const allResults = this.getTestResults();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        
        return allResults.filter(result => 
            new Date(result.datetime) >= sevenDaysAgo
        );
    }

    groupResultsByDate(results) {
        const grouped = {};
        
        results.forEach(result => {
            const date = new Date(result.datetime).toDateString();
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(result);
        });
        
        return grouped;
    }

    // History Display Functions
    showHistory() {
        this.showPanel('history');
        this.displayHistory();
    }

    showGame() {
        this.showPanel('config');
    }

    displayHistory() {
        const results = this.getLast7DaysResults();
        const groupedResults = this.groupResultsByDate(results);
        
        if (Object.keys(groupedResults).length === 0) {
            this.historyContent.innerHTML = `
                <div class="no-history">
                    <p>No test history available yet. Start playing to see your progress!</p>
                </div>
            `;
            return;
        }

        // Sort dates in descending order (most recent first)
        const sortedDates = Object.keys(groupedResults).sort((a, b) => 
            new Date(b) - new Date(a)
        );

        let html = '';
        
        sortedDates.forEach(date => {
            const dayResults = groupedResults[date];
            const hasPassed = dayResults.some(result => result.passed);
            const totalRuns = dayResults.length;
            
            html += `
                <div class="day-summary ${hasPassed ? 'passed' : 'failed'}" data-date="${date}">
                    <div class="day-header">
                        <div class="day-date">${date}</div>
                        <div class="day-status ${hasPassed ? 'passed' : 'failed'}">
                            ${hasPassed ? 'PASSED' : 'FAILED'}
                        </div>
                    </div>
                    <div class="day-stats">${totalRuns} test${totalRuns > 1 ? 's' : ''} completed</div>
                    <div class="test-runs">
                        ${dayResults.map((result, index) => `
                            <div class="test-run" data-test-id="${result.id}">
                                <div class="test-run-header">
                                    <div class="test-time">Test ${index + 1} - ${new Date(result.datetime).toLocaleTimeString()}</div>
                                    <div class="test-score ${result.passed ? 'passed' : 'failed'}">
                                        ${result.score}/${result.totalQuestions * 10} (${Math.round((result.score / (result.totalQuestions * 10)) * 100)}%)
                                    </div>
                                </div>
                                <div class="test-summary">
                                    ${result.failedQuestions.length} question${result.failedQuestions.length !== 1 ? 's' : ''} failed
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        this.historyContent.innerHTML = html;
        
        // Add click listeners
        this.historyContent.querySelectorAll('.test-run').forEach(run => {
            run.addEventListener('click', (e) => {
                const testId = e.currentTarget.getAttribute('data-test-id');
                this.showTestDetail(testId);
            });
        });
    }

    showTestDetail(testId) {
        const results = this.getTestResults();
        const testData = results.find(result => result.id === testId);
        
        if (!testData) return;
        
        this.testDetailTitle.textContent = `Test Details - ${new Date(testData.datetime).toLocaleString()}`;
        
        const percentage = Math.round((testData.score / (testData.totalQuestions * 10)) * 100);
        
        this.testDetailContent.innerHTML = `
            <div class="test-overview">
                <h3>Test Overview</h3>
                <div class="test-stats">
                    <div class="stat-item">
                        <div class="stat-value ${testData.passed ? 'passed' : 'failed'}">${testData.passed ? 'PASSED' : 'FAILED'}</div>
                        <div class="stat-label">Result</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${testData.score}/${testData.totalQuestions * 10}</div>
                        <div class="stat-label">Score</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${percentage}%</div>
                        <div class="stat-label">Percentage</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${testData.failedQuestions.length}</div>
                        <div class="stat-label">Failed Questions</div>
                    </div>
                </div>
            </div>
            
            ${testData.failedQuestions.length > 0 ? `
                <div class="failed-questions">
                    <h3>Failed Questions</h3>
                    ${testData.failedQuestions.map(q => `
                        <div class="question-item">
                            <div class="question-text">${q.question}</div>
                            <div class="question-answers">
                                <div class="answer-item user-answer">Your answer: ${q.userAnswer}</div>
                                <div class="answer-item correct-answer">Correct answer: ${q.correctAnswer}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="failed-questions">
                    <h3>🎉 Perfect Score!</h3>
                    <p>You got all questions correct! Excellent work!</p>
                </div>
            `}
        `;
        
        this.showPanel('test-detail');
    }

    startGame() {
        // Validate configuration
        const xMin = parseInt(this.xMinInput.value);
        const xMax = parseInt(this.xMaxInput.value);
        const yMin = parseInt(this.yMinInput.value);
        const yMax = parseInt(this.yMaxInput.value);
        const totalQuestions = parseInt(this.totalQuestionsInput.value);

        if (xMin >= xMax || yMin >= yMax) {
            alert('Maximum values must be greater than minimum values!');
            return;
        }

        if (totalQuestions < 1) {
            alert('Total questions must be at least 1!');
            return;
        }

        // Initialize game
        this.totalQuestions = totalQuestions;
        this.currentQuestion = 0;
        this.score = 0;
        this.questions = [];
        this.answerSubmitted = false;
        this.failedQuestions = []; // Track failed questions for this test
        this.xMin = xMin;
        this.xMax = xMax;
        this.yMin = yMin;
        this.yMax = yMax;

        // Generate questions
        this.generateQuestions();

        // Show game panel
        this.showPanel('game');
        this.updateGameDisplay();
        this.showNextQuestion();
    }

    generateQuestions() {
        this.questions = [];
        const operations = ['+', '-', '*', '/'];
        
        for (let i = 0; i < this.totalQuestions; i++) {
            const operation = operations[Math.floor(Math.random() * operations.length)];
            let x, y, question, answer;
            
            do {
                x = Math.floor(Math.random() * (this.xMax - this.xMin + 1)) + this.xMin;
                y = Math.floor(Math.random() * (this.yMax - this.yMin + 1)) + this.yMin;
                
                switch (operation) {
                    case '+':
                        question = `${x} + ${y} = ?`;
                        answer = x + y;
                        break;
                    case '-':
                        // Ensure result is not negative
                        if (x < y) {
                            [x, y] = [y, x]; // Swap to ensure positive result
                        }
                        question = `${x} - ${y} = ?`;
                        answer = x - y;
                        break;
                    case '*':
                        question = `${x} × ${y} = ?`;
                        answer = x * y;
                        break;
                    case '/':
                        // Ensure division results in whole numbers
                        const product = x * y;
                        question = `${product} ÷ ${x} = ?`;
                        answer = y;
                        break;
                }
            } while (this.questions.some(q => q.question === question)); // Avoid duplicates
            
            this.questions.push({
                question,
                answer,
                operation,
                x,
                y
            });
        }
    }

    showNextQuestion() {
        if (this.currentQuestion >= this.totalQuestions) {
            this.endGame();
            return;
        }

        const question = this.questions[this.currentQuestion];
        this.questionElement.textContent = question.question;
        this.currentAnswer = question.answer;
        this.userAnswerInput.value = '';
        this.userAnswerInput.focus();
        this.answerSubmitted = false;
        
        // Enable submit button
        this.submitAnswerBtn.disabled = false;
        this.submitAnswerBtn.textContent = 'Submit';
        
        // Hide feedback and show question
        this.feedbackElement.classList.add('hidden');
        this.nextQuestionBtn.classList.add('hidden');
    }

    submitAnswer() {
        if (this.answerSubmitted) return;
        
        const userAnswer = parseFloat(this.userAnswerInput.value);
        
        if (isNaN(userAnswer)) {
            alert('Please enter a valid number!');
            return;
        }

        // Disable submit button and mark as submitted
        this.answerSubmitted = true;
        this.submitAnswerBtn.disabled = true;
        this.submitAnswerBtn.textContent = 'Submitted';

        const isCorrect = Math.abs(userAnswer - this.currentAnswer) < 0.001; // Handle floating point precision
        
        if (isCorrect) {
            this.score += 10;
            this.playCorrectSound();
            this.showFeedback(true, userAnswer, this.currentAnswer);
        } else {
            // Record failed question
            const currentQuestionData = this.questions[this.currentQuestion];
            this.failedQuestions.push({
                question: currentQuestionData.question,
                userAnswer: userAnswer,
                correctAnswer: this.currentAnswer
            });
            
            this.playIncorrectSound();
            this.showFeedback(false, userAnswer, this.currentAnswer);
        }
        
        this.updateGameDisplay();
    }

    showFeedback(isCorrect, userAnswer, correctAnswer) {
        this.feedbackElement.classList.remove('hidden');
        
        if (isCorrect) {
            this.feedbackElement.className = 'feedback correct';
            this.feedbackContent.innerHTML = `
                <div class="feedback-content">🎉 Correct! Great job!</div>
            `;
            // Auto-proceed to next question after 2 seconds for correct answers
            setTimeout(() => {
                this.nextQuestion();
            }, 2000);
        } else {
            this.feedbackElement.className = 'feedback incorrect';
            this.feedbackContent.innerHTML = `
                <div class="feedback-content">❌ Incorrect. Let's see the right answer:</div>
                <div class="answer-comparison">
                    <div class="answer-box user-answer-box">Your answer: ${userAnswer}</div>
                    <div class="answer-box correct-answer-box">Correct answer: ${correctAnswer}</div>
                </div>
            `;
            // Show next button after 5 seconds for incorrect answers
            setTimeout(() => {
                this.nextQuestionBtn.classList.remove('hidden');
            }, 5000);
        }
    }

    nextQuestion() {
        this.currentQuestion++;
        this.showNextQuestion();
    }

    endGame() {
        const percentage = (this.score / (this.totalQuestions * 10)) * 100;
        const passed = percentage >= 80;
        
        // Save test result to local storage
        const testData = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            datetime: new Date().toISOString(),
            passed: passed,
            score: this.score,
            totalQuestions: this.totalQuestions,
            percentage: percentage,
            failedQuestions: this.failedQuestions
        };
        
        this.saveTestResult(testData);
        
        this.showPanel('results');
        
        if (passed) {
            this.resultsPanel.className = 'results-panel pass';
            this.resultsContent.innerHTML = `
                <h2>🎉 PASSED! 🎉</h2>
                <div class="results-stats">
                    <p>Congratulations! You scored ${this.score} out of ${this.totalQuestions * 10} points!</p>
                    <p>That's ${percentage.toFixed(1)}% - Excellent work!</p>
                </div>
            `;
        } else {
            this.resultsPanel.className = 'results-panel fail';
            this.resultsContent.innerHTML = `
                <h2>😔 Try Again</h2>
                <div class="results-stats">
                    <p>You scored ${this.score} out of ${this.totalQuestions * 10} points.</p>
                    <p>That's ${percentage.toFixed(1)}% - You need 80% to pass.</p>
                    <p>Don't give up! Let's try again with new questions!</p>
                </div>
            `;
        }
    }

    restartGame() {
        // Generate new questions and restart
        this.generateQuestions();
        this.currentQuestion = 0;
        this.score = 0;
        this.answerSubmitted = false;
        this.failedQuestions = []; // Reset failed questions
        this.showPanel('game');
        this.updateGameDisplay();
        this.showNextQuestion();
    }

    newGame() {
        this.showPanel('config');
    }

    updateGameDisplay() {
        this.currentScoreElement.textContent = this.score;
        this.currentQuestionElement.textContent = this.currentQuestion + 1;
        this.totalQuestionsDisplay.textContent = this.totalQuestions;
    }

    showPanel(panelName) {
        // Hide all panels
        this.configPanel.classList.add('hidden');
        this.gamePanel.classList.add('hidden');
        this.resultsPanel.classList.add('hidden');
        this.historyPanel.classList.add('hidden');
        this.testDetailPanel.classList.add('hidden');
        
        // Show/hide header buttons
        if (panelName === 'history' || panelName === 'test-detail') {
            this.showHistoryBtn.classList.add('hidden');
            this.showGameBtn.classList.remove('hidden');
        } else {
            this.showHistoryBtn.classList.remove('hidden');
            this.showGameBtn.classList.add('hidden');
        }
        
        // Show selected panel
        switch (panelName) {
            case 'config':
                this.configPanel.classList.remove('hidden');
                break;
            case 'game':
                this.gamePanel.classList.remove('hidden');
                break;
            case 'results':
                this.resultsPanel.classList.remove('hidden');
                break;
            case 'history':
                this.historyPanel.classList.remove('hidden');
                break;
            case 'test-detail':
                this.testDetailPanel.classList.remove('hidden');
                break;
        }
        
        this.gameState = panelName;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MathGame();
});
