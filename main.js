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
        
        // Reset algorithm if it has a reset method
        const algorithmFunction = ALGORITHMS[this.currentAlgorithm];
        if (algorithmFunction && algorithmFunction.reset) {
            algorithmFunction.reset();
        }
        
        // Reset UI
        this.visualizer.clearPathVisualization();
        this.visualizer.updateBotPosition(this.botPos, this.botFacing);
        this.updateUI();
        
        // Reset controls
        this.updateControlButtons(false);
    }
    
    getRelativeWalls() {
        // Get walls relative to bot's current position and facing
        return getRelativeWalls(this.botPos, this.botFacing);
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
        
        // 🚨 CRITICAL: Check if bot tries to exit from START position (wrong implementation!)
        if (this.stepCount > 1 && this.botPos === config.startPos && this.botFacing !== config.startFacing) {
            this.pauseSimulation();
            alert(`❌ WRONG IMPLEMENTATION!\n\nAlgorithm tried to EXIT from the STARTING position!\nPosition: ${this.botPos}\nThis indicates the algorithm is exploring in the wrong direction.`);
            this.visualizer.showCompletionMessage(
                this.stepCount, 
                this.deadEndsVisited.size, 
                0, 
                false,
                '❌ Algorithm tried to exit from START!'
            );
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
            // Support both old format (direct function) and new format (object with getNextMove)
            if (typeof algorithmFunction === 'function') {
                // Old format: function(botPos, botFacing, state)
                result = algorithmFunction(this.botPos, this.botFacing, this.algorithmState);
            } else if (algorithmFunction.getNextMove) {
                // New format: object with getNextMove method
                const walls = this.getRelativeWalls();
                const move = algorithmFunction.getNextMove(
                    this.botPos, 
                    this.botFacing, 
                    walls, 
                    getMazeConfig()
                );
                result = { move: move, state: this.algorithmState };
            } else {
                throw new Error('Invalid algorithm format');
            }
        } catch (error) {
            console.error(`Error executing algorithm ${this.currentAlgorithm}:`, error);
            this.pauseSimulation();
            return;
        }
        
        // Update algorithm state
        this.algorithmState = result.state;
        
        // Handle STOP command - pause simulation
        if (result.move === 'STOP') {
            console.log('🎮 Algorithm returned STOP - pausing simulation');
            this.pauseSimulation();
            
            // Show completion message for manual input
            if (this.currentAlgorithm === 'manual-input') {
                const score = this.calculateCurrentScore();
                this.visualizer.showCompletionMessage(
                    this.stepCount, 
                    this.deadEndsVisited.size, 
                    score, 
                    false, 
                    'Manual commands completed!'
                );
            }
            return;
        }
        
        // CRITICAL: Move commands are ATOMIC operations
        // LEFT = Turn left AND move forward in that direction
        // RIGHT = Turn right AND move forward in that direction  
        // UTURN = Turn 180 AND move forward in that direction
        // FORWARD = Move forward in current direction (no turn)
        
        // Handle WAIT move - increment step but don't move
        if (result.move === 'WAIT') {
            this.stepCount++;
            // Don't move forward, just update UI and continue
        }
        // Handle all movement commands
        else if (result.move !== 'STOP') {
            this.stepCount++;
            
            // Determine which direction to check for walls BEFORE turning
            const walls = getRelativeWalls(this.botPos, this.botFacing);
            let canMove = false;
            
            // Check if the intended direction is open
            switch (result.move) {
                case 'FORWARD':
                    canMove = !walls.front;
                    break;
                case 'LEFT':
                    canMove = !walls.left;
                    break;
                case 'RIGHT':
                    canMove = !walls.right;
                    break;
                case 'UTURN':
                    // For U-turn, check behind (which is the opposite of front)
                    canMove = true; // U-turn is always allowed for turning
                    break;
            }
            
            // Now update facing based on move
            const newFacing = this.getNewFacing(result.move);
            this.botFacing = newFacing;
            
            // Only move forward if the path was clear
            if (canMove) {
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
                
                // Move to new position in the NEW facing direction
                const newWalls = getRelativeWalls(this.botPos, this.botFacing);
                if (!newWalls.front) {
                    const newPos = getForwardPosition(this.botPos, this.botFacing);
                    
                    // ✅ EXIT LOGIC: Check if bot is exiting the maze
                    // Bot must be ON exit square, FACING exit direction, and MOVING out of bounds
                    if (this.botPos === config.exitPos) {
                        const exitFacing = config.size === 9 ? 0 : 2; // North for given (9x9), South for surprise (8x8)
                        
                        if (this.botFacing === exitFacing && newPos < 0) {
                            // Bot is on exit square, facing correct direction, and moving out of bounds = SUCCESS!
                            console.log('🎉 EXIT DETECTED: Bot successfully exited the maze!');
                            this.pauseSimulation();
                            const score = this.calculateCurrentScore();
                            this.visualizer.showCompletionMessage(this.stepCount, this.deadEndsVisited.size, score, true);
                            return;
                        }
                    }
                    
                    if (newPos >= 0) {
                        this.botPos = newPos;
                    }
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
            case 'WAIT': return this.botFacing; // Stay facing the same direction
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