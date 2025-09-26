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
        this.attemptCount = 0; // Track number of attempts per question
        
        this.initializeElements();
        this.bindEvents();
        this.bindSettingsEvents();
        this.initializeSounds();
        this.loadSettings();
        this.setupMobileKeyboardHandling();
    }

    initializeElements() {
        // Panels
        this.configPanel = document.getElementById('config-panel');
        this.gamePanel = document.getElementById('game-panel');
        this.resultsPanel = document.getElementById('results-panel');
        this.historyPanel = document.getElementById('history-panel');
        this.testDetailPanel = document.getElementById('test-detail-panel');
        this.explanationSection = document.querySelector('.explanation-section');
        
        // Config elements
        this.xMinInput = document.getElementById('x-min');
        this.xMaxInput = document.getElementById('x-max');
        this.yMinInput = document.getElementById('y-min');
        this.yMaxInput = document.getElementById('y-max');
        this.totalQuestionsInput = document.getElementById('total-questions');
        this.startGameBtn = document.getElementById('start-game');
        
        // Operation checkboxes
        this.operationAdd = document.getElementById('operation-add');
        this.operationSubtract = document.getElementById('operation-subtract');
        this.operationMultiply = document.getElementById('operation-multiply');
        this.operationDivide = document.getElementById('operation-divide');
        
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

    getSelectedOperations() {
        const operations = [];
        if (this.operationAdd.checked) operations.push('+');
        if (this.operationSubtract.checked) operations.push('-');
        if (this.operationMultiply.checked) operations.push('*');
        if (this.operationDivide.checked) operations.push('/');
        return operations;
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

        // Check if at least one operation is selected
        const selectedOperations = this.getSelectedOperations();
        if (selectedOperations.length === 0) {
            alert('Please select at least one operation to practice!');
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
        this.selectedOperations = selectedOperations; // Store selected operations

        // Generate questions
        this.generateQuestions();

        // Show game panel
        this.showPanel('game');
        this.updateGameDisplay();
        this.showNextQuestion();
    }

    generateQuestions() {
        this.questions = [];
        const operations = this.selectedOperations || ['+', '-', '*', '/']; // Fallback to all operations
        
        // Get failed questions from history, categorized by time period
        const failedQuestionsByPeriod = this.getFailedQuestionsByTimePeriod();
        
        // Debug logging
        console.log('Selected operations:', this.selectedOperations);
        console.log('Failed questions by period:', {
            yesterday: failedQuestionsByPeriod.yesterday.length,
            sevenDay: failedQuestionsByPeriod.sevenDay.length,
            thirtyDay: failedQuestionsByPeriod.thirtyDay.length,
            total: failedQuestionsByPeriod.total
        });
        
        // If no failed questions exist, generate all new questions
        if (failedQuestionsByPeriod.total === 0) {
            this.generateAllNewQuestions(operations);
            return;
        }
        
        // Calculate how many questions to use from each category
        const questionAllocation = this.calculateQuestionAllocation(failedQuestionsByPeriod);
        
        // Generate questions based on allocation
        this.generateQuestionsFromAllocation(questionAllocation, failedQuestionsByPeriod, operations);
        
        // Safety check: ensure we have the required number of questions
        if (this.questions.length < this.totalQuestions) {
            this.ensureQuestionSetComplete(operations);
        }
    }

    getFailedQuestionsByTimePeriod() {
        const allResults = this.getTestResults();
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const yesterdayQuestions = [];
        const sevenDayQuestions = [];
        const thirtyDayQuestions = [];
        
        // Get selected operations for filtering
        const selectedOperations = this.selectedOperations || ['+', '-', '*', '/'];
        
        allResults.forEach(result => {
            const resultDate = new Date(result.datetime);
            
            // Only include questions from the last 30 days
            if (resultDate >= thirtyDaysAgo) {
                result.failedQuestions.forEach(failedQ => {
                    const questionData = {
                        ...failedQ,
                        operation: this.detectOperationFromQuestion(failedQ.question),
                        x: this.extractNumbersFromQuestion(failedQ.question).x,
                        y: this.extractNumbersFromQuestion(failedQ.question).y,
                        failedDate: resultDate
                    };
                    
                    // Only include questions that match selected operations
                    if (selectedOperations.includes(questionData.operation)) {
                        if (resultDate >= yesterday) {
                            yesterdayQuestions.push(questionData);
                        } else if (resultDate >= sevenDaysAgo) {
                            sevenDayQuestions.push(questionData);
                        } else {
                            thirtyDayQuestions.push(questionData);
                        }
                    }
                });
            }
        });
        
        return {
            yesterday: yesterdayQuestions,
            sevenDay: sevenDayQuestions,
            thirtyDay: thirtyDayQuestions,
            total: yesterdayQuestions.length + sevenDayQuestions.length + thirtyDayQuestions.length
        };
    }

    calculateQuestionAllocation(failedQuestionsByPeriod) {
        const totalQuestions = this.totalQuestions;
        const allocation = {
            yesterday: 0,
            sevenDay: 0,
            thirtyDay: 0,
            new: 0
        };
        
        // Calculate desired allocation based on percentages
        const desiredYesterday = Math.floor(totalQuestions * 0.3);
        const desiredSevenDay = Math.floor(totalQuestions * 0.2);
        const desiredThirtyDay = Math.floor(totalQuestions * 0.1);
        const desiredNew = totalQuestions - desiredYesterday - desiredSevenDay - desiredThirtyDay;
        
        // Allocate based on actual availability
        allocation.yesterday = Math.min(desiredYesterday, failedQuestionsByPeriod.yesterday.length);
        allocation.sevenDay = Math.min(desiredSevenDay, failedQuestionsByPeriod.sevenDay.length);
        allocation.thirtyDay = Math.min(desiredThirtyDay, failedQuestionsByPeriod.thirtyDay.length);
        
        // Calculate remaining questions for new questions
        const usedFromHistory = allocation.yesterday + allocation.sevenDay + allocation.thirtyDay;
        allocation.new = totalQuestions - usedFromHistory;
        
        return allocation;
    }

    generateQuestionsFromAllocation(allocation, failedQuestionsByPeriod, operations) {
        // Add yesterday's questions (only if available and matching operations)
        if (failedQuestionsByPeriod.yesterday.length > 0) {
            for (let i = 0; i < allocation.yesterday; i++) {
                const failedQ = failedQuestionsByPeriod.yesterday[Math.floor(Math.random() * failedQuestionsByPeriod.yesterday.length)];
                this.questions.push({
                    question: failedQ.question,
                    answer: failedQ.correctAnswer,
                    operation: failedQ.operation,
                    x: failedQ.x,
                    y: failedQ.y,
                    isFromHistory: true
                });
            }
        }
        
        // Add 7-day questions (only if available and matching operations)
        if (failedQuestionsByPeriod.sevenDay.length > 0) {
            for (let i = 0; i < allocation.sevenDay; i++) {
                const failedQ = failedQuestionsByPeriod.sevenDay[Math.floor(Math.random() * failedQuestionsByPeriod.sevenDay.length)];
                this.questions.push({
                    question: failedQ.question,
                    answer: failedQ.correctAnswer,
                    operation: failedQ.operation,
                    x: failedQ.x,
                    y: failedQ.y,
                    isFromHistory: true
                });
            }
        }
        
        // Add 30-day questions (only if available and matching operations)
        if (failedQuestionsByPeriod.thirtyDay.length > 0) {
            for (let i = 0; i < allocation.thirtyDay; i++) {
                const failedQ = failedQuestionsByPeriod.thirtyDay[Math.floor(Math.random() * failedQuestionsByPeriod.thirtyDay.length)];
                this.questions.push({
                    question: failedQ.question,
                    answer: failedQ.correctAnswer,
                    operation: failedQ.operation,
                    x: failedQ.x,
                    y: failedQ.y,
                    isFromHistory: true
                });
            }
        }
        
        // Add new questions (always generate these to fill remaining slots)
        for (let i = 0; i < allocation.new; i++) {
            const newQuestion = this.generateSingleNewQuestion(operations);
            this.questions.push({
                question: newQuestion.question,
                answer: newQuestion.answer,
                operation: newQuestion.operation,
                x: newQuestion.x,
                y: newQuestion.y,
                isFromHistory: false
            });
        }
    }

    generateAllNewQuestions(operations) {
        for (let i = 0; i < this.totalQuestions; i++) {
            const newQuestion = this.generateSingleNewQuestion(operations);
            this.questions.push({
                question: newQuestion.question,
                answer: newQuestion.answer,
                operation: newQuestion.operation,
                x: newQuestion.x,
                y: newQuestion.y,
                isFromHistory: false
            });
        }
    }

    generateSingleNewQuestion(operations) {
        let question, answer, operation, x, y;
        
        operation = operations[Math.floor(Math.random() * operations.length)];
        
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
        
        return { question, answer, operation, x, y };
    }


    detectOperationFromQuestion(question) {
        if (question.includes(' + ')) return '+';
        if (question.includes(' - ')) return '-';
        if (question.includes(' × ')) return '*';
        if (question.includes(' ÷ ')) return '/';
        return '+'; // Default fallback
    }

    extractNumbersFromQuestion(question) {
        const numbers = question.match(/\d+/g);
        if (numbers && numbers.length >= 2) {
            return {
                x: parseInt(numbers[0]),
                y: parseInt(numbers[1])
            };
        }
        return { x: 1, y: 1 }; // Default fallback
    }


    // Fallback method to ensure we always have enough questions
    ensureQuestionSetComplete(operations) {
        while (this.questions.length < this.totalQuestions) {
            const newQuestion = this.generateSingleNewQuestion(operations);
            this.questions.push({
                question: newQuestion.question,
                answer: newQuestion.answer,
                operation: newQuestion.operation,
                x: newQuestion.x,
                y: newQuestion.y,
                isFromHistory: false
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
        this.attemptCount = 0; // Reset attempt count for new question
        
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

        this.attemptCount++;
        const isCorrect = Math.abs(userAnswer - this.currentAnswer) < 0.001; // Handle floating point precision
        
        if (isCorrect) {
            // Correct answer - proceed normally
            this.answerSubmitted = true;
            this.submitAnswerBtn.disabled = true;
            this.submitAnswerBtn.textContent = 'Submitted';
            
            this.score += 10;
            this.playCorrectSound();
            this.showFeedback(true, userAnswer, this.currentAnswer);
        } else {
            // Wrong answer - check if this is first or second attempt
            if (this.attemptCount === 1) {
                // First wrong attempt - give second chance
                this.playIncorrectSound();
                this.showSecondChanceFeedback(userAnswer);
            } else {
                // Second wrong attempt - show correct answer
                this.answerSubmitted = true;
                this.submitAnswerBtn.disabled = true;
                this.submitAnswerBtn.textContent = 'Submitted';
                
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
        }
        
        this.updateGameDisplay();
    }

    showSecondChanceFeedback(userAnswer) {
        this.feedbackElement.classList.remove('hidden');
        this.feedbackElement.className = 'feedback incorrect';
        this.feedbackContent.innerHTML = `
            <div class="feedback-content">❌ Incorrect. You have one more try!</div>
            <div class="second-chance-message">
                <p>Think carefully and try again. You can do it! 💪</p>
            </div>
        `;
        
        // Clear the input and focus for second attempt
        this.userAnswerInput.value = '';
        this.userAnswerInput.focus();
        
        // Keep submit button enabled for second attempt
        this.submitAnswerBtn.disabled = false;
        this.submitAnswerBtn.textContent = 'Try Again';
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
                <div class="feedback-content">❌ Incorrect. Please enter the correct answer to continue:</div>
                <div class="answer-comparison">
                    <div class="answer-box user-answer-box">Your answer: ${userAnswer}</div>
                    <div class="answer-box correct-answer-box">Correct answer: ${correctAnswer}</div>
                </div>
                <div class="correct-answer-input">
                    <input type="number" id="correct-answer-input" placeholder="Enter the correct answer..." step="any">
                    <button id="verify-correct-answer" class="btn btn-verify" disabled>Verify Answer</button>
                </div>
            `;
            
            // Set up the correct answer verification
            this.setupCorrectAnswerVerification(correctAnswer);
        }
    }

    setupCorrectAnswerVerification(correctAnswer) {
        const correctAnswerInput = document.getElementById('correct-answer-input');
        const verifyBtn = document.getElementById('verify-correct-answer');
        
        // Enable verify button when user types the correct answer
        correctAnswerInput.addEventListener('input', () => {
            const userInput = parseFloat(correctAnswerInput.value);
            const isCorrect = !isNaN(userInput) && Math.abs(userInput - correctAnswer) < 0.001;
            verifyBtn.disabled = !isCorrect;
            
            if (isCorrect) {
                verifyBtn.classList.add('btn-success');
                verifyBtn.textContent = '✓ Correct!';
            } else {
                verifyBtn.classList.remove('btn-success');
                verifyBtn.textContent = 'Verify Answer';
            }
        });
        
        // Allow Enter key to verify
        correctAnswerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !verifyBtn.disabled) {
                this.nextQuestion();
            }
        });
        
        // Verify button click
        verifyBtn.addEventListener('click', () => {
            if (!verifyBtn.disabled) {
                this.nextQuestion();
            }
        });
        
        // Focus on the input
        correctAnswerInput.focus();
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
        this.attemptCount = 0; // Reset attempt count
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
        
        // Update operations display in game header
        this.updateOperationsDisplay();
    }

    updateOperationsDisplay() {
        const operationsDisplay = document.getElementById('operations-display');
        if (operationsDisplay) {
            const operationSymbols = {
                '+': '+',
                '-': '-', 
                '*': '×',
                '/': '÷'
            };
            
            const selectedOps = this.selectedOperations || [];
            const displayText = selectedOps.map(op => operationSymbols[op]).join(' ');
            operationsDisplay.textContent = displayText;
        }
    }

    showPanel(panelName) {
        // Hide all panels
        this.configPanel.classList.add('hidden');
        this.gamePanel.classList.add('hidden');
        this.resultsPanel.classList.add('hidden');
        this.historyPanel.classList.add('hidden');
        this.testDetailPanel.classList.add('hidden');
        
        // Show/hide header buttons based on panel
        if (panelName === 'config') {
            // Only show "View History" on the config page
            this.showHistoryBtn.classList.remove('hidden');
            this.showGameBtn.classList.add('hidden');
        } else if (panelName === 'history' || panelName === 'test-detail') {
            // Show "Back to Game" when in history or test detail
            this.showHistoryBtn.classList.add('hidden');
            this.showGameBtn.classList.remove('hidden');
        } else {
            // Hide both buttons for game and results panels
            this.showHistoryBtn.classList.add('hidden');
            this.showGameBtn.classList.add('hidden');
        }
        
        // Show selected panel
        switch (panelName) {
            case 'config':
                this.configPanel.classList.remove('hidden');
                // Show explanation section only on config page
                if (this.explanationSection) {
                    this.explanationSection.classList.remove('hidden');
                }
                break;
            case 'game':
                this.gamePanel.classList.remove('hidden');
                // Hide explanation section during game
                if (this.explanationSection) {
                    this.explanationSection.classList.add('hidden');
                }
                break;
            case 'results':
                this.resultsPanel.classList.remove('hidden');
                // Hide explanation section on results page
                if (this.explanationSection) {
                    this.explanationSection.classList.add('hidden');
                }
                break;
            case 'history':
                this.historyPanel.classList.remove('hidden');
                // Hide explanation section on history page
                if (this.explanationSection) {
                    this.explanationSection.classList.add('hidden');
                }
                break;
            case 'test-detail':
                this.testDetailPanel.classList.remove('hidden');
                // Hide explanation section on test detail page
                if (this.explanationSection) {
                    this.explanationSection.classList.add('hidden');
                }
                break;
        }
        
        this.gameState = panelName;
    }

    // Settings persistence functions
    saveSettings() {
        const settings = {
            xMin: this.xMinInput.value,
            xMax: this.xMaxInput.value,
            yMin: this.yMinInput.value,
            yMax: this.yMaxInput.value,
            totalQuestions: this.totalQuestionsInput.value,
            operationAdd: this.operationAdd.checked,
            operationSubtract: this.operationSubtract.checked,
            operationMultiply: this.operationMultiply.checked,
            operationDivide: this.operationDivide.checked
        };
        
        localStorage.setItem('mathGameSettings', JSON.stringify(settings));
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('mathGameSettings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                
                // Load number inputs
                this.xMinInput.value = settings.xMin || 1;
                this.xMaxInput.value = settings.xMax || 10;
                this.yMinInput.value = settings.yMin || 1;
                this.yMaxInput.value = settings.yMax || 10;
                this.totalQuestionsInput.value = settings.totalQuestions || 10;
                
                // Load operation checkboxes
                this.operationAdd.checked = settings.operationAdd !== false; // Default to true
                this.operationSubtract.checked = settings.operationSubtract !== false; // Default to true
                this.operationMultiply.checked = settings.operationMultiply !== false; // Default to true
                this.operationDivide.checked = settings.operationDivide !== false; // Default to true
                
                console.log('Settings loaded from localStorage:', settings);
            } catch (error) {
                console.log('Error loading settings:', error);
                // Use default values if loading fails
            }
        }
    }

    // Add event listeners for auto-saving settings
    bindSettingsEvents() {
        // Save settings when any input changes
        this.xMinInput.addEventListener('change', () => this.saveSettings());
        this.xMaxInput.addEventListener('change', () => this.saveSettings());
        this.yMinInput.addEventListener('change', () => this.saveSettings());
        this.yMaxInput.addEventListener('change', () => this.saveSettings());
        this.totalQuestionsInput.addEventListener('change', () => this.saveSettings());
        
        // Save settings when checkboxes change
        this.operationAdd.addEventListener('change', () => this.saveSettings());
        this.operationSubtract.addEventListener('change', () => this.saveSettings());
        this.operationMultiply.addEventListener('change', () => this.saveSettings());
        this.operationDivide.addEventListener('change', () => this.saveSettings());
    }

    setupMobileKeyboardHandling() {
        // Handle mobile keyboard appearance/disappearance
        if (window.visualViewport) {
            // Modern browsers with visual viewport API
            window.visualViewport.addEventListener('resize', () => {
                this.handleViewportChange();
            });
        } else {
            // Fallback for older browsers
            window.addEventListener('resize', () => {
                this.handleViewportChange();
            });
        }
        
        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleViewportChange();
                // Refocus input after orientation change
                if (this.gameState === 'game' && this.userAnswerInput) {
                    this.focusInputWithMobileKeyboard();
                }
            }, 500);
        });
    }

    handleViewportChange() {
        // Adjust layout when mobile keyboard appears/disappears
        const input = this.userAnswerInput;
        if (input && this.gameState === 'game') {
            // Scroll input into view when keyboard appears
            setTimeout(() => {
                input.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'center'
                });
            }, 100);
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MathGame();
});
