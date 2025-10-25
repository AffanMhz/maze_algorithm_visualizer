// Main Application Controller for Maze Algorithm Analyzer

class MazeAnalyzerApp {
    constructor() {
        this.visualizer = new MazeVisualizer();
        this.currentMaze = 'given';
        this.currentAlgorithm = 'left-hand';
        this.simulationSpeed = 300;
        
        // Simulation state
        this.isRunning = false;
        this.simulationInterval = null;
        this.botPos = 0;
        this.botFacing = 0;
        this.stepCount = 0;
        this.visitedCells = new Set();
        this.deadEndsVisited = new Set();
        this.algorithmState = {};
        
        this.initializeApp();
    }
    
    initializeApp() {
        this.setupEventListeners();
        this.resetSimulation();
        this.visualizer.drawMaze(this.currentMaze);
        this.updateUI();
    }
    
    setupEventListeners() {
        // Control buttons
        document.getElementById('start-btn').addEventListener('click', () => this.startSimulation());
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseSimulation());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetSimulation());
        document.getElementById('compare-all-btn').addEventListener('click', () => this.compareAllAlgorithms());
        
        // Settings
        document.getElementById('algo-select').addEventListener('change', (e) => {
            this.currentAlgorithm = e.target.value;
            this.resetSimulation();
        });
        
        document.getElementById('maze-select').addEventListener('change', (e) => {
            this.currentMaze = e.target.value;
            currentMaze = this.currentMaze; // Update global variable
            this.resetSimulation();
            this.visualizer.drawMaze(this.currentMaze);
        });
        
        document.getElementById('speed-slider').addEventListener('input', (e) => {
            this.simulationSpeed = parseInt(e.target.value);
            document.getElementById('speed-display').textContent = `${this.simulationSpeed}ms`;
            
            // Update running simulation
            if (this.isRunning) {
                this.pauseSimulation();
                this.startSimulation();
            }
        });
    }
    
    resetSimulation() {
        this.pauseSimulation();
        
        const config = getMazeConfig();
        this.botPos = config.startPos;
        this.botFacing = config.startFacing;
        this.stepCount = 0;
        this.visitedCells.clear();
        this.deadEndsVisited.clear();
        this.algorithmState = {};
        
        // Reset UI
        this.visualizer.clearPathVisualization();
        this.visualizer.updateBotPosition(this.botPos, this.botFacing);
        this.updateUI();
        
        // Reset controls
        this.updateControlButtons(false);
    }
    
    startSimulation() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.simulationInterval = setInterval(() => {
            this.simulationStep();
        }, this.simulationSpeed);
        
        this.updateControlButtons(true);
    }
    
    pauseSimulation() {
        this.isRunning = false;
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
        }
        
        this.updateControlButtons(false);
    }
    
    simulationStep() {
        console.log(`Step ${this.stepCount}: Algorithm=${this.currentAlgorithm}, Pos=${this.botPos}, Facing=${this.botFacing}`);
        
        const config = getMazeConfig();
        
        // Check win condition
        if (this.botPos === config.exitPos) {
            this.pauseSimulation();
            const score = this.calculateCurrentScore();
            this.visualizer.showCompletionMessage(this.stepCount, this.deadEndsVisited.size, score, true);
            return;
        }
        
        // Check step limit
        if (this.stepCount >= config.maxSteps) {
            this.pauseSimulation();
            const score = this.calculateCurrentScore();
            this.visualizer.showCompletionMessage(this.stepCount, this.deadEndsVisited.size, score, false);
            return;
        }
        
        // Execute algorithm step
        const algorithmFunction = ALGORITHMS[this.currentAlgorithm];
        
        if (!algorithmFunction) {
            console.error(`Algorithm function not found for: ${this.currentAlgorithm}`);
            this.pauseSimulation();
            return;
        }
        
        let result;
        try {
            result = algorithmFunction(this.botPos, this.botFacing, this.algorithmState);
        } catch (error) {
            console.error(`Error executing algorithm ${this.currentAlgorithm}:`, error);
            this.pauseSimulation();
            return;
        }
        
        // Update algorithm state
        this.algorithmState = result.state;
        
        // Update facing based on move
        const newFacing = this.getNewFacing(result.move);
        this.botFacing = newFacing;
        
        // Move forward (all moves except STOP result in forward movement)
        if (result.move !== 'STOP') {
            this.stepCount++;
            
            // Check if we can move forward
            const walls = getRelativeWalls(this.botPos, this.botFacing);
            if (!walls.front) {
                // Mark current position as visited
                this.visitedCells.add(this.botPos);
                
                // Check if current position is a dead end (before moving)
                if (result.move === 'UTURN' && isDeadEnd(this.botPos)) {
                    if (!this.deadEndsVisited.has(this.botPos)) {
                        this.deadEndsVisited.add(this.botPos);
                        this.visualizer.markVisitedCell(this.botPos, true);
                    }
                } else {
                    this.visualizer.markVisitedCell(this.botPos, false);
                }
                
                // Move to new position
                const newPos = getForwardPosition(this.botPos, this.botFacing);
                if (newPos >= 0) {
                    this.botPos = newPos;
                }
            }
        }
        
        // Update UI
        this.updateUI();
        this.visualizer.updateBotPosition(this.botPos, this.botFacing);
        this.visualizer.highlightCurrentCell(this.botPos);
        this.visualizer.updateSensorDisplay(result.sensorReadings);
        this.visualizer.updateDecisionProcess(result.explanation, result);
        this.visualizer.updateAdvancedLogic(result, this.currentAlgorithm);
    }
    
    getNewFacing(move) {
        switch (move) {
            case 'LEFT': return (this.botFacing + 3) % 4;
            case 'RIGHT': return (this.botFacing + 1) % 4;
            case 'UTURN': return (this.botFacing + 2) % 4;
            default: return this.botFacing;
        }
    }
    
    calculateCurrentScore() {
        const config = getMazeConfig();
        return getScoreForMaze(this.stepCount, this.deadEndsVisited.size, this.currentMaze);
    }
    
    updateUI() {
        const config = getMazeConfig();
        const score = this.calculateCurrentScore();
        
        this.visualizer.updateStatistics(
            this.stepCount,
            this.deadEndsVisited.size,
            config.totalDeadEnds,
            score
        );
    }
    
    updateControlButtons(isRunning) {
        document.getElementById('start-btn').disabled = isRunning;
        document.getElementById('pause-btn').disabled = !isRunning;
        document.getElementById('algo-select').disabled = isRunning;
        document.getElementById('maze-select').disabled = isRunning;
    }
    
    // Algorithm comparison functionality
    async compareAllAlgorithms() {
        const algorithms = Object.keys(ALGORITHMS);
        const results = {};
        
        // Show loading message
        const compareBtn = document.getElementById('compare-all-btn');
        const originalText = compareBtn.textContent;
        compareBtn.textContent = '🔄 Running Comparison...';
        compareBtn.disabled = true;
        
        try {
            for (const algorithm of algorithms) {
                // Test on given maze
                const givenResult = await this.testAlgorithm(algorithm, 'given');
                
                // Test on surprise maze
                const surpriseResult = await this.testAlgorithm(algorithm, 'surprise');
                
                results[algorithm] = {
                    steps: givenResult.steps,
                    deadEndsFound: givenResult.deadEndsFound,
                    totalDeadEnds: MAZE_CONFIGS.given.totalDeadEnds,
                    givenMazeScore: givenResult.score,
                    surpriseMazeScore: surpriseResult.score,
                    success: givenResult.success
                };
            }
            
            this.visualizer.displayComparisonResults(results);
            
        } finally {
            // Reset button
            compareBtn.textContent = originalText;
            compareBtn.disabled = false;
        }
    }
    
    async testAlgorithm(algorithmName, mazeType) {
        return new Promise((resolve) => {
            const originalMaze = this.currentMaze;
            const originalAlgorithm = this.currentAlgorithm;
            
            // Set test parameters
            this.currentMaze = mazeType;
            currentMaze = mazeType; // Update global
            this.currentAlgorithm = algorithmName;
            
            // Reset and prepare
            this.resetSimulation();
            
            const config = getMazeConfig();
            let testSteps = 0;
            let testDeadEndsVisited = new Set();
            let testVisitedCells = new Set();
            let testPos = config.startPos;
            let testFacing = config.startFacing;
            let testAlgorithmState = {};
            
            // Run simulation
            const maxIterations = config.maxSteps * 2; // Safety limit
            let iterations = 0;
            
            while (testPos !== config.exitPos && testSteps < config.maxSteps && iterations < maxIterations) {
                iterations++;
                
                const algorithmFunction = ALGORITHMS[algorithmName];
                const result = algorithmFunction(testPos, testFacing, testAlgorithmState);
                
                testAlgorithmState = result.state;
                
                // Update facing
                switch (result.move) {
                    case 'LEFT': testFacing = (testFacing + 3) % 4; break;
                    case 'RIGHT': testFacing = (testFacing + 1) % 4; break;
                    case 'UTURN': testFacing = (testFacing + 2) % 4; break;
                }
                
                // Move forward if possible
                if (result.move !== 'STOP') {
                    testSteps++;
                    
                    const walls = getRelativeWalls(testPos, testFacing);
                    if (!walls.front) {
                        testVisitedCells.add(testPos);
                        
                        // Check for dead end
                        if (result.move === 'UTURN' && isDeadEnd(testPos)) {
                            testDeadEndsVisited.add(testPos);
                        }
                        
                        const newPos = getForwardPosition(testPos, testFacing);
                        if (newPos >= 0) {
                            testPos = newPos;
                        }
                    }
                }
            }
            
            const score = getScoreForMaze(testSteps, testDeadEndsVisited.size, mazeType);
            const success = testPos === config.exitPos;
            
            // Restore original settings
            this.currentMaze = originalMaze;
            currentMaze = originalMaze;
            this.currentAlgorithm = originalAlgorithm;
            this.resetSimulation();
            
            resolve({
                steps: testSteps,
                deadEndsFound: testDeadEndsVisited.size,
                score: score,
                success: success
            });
        });
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.mazeApp = new MazeAnalyzerApp();
});

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MazeAnalyzerApp;
}